/**
 * config/firebase.js
 * Initialize Firebase Admin SDK (Firestore + Auth).
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let app;

if (!admin.apps.length) {
  let credential;
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }

  app = admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'krishna-enterprises-77254',
  });
} else {
  app = admin.app();
}

const db   = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };
