/**
 * controllers/auth.controller.js
 * Firebase Auth + Firestore user management.
 *
 * Auth flow:
 *   - register: creates Firebase Auth user + Firestore /users/{uid} doc
 *   - login:    frontend signs in via Firebase Auth SDK, gets ID token,
 *               sends it as Bearer header. This endpoint just returns the
 *               Firestore profile (token is already valid).
 *   - getMe / updateProfile / addAddress / deleteAddress: Firestore CRUD
 */

const asyncHandler = require('express-async-handler');
const { auth, db, admin } = require('../config/firebase');

// --- Helper: sanitized user response -----------------------------------------
const userResponse = (uid, userData, token) => ({
  success: true,
  token,  // caller supplies the Firebase custom token (for register) or echoes provided token
  user: {
    _id: uid,
    uid,
    name: userData.name,
    email: userData.email,
    phone: userData.phone || null,
    role: userData.role || 'customer',
    addresses: userData.addresses || [],
    createdAt: userData.createdAt,
  },
});

/**
 * @desc  Register a new customer
 *        Creates a Firebase Auth account + Firestore profile.
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required.');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }

  // Create user in Firebase Auth
  let firebaseUser;
  try {
    firebaseUser = await auth.createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: name.trim(),
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      res.status(400);
      throw new Error('An account with this email already exists.');
    }
    throw err;
  }

  const now = new Date().toISOString();

  // Create Firestore user profile
  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : null,
    role: 'customer',
    addresses: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('users').doc(firebaseUser.uid).set(userData);

  // Create a custom token for immediate login after registration
  const customToken = await auth.createCustomToken(firebaseUser.uid);

  res.status(201).json(userResponse(firebaseUser.uid, userData, customToken));
});

/**
 * @desc  Verify a Firebase ID token and return the Firestore user profile.
 *        The frontend signs in via Firebase Auth SDK (signInWithEmailAndPassword),
 *        obtains an ID token, and sends it here to get the role/profile.
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Firebase ID token is required.');
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired token.');
  }

  const userDoc = await db.collection('users').doc(decoded.uid).get();
  let userData;

  if (!userDoc.exists) {
    const now = new Date().toISOString();
    const phone = decoded.phone_number || null;
    const name = decoded.name || (phone ? `Customer (${phone.slice(-4)})` : 'Customer');
    const email = decoded.email || `${(phone || decoded.uid).replace(/\D/g, '')}@krishnaenterprises.in`;
    userData = {
      name,
      email,
      phone,
      role: 'customer',
      addresses: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('users').doc(decoded.uid).set(userData);
  } else {
    userData = userDoc.data();
    if (!userData.phone && decoded.phone_number) {
      userData.phone = decoded.phone_number;
      await db.collection('users').doc(decoded.uid).update({ phone: decoded.phone_number });
    }
  }

  res.json(userResponse(decoded.uid, userData, idToken));
});

/**
 * @desc  Get currently authenticated user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  const { uid, ...userData } = req.user;
  res.json({
    success: true,
    user: {
      _id: uid,
      uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      addresses: userData.addresses || [],
      createdAt: userData.createdAt,
    },
  });
});

/**
 * @desc  Update user profile (name, phone)
 * @route PUT /api/auth/me
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const updates = { updatedAt: new Date().toISOString() };

  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();

  await db.collection('users').doc(req.user.uid).update(updates);

  // Sync display name in Firebase Auth
  if (name) {
    await auth.updateUser(req.user.uid, { displayName: name.trim() });
  }

  const updatedDoc = await db.collection('users').doc(req.user.uid).get();
  const userData = updatedDoc.data();

  res.json(userResponse(req.user.uid, userData, req.headers.authorization?.split(' ')[1] || ''));
});

/**
 * @desc  Add a delivery address
 * @route POST /api/auth/addresses
 * @access Private
 */
const addAddress = asyncHandler(async (req, res) => {
  const { label = 'Home', street, city, state = 'Bihar', pincode, phone, isDefault } = req.body;

  if (!street || !city || !pincode) {
    res.status(400);
    throw new Error('Street, city, and pincode are required.');
  }

  const userDoc = await db.collection('users').doc(req.user.uid).get();
  const userData = userDoc.data();
  const addresses = userData.addresses || [];

  const isDuplicate = addresses.some(
    (a) => a.street?.toLowerCase() === street.trim().toLowerCase() && a.pincode === pincode.trim()
  );

  if (!isDuplicate) {
    const newAddress = {
      id: Date.now().toString(),
      label: label || 'Home',
      street: street.trim(),
      city: city.trim(),
      state: state.trim() || 'Bihar',
      pincode: pincode.trim(),
      phone: phone?.trim() || userData.phone || '',
      isDefault: isDefault || addresses.length === 0,
    };

    if (newAddress.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }

    addresses.push(newAddress);

    await db.collection('users').doc(req.user.uid).update({
      addresses,
      updatedAt: new Date().toISOString(),
    });
  }

  const refreshed = await db.collection('users').doc(req.user.uid).get();
  const refreshedData = refreshed.data();

  res.json({
    success: true,
    data: {
      _id: req.user.uid,
      uid: req.user.uid,
      ...refreshedData,
    },
  });
});

/**
 * @desc  Delete an address by its id field
 * @route PUT /api/auth/addresses/:id/delete
 * @access Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const userDoc = await db.collection('users').doc(req.user.uid).get();
  const userData = userDoc.data();
  const filtered = (userData.addresses || []).filter((a) => a.id !== req.params.id);

  await db.collection('users').doc(req.user.uid).update({
    addresses: filtered,
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, data: { _id: req.user.uid, uid: req.user.uid, ...userData, addresses: filtered } });
});

/**
 * @desc  Set an address as default
 * @route PUT /api/auth/addresses/:id/default
 * @access Private
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const userDoc = await db.collection('users').doc(req.user.uid).get();
  const userData = userDoc.data();
  const addresses = (userData.addresses || []).map((a) => ({
    ...a,
    isDefault: a.id === req.params.id,
  }));

  await db.collection('users').doc(req.user.uid).update({
    addresses,
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, data: { _id: req.user.uid, uid: req.user.uid, ...userData, addresses } });
});

/**
 * @desc  Change user password via Firebase Auth
 * @route PUT /api/auth/me/password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters.');
  }

  await auth.updateUser(req.user.uid, { password: newPassword });

  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  changePassword,
};
