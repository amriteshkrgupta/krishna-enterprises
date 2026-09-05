/**
 * controllers/category.controller.js
 * Firestore-backed CRUD for product categories with zero-config in-memory sorting.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const docToCategory = (doc) => ({ id: doc.id, _id: doc.id, ...doc.data() });

/**
 * GET /api/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const snap = await db.collection('categories').where('isActive', '==', true).get();
  const categories = snap.docs.map(docToCategory);
  categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ success: true, count: categories.length, categories });
});

/**
 * GET /api/categories/:slug
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const snap = await db.collection('categories')
    .where('slug', '==', req.params.slug)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) {
    res.status(404);
    throw new Error('Category not found.');
  }

  res.json({ success: true, category: docToCategory(snap.docs[0]) });
});

/**
 * POST /api/categories/admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, sortOrder } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required.');
  }

  const slug = slugify(name);
  const now = new Date().toISOString();

  const data = {
    name: name.trim(),
    slug,
    description: description || '',
    image: image || 'https://via.placeholder.com/400x400?text=Category',
    isActive: true,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection('categories').add(data);
  res.status(201).json({ success: true, category: { id: ref.id, _id: ref.id, ...data } });
});

/**
 * PUT /api/categories/admin/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const ref = db.collection('categories').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Category not found.');
  }

  const { name, description, image, sortOrder, isActive } = req.body;
  const updates = { updatedAt: new Date().toISOString() };

  if (name !== undefined) { updates.name = name.trim(); updates.slug = slugify(name); }
  if (description !== undefined) updates.description = description;
  if (image !== undefined) updates.image = image;
  if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  await ref.update(updates);
  const updated = await ref.get();
  res.json({ success: true, category: docToCategory(updated) });
});

/**
 * DELETE /api/categories/admin/:id  (soft-delete)
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const ref = db.collection('categories').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Category not found.');
  }

  const productsSnap = await db.collection('products')
    .where('categoryId', '==', req.params.id)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (!productsSnap.empty) {
    res.status(400);
    throw new Error('Cannot delete category - it has active products. Deactivate them first.');
  }

  await ref.update({ isActive: false, updatedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Category deactivated successfully.' });
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
