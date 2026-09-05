/**
 * utils/seed.js
 * Seeds Firestore with categories, products, and admin user.
 * Run: node utils/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { db, auth } = require('../config/firebase');

const PLACEHOLDER = 'https://via.placeholder.com/400x400?text=Product';

const categoriesData = [
  { name: 'Grains & Cereals',    slug: 'grains-cereals',    description: 'Rice, atta, flour, semolina, and breakfast cereals.',        sortOrder: 1, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pulses & Lentils',    slug: 'pulses-lentils',    description: 'Toor dal, moong dal, chana, masoor, urad and more.',          sortOrder: 2, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cooking Oil & Ghee',  slug: 'cooking-oil-ghee',  description: 'Refined oil, mustard oil, ghee, vanaspati.',                  sortOrder: 3, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
  { name: 'Spices & Masala',     slug: 'spices-masala',     description: 'Whole spices, ground masala, and blended powders.',           sortOrder: 4, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Snacks & Namkeen',    slug: 'snacks-namkeen',    description: 'Biscuits, chips, namkeen, papad and more.',                   sortOrder: 5, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Beverages & Drinks',  slug: 'beverages-drinks',  description: 'Tea, coffee, cold drinks, juices, health drinks.',            sortOrder: 6, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80' },
  { name: 'Dairy & Eggs',        slug: 'dairy-eggs',        description: 'Milk, paneer, butter, curd, eggs.',                           sortOrder: 7, image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Personal Care',       slug: 'personal-care',     description: 'Soap, shampoo, toothpaste, detergent and hygiene.',           sortOrder: 8, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80' },
];

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const buildProducts = (catMap) => [
  { name: 'Aashirvaad Atta (Whole Wheat)', catName: 'Grains & Cereals', price: 295, discountPrice: 275, stock: 200, unit: 'kg', description: '10 kg pack of Aashirvaad whole wheat atta.', tags: ['atta', 'wheat', 'flour'], featured: true },
  { name: 'India Gate Basmati Rice', catName: 'Grains & Cereals', price: 320, discountPrice: 299, stock: 150, unit: 'kg', description: '5 kg premium aged basmati rice.', tags: ['rice', 'basmati'], featured: true },
  { name: 'Sona Masoori Rice', catName: 'Grains & Cereals', price: 185, discountPrice: null, stock: 300, unit: 'kg', description: '5 kg Sona Masoori for daily cooking.', tags: ['rice', 'sona masoori'] },
  { name: 'Fortune Arhar / Toor Dal', catName: 'Pulses & Lentils', price: 160, discountPrice: 148, stock: 100, unit: 'kg', description: '1 kg premium Toor dal.', tags: ['dal', 'toor', 'arhar'], featured: true },
  { name: 'Tata Sampann Moong Dal', catName: 'Pulses & Lentils', price: 140, discountPrice: 129, stock: 80, unit: 'kg', description: '1 kg yellow moong dal.', tags: ['dal', 'moong'] },
  { name: 'Fortune Sunlite Sunflower Oil', catName: 'Cooking Oil & Ghee', price: 155, discountPrice: 142, stock: 90, unit: 'L', description: '1 Litre Fortune Refined Sunflower Oil.', tags: ['oil', 'cooking oil'], featured: true },
  { name: 'Engine Kachi Ghani Mustard Oil', catName: 'Cooking Oil & Ghee', price: 175, discountPrice: 165, stock: 120, unit: 'L', description: '1 Litre kachi ghani mustard oil.', tags: ['mustard oil', 'sarson'], featured: true },
  { name: 'Amul Pure Ghee', catName: 'Cooking Oil & Ghee', price: 320, discountPrice: 299, stock: 60, unit: 'L', description: '500 ml Amul Pure Cow Ghee.', tags: ['ghee', 'amul'], featured: true },
  { name: 'MDH Deggi Mirch', catName: 'Spices & Masala', price: 85, discountPrice: 79, stock: 150, unit: 'g', description: '100g pack.', tags: ['masala', 'chilli', 'mirch'] },
  { name: 'Tata Salt (Iodised)', catName: 'Spices & Masala', price: 28, discountPrice: null, stock: 500, unit: 'kg', description: '1 kg iodised salt.', tags: ['salt', 'namak'], featured: true },
  { name: 'Catch Turmeric Powder (Haldi)', catName: 'Spices & Masala', price: 65, discountPrice: 59, stock: 140, unit: 'g', description: '200g turmeric powder.', tags: ['haldi', 'turmeric'] },
  { name: 'Everest Garam Masala', catName: 'Spices & Masala', price: 95, discountPrice: 88, stock: 110, unit: 'g', description: '100g garam masala.', tags: ['masala', 'garam masala'], featured: true },
  { name: 'Haldiram Bhujia Sev', catName: 'Snacks & Namkeen', price: 55, discountPrice: 50, stock: 180, unit: 'g', description: '200g crispy bhujia sev.', tags: ['namkeen', 'bhujia', 'snacks'], featured: true },
  { name: 'Parle-G Gold Biscuits', catName: 'Snacks & Namkeen', price: 30, discountPrice: null, stock: 350, unit: 'pack', description: 'Original glucose biscuits.', tags: ['biscuits', 'parle-g'] },
  { name: 'Lays Magic Masala', catName: 'Snacks & Namkeen', price: 20, discountPrice: null, stock: 200, unit: 'pack', description: 'Spicy potato chips.', tags: ['chips', 'lays'] },
  { name: 'Tata Tea Gold', catName: 'Beverages & Drinks', price: 165, discountPrice: 149, stock: 85, unit: 'g', description: '250g tea leaves.', tags: ['tea', 'chai'], featured: true },
  { name: 'Nescafe Classic Instant Coffee', catName: 'Beverages & Drinks', price: 180, discountPrice: 168, stock: 65, unit: 'g', description: '50g instant coffee.', tags: ['coffee', 'nescafe'] },
  { name: 'Amul Taaza Homogenised Milk', catName: 'Dairy & Eggs', price: 72, discountPrice: null, stock: 50, unit: 'L', description: '1 Litre Tetra Pak toned milk.', tags: ['milk', 'dairy', 'amul'], featured: true },
  { name: 'Farm Fresh Brown Eggs (Pack of 6)', catName: 'Dairy & Eggs', price: 60, discountPrice: 55, stock: 40, unit: 'pack', description: 'Pack of 6 fresh brown eggs.', tags: ['eggs', 'protein'] },
  { name: 'Dettol Original Soap (Buy 3 Get 1)', catName: 'Personal Care', price: 140, discountPrice: 125, stock: 75, unit: 'pack', description: '4x75g antibacterial soap.', tags: ['soap', 'dettol', 'hygiene'], featured: true },
  { name: 'Colgate Strong Teeth Toothpaste', catName: 'Personal Care', price: 110, discountPrice: 99, stock: 95, unit: 'g', description: '200g toothpaste.', tags: ['toothpaste', 'colgate'] },
  { name: 'Surf Excel Quick Wash Detergent', catName: 'Personal Care', price: 145, discountPrice: 135, stock: 110, unit: 'kg', description: '1 kg washing powder.', tags: ['detergent', 'surf excel'], featured: true },
].map((p) => {
  const cat = catMap[p.catName];
  return {
    ...p,
    slug: slugify(p.name),
    categoryId: cat.id,
    categoryName: cat.name,
    categorySlug: cat.slug,
    images: [PLACEHOLDER],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

const seedDB = async () => {
  try {
    console.log('Clearing existing Firestore collections...');
    const deleteCollection = async (colName) => {
      const snap = await db.collection(colName).limit(500).get();
      if (snap.empty) return;
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    };
    await Promise.all(['categories', 'products'].map(deleteCollection));

    // Create admin user in Firebase Auth + Firestore
    console.log('Creating admin user...');
    const adminEmail = 'admin@krishnaenterprises.com';
    const adminPassword = 'Admin@123';
    let adminUid = 'admin_default_uid';

    try {
      let adminUser;
      try {
        adminUser = await auth.getUserByEmail(adminEmail);
        await auth.updateUser(adminUser.uid, { password: adminPassword, displayName: 'Admin Krishna' });
        adminUid = adminUser.uid;
        console.log('Admin user updated in Firebase Auth.');
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          adminUser = await auth.createUser({ email: adminEmail, password: adminPassword, displayName: 'Admin Krishna' });
          adminUid = adminUser.uid;
          console.log('Admin user created in Firebase Auth.');
        } else {
          throw e;
        }
      }
    } catch (authError) {
      console.warn('Note: Firebase Auth service check:', authError.message);
      console.warn('Creating Admin profile directly in Firestore collection "users"...');
    }

    await db.collection('users').doc(adminUid).set({
      name: 'Admin Krishna',
      email: adminEmail,
      phone: '9876543210',
      role: 'admin',
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('Creating categories in Firestore...');
    const catMap = {};
    for (const cat of categoriesData) {
      const ref = await db.collection('categories').add({
        ...cat,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      catMap[cat.name] = { id: ref.id, name: cat.name, slug: cat.slug };
    }

    console.log('Creating products in Firestore...');
    const products = buildProducts(catMap);
    for (const p of products) {
      await db.collection('products').add(p);
    }

    console.log(`\n🎉 Firestore Seed complete! ${categoriesData.length} categories, ${products.length} products created.`);
    console.log('Admin Email: admin@krishnaenterprises.com');
    console.log('Admin Pass:  Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();
