/**
 * controllers/dashboard.controller.js
 * Admin dashboard stats & customer history using Firestore with zero-index in-memory sorting.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

/**
 * GET /api/admin/dashboard
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Fetch all orders, users, and products safely in parallel without composite index requirements
  const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
    db.collection('orders').get(),
    db.collection('users').get(),
    db.collection('products').get(),
  ]);

  const orders = ordersSnap.docs
    .map((d) => ({ id: d.id, _id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
  const users = allUsers.filter((u) => u.role !== 'admin');

  const allProducts = productsSnap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
  const lowStockProducts = allProducts
    .filter((p) => p.isActive !== false && (p.stock || 0) < 10)
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))
    .slice(0, 10);

  // Stats
  const nonCancelledOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
  const todayOrders = nonCancelledOrders.filter((o) => o.createdAt && o.createdAt >= todayStart && o.createdAt < todayEnd);
  const todayUsers = users.filter((u) => u.createdAt && u.createdAt >= todayStart && u.createdAt < todayEnd);

  const totalRevenue = nonCancelledOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  // Orders by status
  const byStatus = {};
  for (const o of orders) {
    const status = o.orderStatus || 'pending';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  // Top products by quantity sold
  const productSales = {};
  for (const order of nonCancelledOrders) {
    for (const item of order.items || []) {
      const pKey = item.productId || item.name;
      if (!productSales[pKey]) {
        productSales[pKey] = { name: item.name, image: item.image || '', sold: 0, revenue: 0 };
      }
      productSales[pKey].sold += item.quantity || 1;
      productSales[pKey].revenue += (item.price || 0) * (item.quantity || 1);
    }
  }
  const topProducts = Object.entries(productSales)
    .map(([id, v]) => ({ _id: id, ...v }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Monthly revenue (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = {};
  for (const o of nonCancelledOrders) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) continue;
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, orders: 0 };
    monthlyMap[key].revenue += o.totalAmount || 0;
    monthlyMap[key].orders += 1;
  }
  const monthlyChart = Object.values(monthlyMap).slice(-6);

  const recentOrders = orders.slice(0, 10).map((o) => ({
    _id: o.id,
    orderNumber: o.orderNumber || `#${o.id.slice(0, 8)}`,
    userName: o.userName || o.deliveryAddress?.phone || 'Customer',
    totalAmount: o.totalAmount || 0,
    orderStatus: o.orderStatus || 'pending',
    createdAt: o.createdAt || new Date().toISOString(),
  }));

  res.json({
    success: true,
    stats: {
      customers: { total: users.length, today: todayUsers.length },
      orders: { total: nonCancelledOrders.length, today: todayOrders.length, byStatus },
      revenue: { total: totalRevenue, today: todayRevenue },
      topProducts,
      lowStockProducts,
      recentOrders,
      monthlyChart,
    },
  });
});

/**
 * GET /api/admin/dashboard/customers
 */
const getRegisteredCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const usersSnap = await db.collection('users').get();
  let users = usersSnap.docs
    .map((d) => ({ id: d.id, _id: d.id, ...d.data() }))
    .filter((u) => u.role !== 'admin')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (search) {
    const s = search.toLowerCase();
    users = users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s) ||
        (u.phone || '').includes(s)
    );
  }

  const total = users.length;
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(50, parseInt(limit, 10));
  const paginated = users.slice((p - 1) * l, p * l);

  // Enrich with order counts & total spent
  const ordersSnap = await db.collection('orders').get();
  const statsMap = {};
  for (const doc of ordersSnap.docs) {
    const o = doc.data();
    const uid = o.userId || (typeof o.user === 'object' ? o.user.uid || o.user._id : o.user);
    if (uid) {
      if (!statsMap[uid]) statsMap[uid] = { orderCount: 0, totalSpent: 0 };
      statsMap[uid].orderCount += 1;
      if (o.orderStatus !== 'cancelled') {
        statsMap[uid].totalSpent += o.totalAmount || 0;
      }
    }
  }

  const enriched = paginated.map((u) => ({
    ...u,
    orderCount: statsMap[u.id]?.orderCount || 0,
    totalSpent: statsMap[u.id]?.totalSpent || 0,
  }));

  res.json({
    success: true,
    customers: enriched,
    total,
    page: p,
    pages: Math.ceil(total / l),
  });
});

/**
 * GET /api/admin/dashboard/customers/:id
 * Fetches single customer details and complete order history
 */
const getCustomerDetailsAndHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userDoc = await db.collection('users').doc(id).get();
  if (!userDoc.exists) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const customer = { id: userDoc.id, _id: userDoc.id, ...userDoc.data() };

  // Fetch all orders matching customer ID, email, or phone
  const ordersSnap = await db.collection('orders').get();
  const orders = ordersSnap.docs
    .map((d) => ({ id: d.id, _id: d.id, ...d.data() }))
    .filter(
      (o) =>
        o.userId === id ||
        (typeof o.user === 'object' && (o.user.uid === id || o.user._id === id)) ||
        o.user === id ||
        (customer.email && (o.userEmail || '').toLowerCase() === customer.email.toLowerCase()) ||
        (customer.phone && (o.deliveryAddress?.phone || '').includes(customer.phone))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const totalSpent = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  res.json({
    success: true,
    customer,
    orders,
    summary: {
      orderCount: orders.length,
      totalSpent,
    },
  });
});

module.exports = {
  getDashboardStats,
  getRegisteredCustomers,
  getCustomerDetailsAndHistory,
};
