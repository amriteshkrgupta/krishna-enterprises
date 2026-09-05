/**
 * controllers/product.controller.js
 * Firestore-backed product CRUD with zero-config in-memory filtering & sorting.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const docToProduct = (doc) => {
  const data = doc.data();
  const price = data.price || 0;
  const discountPrice = data.discountPrice || null;
  const stock = data.stock || 0;
  return {
    id: doc.id,
    _id: doc.id,
    ...data,
    isInStock: stock > 0,
    discount: discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0,
    category: data.categoryId
      ? { _id: data.categoryId, id: data.categoryId, name: data.categoryName || '', slug: data.categorySlug || '' }
      : null,
  };
};

/**
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    inStock,
    featured,
    page = 1,
    limit = 12,
    sort = 'newest',
    search,
    minPrice,
    maxPrice,
  } = req.query;

  const snap = await db.collection('products').get();
  let products = snap.docs.map(docToProduct);

  if (category) {
    products = products.filter((p) => p.categorySlug === category || p.categoryId === category);
  }

  if (inStock === 'true') products = products.filter((p) => p.stock > 0);
  if (featured === 'true') products = products.filter((p) => p.featured === true);

  if (search) {
    const q = search.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  if (minPrice) products = products.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));

  // In-memory sorting
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else {
    products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  const total = products.length;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const paginated = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    products: paginated,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

/**
 * GET /api/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const snap = await db.collection('products').get();
  const products = snap.docs
    .map(docToProduct)
    .filter((p) => p.isActive !== false && p.featured && p.stock > 0)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);

  res.json({ success: true, count: products.length, products });
});

/**
 * GET /api/products/:slug
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const param = req.params.slug;

  const snap = await db.collection('products').doc(param).get();
  if (snap.exists && snap.data().isActive !== false) {
    return res.json({ success: true, product: docToProduct(snap) });
  }

  const slugSnap = await db.collection('products')
    .where('slug', '==', param)
    .limit(1)
    .get();

  if (slugSnap.empty) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.json({ success: true, product: docToProduct(slugSnap.docs[0]) });
});

/**
 * GET /api/products/search
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ success: true, products: [] });
  }

  const query = q.toLowerCase().trim();
  const snap = await db.collection('products').get();

  const products = snap.docs
    .map(docToProduct)
    .filter(
      (p) =>
        p.isActive !== false &&
        (p.name.toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          (p.categoryName || '').toLowerCase().includes(query) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(query)))
    )
    .slice(0, 20);

  res.json({ success: true, count: products.length, products });
});

/**
 * POST /api/products/admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, discountPrice, stock, unit, tags, featured } = req.body;

  if (!name || !category || price === undefined || stock === undefined) {
    res.status(400);
    throw new Error('Name, category, price, and stock are required.');
  }

  const catDoc = await db.collection('categories').doc(category).get();
  if (!catDoc.exists) {
    res.status(404);
    throw new Error('Category not found.');
  }
  const catData = catDoc.data();

  const images = req.files && req.files.length > 0
    ? req.files.map((f) => f.location || `/uploads/${f.filename}`)
    : [];

  const now = new Date().toISOString();
  const slug = slugify(name);

  const data = {
    name: name.trim(),
    slug,
    description: description || '',
    categoryId: category,
    categoryName: catData.name || '',
    categorySlug: catData.slug || '',
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    images: images.length > 0 ? images : ['https://via.placeholder.com/400x400?text=Product'],
    stock: Number(stock),
    unit: unit || 'piece',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    featured: featured === 'true' || featured === true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection('products').add(data);
  res.status(201).json({ success: true, product: { id: ref.id, _id: ref.id, ...data } });
});

/**
 * PUT /api/products/admin/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const ref = db.collection('products').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const { name, description, category, price, discountPrice, stock, unit, tags, featured, isActive } = req.body;
  const updates = { updatedAt: new Date().toISOString() };

  if (name !== undefined) { updates.name = name.trim(); updates.slug = slugify(name); }
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (discountPrice !== undefined) updates.discountPrice = discountPrice !== '' ? Number(discountPrice) : null;
  if (stock !== undefined) updates.stock = Number(stock);
  if (unit !== undefined) updates.unit = unit;
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
  if (featured !== undefined) updates.featured = featured === 'true' || featured === true;
  if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;

  if (category !== undefined) {
    const catDoc = await db.collection('categories').doc(category).get();
    if (catDoc.exists) {
      const catData = catDoc.data();
      updates.categoryId = category;
      updates.categoryName = catData.name || '';
      updates.categorySlug = catData.slug || '';
    }
  }

  if (req.files && req.files.length > 0) {
    const existingImages = snap.data().images || [];
    updates.images = [...existingImages, ...req.files.map((f) => f.location || `/uploads/${f.filename}`)];
  }

  await ref.update(updates);
  const updated = await ref.get();
  res.json({ success: true, product: docToProduct(updated) });
});

/**
 * DELETE /api/products/admin/:id (soft-delete)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const ref = db.collection('products').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Product not found.');
  }

  await ref.update({ isActive: false, updatedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Product deactivated successfully.' });
});

/**
 * PUT /api/products/admin/:id/stock
 */
const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || stock === null) {
    res.status(400);
    throw new Error('Stock quantity is required.');
  }

  const ref = db.collection('products').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const newStock = Math.max(0, Number(stock));
  await ref.update({ stock: newStock, updatedAt: new Date().toISOString() });

  res.json({ success: true, message: 'Stock updated.', stock: newStock });
});

/**
 * GET /api/products/admin/low-stock
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const snap = await db.collection('products').get();
  const products = snap.docs
    .map(docToProduct)
    .filter((p) => p.isActive !== false && p.stock < 10)
    .sort((a, b) => a.stock - b.stock);

  res.json({ success: true, count: products.length, products });
});

/**
 * POST /api/products/admin/bulk-action
 */
const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { ids, action, addStock } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Product IDs array is required.');
  }

  const batch = db.batch();
  const now = new Date().toISOString();

  for (const id of ids) {
    const ref = db.collection('products').doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;

    if (action === 'activate') {
      batch.update(ref, { isActive: true, updatedAt: now });
    } else if (action === 'deactivate' || action === 'delete') {
      batch.update(ref, { isActive: false, updatedAt: now });
    } else if (action === 'addStock' && addStock) {
      const currentStock = snap.data().stock || 0;
      batch.update(ref, { stock: currentStock + Number(addStock), updatedAt: now });
    }
  }

  await batch.commit();
  res.json({ success: true, message: `Bulk action '${action}' completed for ${ids.length} item(s).` });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  bulkUpdateProducts,
};
