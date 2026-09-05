/**
 * controllers/offer.controller.js
 * Firestore-backed coupon/offer CRUD and validation with zero-index in-memory sorting.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

const docToOffer = (doc) => ({ id: doc.id, _id: doc.id, ...doc.data() });

/**
 * POST /api/offers/validate
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) { res.status(400); throw new Error('Coupon code is required.'); }
  if (!cartTotal || cartTotal <= 0) { res.status(400); throw new Error('Valid cart total is required.'); }

  const snap = await db.collection('offers').get();
  const offerDoc = snap.docs.find(
    (d) => (d.data().code || '').toUpperCase().trim() === code.toUpperCase().trim() && d.data().isActive === true
  );

  if (!offerDoc) { res.status(404); throw new Error('Invalid or inactive coupon code.'); }

  const offer = offerDoc.data();

  if (offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
    res.status(400); throw new Error('This coupon has expired.');
  }

  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) {
    res.status(400); throw new Error('Coupon usage limit reached.');
  }

  if (cartTotal < offer.minOrderAmount) {
    res.status(400); throw new Error(`Minimum order of Rs.${offer.minOrderAmount} required.`);
  }

  let discountAmount = 0;
  if (offer.discountType === 'flat') {
    discountAmount = offer.discountValue;
  } else {
    discountAmount = (cartTotal * offer.discountValue) / 100;
    if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
  }
  discountAmount = Math.round(Math.min(discountAmount, cartTotal));

  res.json({
    success: true,
    coupon: {
      code: offer.code,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountAmount,
    },
  });
});

/**
 * POST /api/offers/admin
 */
const createOffer = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit, isActive } = req.body;

  if (!code || !discountType || !discountValue) {
    res.status(400); throw new Error('Code, discountType, and discountValue are required.');
  }

  const now = new Date().toISOString();
  const data = {
    code: code.toUpperCase().trim(),
    description: description || '',
    discountType,
    discountValue: Number(discountValue),
    minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    expiresAt: expiresAt || null,
    usageLimit: usageLimit !== undefined ? Number(usageLimit) : null,
    usedCount: 0,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection('offers').add(data);
  res.status(201).json({ success: true, offer: { id: ref.id, _id: ref.id, ...data } });
});

/**
 * GET /api/offers/admin
 */
const getAllOffers = asyncHandler(async (req, res) => {
  const snap = await db.collection('offers').get();
  const offers = snap.docs
    .map(docToOffer)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  res.json({ success: true, count: offers.length, offers });
});

/**
 * PUT /api/offers/admin/:id
 */
const updateOffer = asyncHandler(async (req, res) => {
  const ref = db.collection('offers').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) { res.status(404); throw new Error('Offer not found.'); }

  const { description, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit, isActive } = req.body;
  const updates = { updatedAt: new Date().toISOString() };

  if (description !== undefined) updates.description = description;
  if (discountType !== undefined) updates.discountType = discountType;
  if (discountValue !== undefined) updates.discountValue = Number(discountValue);
  if (minOrderAmount !== undefined) updates.minOrderAmount = Number(minOrderAmount);
  if (maxDiscount !== undefined) updates.maxDiscount = Number(maxDiscount);
  if (expiresAt !== undefined) updates.expiresAt = expiresAt;
  if (usageLimit !== undefined) updates.usageLimit = Number(usageLimit);
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  await ref.update(updates);
  const updated = await ref.get();
  res.json({ success: true, offer: docToOffer(updated) });
});

/**
 * DELETE /api/offers/admin/:id
 */
const deleteOffer = asyncHandler(async (req, res) => {
  const ref = db.collection('offers').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) { res.status(404); throw new Error('Offer not found.'); }

  await ref.delete();
  res.json({ success: true, message: 'Offer deleted successfully.' });
});

module.exports = { validateCoupon, createOffer, getAllOffers, updateOffer, deleteOffer };
