/**
 * controllers/cart.controller.js
 * Firestore-backed cart: one document per user at /carts/{uid}
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Enrich cart items with fresh product data
const enrichItems = async (items) => {
  const enriched = [];
  for (const item of items) {
    const prodDoc = await db.collection('products').doc(item.productId).get();
    if (prodDoc.exists) {
      const p = prodDoc.data();
      enriched.push({
        ...item,
        product: {
          _id: prodDoc.id,
          id: prodDoc.id,
          name: p.name,
          images: p.images || [],
          price: p.price,
          discountPrice: p.discountPrice || null,
          stock: p.stock,
          unit: p.unit,
          isActive: p.isActive,
          slug: p.slug,
        },
      });
    }
  }
  return enriched;
};

/**
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const cartDoc = await db.collection('carts').doc(req.user.uid).get();

  if (!cartDoc.exists) {
    return res.json({ success: true, items: [], total: 0 });
  }

  const items = cartDoc.data().items || [];
  const enriched = await enrichItems(items);
  res.json({ success: true, items: enriched, total: computeTotal(items) });
});

/**
 * POST /api/cart
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required.');
  }

  const qty = Math.max(1, parseInt(quantity, 10));
  const prodDoc = await db.collection('products').doc(productId).get();

  if (!prodDoc.exists || !prodDoc.data().isActive) {
    res.status(404);
    throw new Error('Product not found or unavailable.');
  }

  const product = prodDoc.data();
  if (product.stock < qty) {
    res.status(400);
    throw new Error(`Only ${product.stock} unit(s) left in stock.`);
  }

  const effectivePrice =
    product.discountPrice && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const cartRef = db.collection('carts').doc(req.user.uid);
  const cartDoc = await cartRef.get();

  let items = cartDoc.exists ? cartDoc.data().items || [] : [];
  const existingIdx = items.findIndex((i) => i.productId === productId);

  if (existingIdx > -1) {
    const newQty = items[existingIdx].quantity + qty;
    if (product.stock < newQty) {
      res.status(400);
      throw new Error(`Only ${product.stock} unit(s) available.`);
    }
    items[existingIdx].quantity = newQty;
    items[existingIdx].price = effectivePrice;
  } else {
    items.push({ productId, quantity: qty, price: effectivePrice });
  }

  await cartRef.set({ userId: req.user.uid, items, updatedAt: new Date().toISOString() });

  const enriched = await enrichItems(items);
  res.status(201).json({ success: true, items: enriched, total: computeTotal(items) });
});

/**
 * PUT /api/cart/:productId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1.');
  }

  const qty = parseInt(quantity, 10);
  const prodDoc = await db.collection('products').doc(productId).get();

  if (!prodDoc.exists || !prodDoc.data().isActive) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (prodDoc.data().stock < qty) {
    res.status(400);
    throw new Error(`Only ${prodDoc.data().stock} unit(s) left in stock.`);
  }

  const cartRef = db.collection('carts').doc(req.user.uid);
  const cartDoc = await cartRef.get();

  if (!cartDoc.exists) {
    res.status(404);
    throw new Error('Cart not found.');
  }

  let items = cartDoc.data().items || [];
  const idx = items.findIndex((i) => i.productId === productId);

  if (idx === -1) {
    res.status(404);
    throw new Error('Item not in cart.');
  }

  items[idx].quantity = qty;
  await cartRef.update({ items, updatedAt: new Date().toISOString() });

  const enriched = await enrichItems(items);
  res.json({ success: true, items: enriched, total: computeTotal(items) });
});

/**
 * DELETE /api/cart/:productId
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cartRef = db.collection('carts').doc(req.user.uid);
  const cartDoc = await cartRef.get();

  if (!cartDoc.exists) {
    res.status(404);
    throw new Error('Cart not found.');
  }

  let items = cartDoc.data().items || [];
  const before = items.length;
  items = items.filter((i) => i.productId !== productId);

  if (items.length === before) {
    res.status(404);
    throw new Error('Item not found in cart.');
  }

  await cartRef.update({ items, updatedAt: new Date().toISOString() });
  const enriched = await enrichItems(items);
  res.json({ success: true, items: enriched, total: computeTotal(items) });
});

/**
 * DELETE /api/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  await db.collection('carts').doc(req.user.uid).delete();
  res.json({ success: true, message: 'Cart cleared.' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
