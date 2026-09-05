/**
 * controllers/order.controller.js
 * Firestore-backed order placement, tracking, cancellation, and admin management with zero-index in-memory sorting.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

const DELIVERY_FEE = 50;
const FREE_DELIVERY_THRESHOLD = 500;

// ── helpers ───────────────────────────────────────────────────────────────────
const docToOrder = (doc) => ({ id: doc.id, _id: doc.id, ...doc.data() });

const applyCoupon = async (code, subtotal) => {
  const snap = await db.collection('offers')
    .where('code', '==', code.toUpperCase())
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) throw new Error('Invalid or inactive coupon code.');
  const offer = snap.docs[0].data();
  const offerId = snap.docs[0].id;

  if (offer.expiresAt && new Date() > new Date(offer.expiresAt)) throw new Error('Coupon has expired.');
  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) throw new Error('Coupon usage limit reached.');
  if (subtotal < offer.minOrderAmount) throw new Error(`Minimum order of Rs.${offer.minOrderAmount} required.`);

  let discount = 0;
  if (offer.discountType === 'flat') {
    discount = offer.discountValue;
  } else {
    discount = (subtotal * offer.discountValue) / 100;
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  }

  return { offerId, offer, discount: Math.round(discount) };
};

/**
 * POST /api/orders
 */
const placeOrder = asyncHandler(async (req, res) => {
  const {
    items: bodyItems,
    deliveryAddress,
    deliverySlot,
    paymentMethod = 'UPI_QR',
    transaction_id,
    upiTransactionId,
    paymentScreenshot,
    couponCode,
    notes,
  } = req.body;

  if (
    !deliveryAddress ||
    !deliveryAddress.street ||
    !deliveryAddress.city ||
    !deliveryAddress.state ||
    !deliveryAddress.pincode ||
    !deliveryAddress.phone
  ) {
    res.status(400);
    throw new Error('Complete delivery address is required.');
  }

  // Resolve items from cart or body
  let orderItems = [];
  const cartDoc = await db.collection('carts').doc(req.user.uid).get();
  const cartItems = cartDoc.exists ? cartDoc.data().items || [] : [];

  const itemsSource = (bodyItems && bodyItems.length > 0) ? bodyItems : cartItems;

  if (!itemsSource || itemsSource.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty.');
  }

  // Validate products and build order items
  for (const item of itemsSource) {
    const productId = item.productId || (item.product?._id || item.product?.id || item.product);
    const qty = parseInt(item.quantity, 10);
    const prodDoc = await db.collection('products').doc(productId).get();

    if (!prodDoc.exists || !prodDoc.data().isActive) {
      res.status(400);
      throw new Error(`Product not found or unavailable.`);
    }

    const p = prodDoc.data();
    if (p.stock < qty) {
      res.status(400);
      throw new Error(`Only ${p.stock} unit(s) of "${p.name}" available.`);
    }

    const effectivePrice = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;

    orderItems.push({
      productId,
      name: p.name,
      image: p.images?.[0] || '',
      price: effectivePrice,
      quantity: qty,
      unit: p.unit || 'piece',
    });
  }

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  let discount = 0;
  let offerId = null;
  if (couponCode) {
    const result = await applyCoupon(couponCode, subtotal);
    discount = result.discount;
    offerId = result.offerId;
  }

  const totalAmount = Math.max(0, subtotal + deliveryCharge - discount);

  // Generate order number
  const orderNumber = `KE-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const orderData = {
    orderNumber,
    userId: req.user.uid,
    userName: req.user.name || '',
    userEmail: req.user.email || '',
    items: orderItems,
    deliveryAddress,
    deliverySlot: deliverySlot || 'morning',
    paymentMethod,
    transaction_id: transaction_id || null,
    upiTransactionId: upiTransactionId || null,
    paymentScreenshot: paymentScreenshot || '',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    subtotal,
    deliveryCharge,
    discount,
    couponCode: couponCode ? couponCode.toUpperCase() : null,
    totalAmount,
    notes: notes || '',
    statusHistory: [{ status: 'pending', timestamp: now, note: 'Order placed' }],
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
  };

  const orderRef = await db.collection('orders').add(orderData);

  // Decrement stock using a batch
  const batch = db.batch();
  for (const item of orderItems) {
    const prodRef = db.collection('products').doc(item.productId);
    const prodDoc = await prodRef.get();
    const newStock = Math.max(0, (prodDoc.data().stock || 0) - item.quantity);
    batch.update(prodRef, { stock: newStock });
  }

  // Increment coupon usage
  if (offerId) {
    const offerRef = db.collection('offers').doc(offerId);
    const offerDoc = await offerRef.get();
    const currentUsed = offerDoc.data().usedCount || 0;
    batch.update(offerRef, { usedCount: currentUsed + 1 });
  }

  // Clear cart
  const cartRef = db.collection('carts').doc(req.user.uid);
  batch.delete(cartRef);

  await batch.commit();

  res.status(201).json({
    success: true,
    order: { id: orderRef.id, _id: orderRef.id, ...orderData },
  });
});

/**
 * GET /api/orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const snap = await db.collection('orders').get();
  const orders = snap.docs
    .map(docToOrder)
    .filter((o) => o.userId === req.user.uid || (typeof o.user === 'object' && (o.user.uid === req.user.uid || o.user._id === req.user.uid)))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  res.json({ success: true, count: orders.length, orders });
});

/**
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const doc = await db.collection('orders').doc(req.params.id).get();

  if (!doc.exists) { res.status(404); throw new Error('Order not found.'); }

  const order = docToOrder(doc);
  if (order.userId !== req.user.uid && req.user.role !== 'admin') {
    res.status(403); throw new Error('Access denied.');
  }

  res.json({ success: true, order });
});

/**
 * PUT /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const ref = db.collection('orders').doc(req.params.id);
  const doc = await ref.get();

  if (!doc.exists) { res.status(404); throw new Error('Order not found.'); }

  const order = doc.data();
  if (order.userId !== req.user.uid) { res.status(403); throw new Error('Access denied.'); }
  if (['delivered', 'cancelled'].includes(order.orderStatus)) {
    res.status(400); throw new Error('Cannot cancel this order.');
  }

  const now = new Date().toISOString();
  const statusHistory = [...(order.statusHistory || []), { status: 'cancelled', timestamp: now, note: req.body.reason || '' }];

  await ref.update({
    orderStatus: 'cancelled',
    cancelReason: req.body.reason || '',
    statusHistory,
    updatedAt: now,
  });

  res.json({ success: true, message: 'Order cancelled successfully.' });
});

// ── Admin routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/orders/admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const snap = await db.collection('orders').get();
  let orders = snap.docs
    .map(docToOrder)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (status) {
    orders = orders.filter((o) => o.orderStatus === status);
  }

  const total = orders.length;
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(50, parseInt(limit, 10));
  const paginated = orders.slice((p - 1) * l, p * l);

  res.json({ success: true, orders: paginated, total, page: p, pages: Math.ceil(total / l) });
});

/**
 * PUT /api/orders/admin/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400); throw new Error('Invalid order status.');
  }

  const ref = db.collection('orders').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) { res.status(404); throw new Error('Order not found.'); }

  const now = new Date().toISOString();
  const statusHistory = [...(doc.data().statusHistory || []), { status, timestamp: now, note: note || '' }];

  await ref.update({ orderStatus: status, statusHistory, updatedAt: now });
  const updated = await ref.get();
  res.json({ success: true, order: docToOrder(updated) });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
