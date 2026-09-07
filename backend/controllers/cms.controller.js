/**
 * controllers/cms.controller.js
 * Cloud Firestore CMS for Krishna Enterprises Dynamic Homepage.
 */

const asyncHandler = require('express-async-handler');
const { db } = require('../config/firebase');

// Standard default sections matching the exact original homepage
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'sec_hero',
    type: 'hero',
    position: 1,
    enabled: true,
    title: 'Fresh Groceries Delivered To\nYour Doorstep',
    subtitle: 'Order atta, rice, dal, oil, spices and daily essentials online. Instant UPI QR scan & pay. Doorstep delivery across Madhuban & East Champaran, Bihar.',
    badge: '🌿 Madhuban, East Champaran\'s Trusted Grocery Store',
    content: {
      ctaPrimaryText: 'Shop All Products',
      ctaPrimaryLink: '/products',
      ctaSecondaryText: 'View Featured Deals',
      ctaSecondaryLink: '/products?featured=true',
    },
  },
  {
    id: 'sec_categories',
    type: 'category_grid',
    position: 2,
    enabled: true,
    title: 'Explore Categories',
    subtitle: 'Explore fresh daily staples and groceries',
    content: {
      seeAllText: 'See all',
      seeAllLink: '/products',
      limit: 8,
    },
  },
  {
    id: 'sec_featured',
    type: 'product_section',
    position: 3,
    enabled: true,
    title: 'Featured Deals',
    subtitle: 'Special discounted products and staples',
    badge: 'Special Offers',
    dataSource: {
      type: 'featured',
      limit: 12,
    },
    content: {
      viewAllText: 'View all deals',
      viewAllLink: '/products?featured=true',
      cardStyle: 'featured_box',
    },
  },
  {
    id: 'sec_popular',
    type: 'product_section',
    position: 4,
    enabled: true,
    title: 'Popular Staples',
    subtitle: 'Top-selling daily groceries at best market prices',
    dataSource: {
      type: 'all',
      limit: 12,
    },
    content: {
      viewAllText: 'Browse All',
      viewAllLink: '/products',
      cardStyle: 'standard',
    },
  },
  {
    id: 'sec_trust',
    type: 'trust_strip',
    position: 5,
    enabled: true,
    title: 'Why Choose Krishna Enterprises?',
    subtitle: 'Your local grocery partner in Madhuban, East Champaran',
    content: {
      items: [
        {
          id: 'trust_1',
          icon: 'truck',
          title: 'Fast Local Delivery',
          description: 'Choose your slot: Morning (9 AM - 1 PM) or Evening (4 PM - 8 PM) across Madhuban.',
        },
        {
          id: 'trust_2',
          icon: 'badge-check',
          title: '100% Fresh & Authentic',
          description: 'All groceries sourced from certified brands and packed with hygiene & quality assurance.',
        },
        {
          id: 'trust_3',
          icon: 'shield',
          title: 'Best Market Prices',
          description: 'Competitive rates with special discounts on staples. FREE delivery on orders above ₹500.',
        },
      ],
    },
  },
  {
    id: 'sec_location',
    type: 'store_location',
    position: 6,
    enabled: true,
    title: 'Krishna Enterprises',
    subtitle: 'Machhaha Chowk, Chakia - Madhuban - Sheohar Rd, Rupni, Jogaulia Tola Kharsal, Bihar 845420',
    content: {
      phone: '07256955630',
      callText: 'Call 07256955630',
      whatsappText: 'WhatsApp Chat',
    },
  },
];

const checkScheduling = (section) => {
  const now = new Date();
  if (section.startAt && new Date(section.startAt) > now) return false;
  if (section.endAt && new Date(section.endAt) < now) return false;
  return true;
};

/**
 * GET /api/cms/homepage
 * Public - Returns active published homepage configuration
 */
const getPublishedHomepage = asyncHandler(async (req, res) => {
  const doc = await db.collection('cms_homepage').doc('published').get();

  if (!doc.exists) {
    return res.json({
      success: true,
      data: {
        version: 1,
        isDefault: true,
        updatedAt: new Date().toISOString(),
        sections: DEFAULT_HOMEPAGE_SECTIONS,
      },
    });
  }

  const data = doc.data();
  // Filter active and scheduled sections
  const activeSections = (data.sections || [])
    .filter((s) => s.enabled !== false && checkScheduling(s))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  res.json({
    success: true,
    data: {
      version: data.version || 1,
      updatedAt: data.updatedAt,
      sections: activeSections,
    },
  });
});

/**
 * GET /api/cms/homepage/draft
 * Admin - Returns draft configuration including disabled sections
 */
const getDraftHomepage = asyncHandler(async (req, res) => {
  let doc = await db.collection('cms_homepage').doc('draft').get();

  if (!doc.exists) {
    // If no draft exists, check published, or fall back to default
    const pubDoc = await db.collection('cms_homepage').doc('published').get();
    const initialSections = pubDoc.exists ? pubDoc.data().sections : DEFAULT_HOMEPAGE_SECTIONS;

    const initialDraft = {
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.email || 'admin',
      sections: initialSections,
    };
    await db.collection('cms_homepage').doc('draft').set(initialDraft);
    doc = await db.collection('cms_homepage').doc('draft').get();
  }

  const data = doc.data();
  const sortedSections = (data.sections || []).sort((a, b) => (a.position || 0) - (b.position || 0));

  res.json({
    success: true,
    data: {
      version: data.version || 1,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
      sections: sortedSections,
    },
  });
});

/**
 * PUT /api/cms/homepage/draft
 * Admin - Saves section configurations, reordering, and toggles into draft
 */
const saveDraftHomepage = asyncHandler(async (req, res) => {
  const { sections } = req.body;

  if (!Array.isArray(sections)) {
    res.status(400);
    throw new Error('Sections must be an array.');
  }

  // Ensure normalized positions
  const normalizedSections = sections.map((s, index) => ({
    ...s,
    position: index + 1,
    id: s.id || `sec_${Date.now()}_${index}`,
    enabled: s.enabled !== false,
  }));

  const draftData = {
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.email || 'admin',
    sections: normalizedSections,
  };

  await db.collection('cms_homepage').doc('draft').set(draftData, { merge: true });

  res.json({
    success: true,
    message: 'Draft saved successfully.',
    data: draftData,
  });
});

/**
 * POST /api/cms/homepage/publish
 * Admin - Copies draft configuration to published and saves audit history
 */
const publishHomepage = asyncHandler(async (req, res) => {
  let draftDoc = await db.collection('cms_homepage').doc('draft').get();

  let sectionsToPublish = DEFAULT_HOMEPAGE_SECTIONS;
  if (draftDoc.exists && draftDoc.data().sections?.length > 0) {
    sectionsToPublish = draftDoc.data().sections;
  }

  const pubDoc = await db.collection('cms_homepage').doc('published').get();
  const nextVersion = pubDoc.exists ? (pubDoc.data().version || 0) + 1 : 1;
  const now = new Date().toISOString();

  const publishedData = {
    version: nextVersion,
    publishedAt: now,
    publishedBy: req.user?.email || 'admin',
    updatedAt: now,
    sections: sectionsToPublish,
  };

  // 1. Update published
  await db.collection('cms_homepage').doc('published').set(publishedData);

  // 2. Add to history for audit and rollback
  await db.collection('cms_homepage_history').add({
    ...publishedData,
    snapshotAt: now,
  });

  res.json({
    success: true,
    message: `Homepage Version ${nextVersion} published live successfully!`,
    data: publishedData,
  });
});

/**
 * POST /api/cms/homepage/reset
 * Admin - Resets draft to the original default store sections
 */
const resetToDefault = asyncHandler(async (req, res) => {
  const draftData = {
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.email || 'admin',
    sections: DEFAULT_HOMEPAGE_SECTIONS,
  };

  await db.collection('cms_homepage').doc('draft').set(draftData);

  res.json({
    success: true,
    message: 'Reset draft to default store sections.',
    data: draftData,
  });
});

/**
 * GET /api/cms/homepage/versions
 * Admin - Lists published version history
 */
const getVersions = asyncHandler(async (req, res) => {
  const snap = await db.collection('cms_homepage_history')
    .orderBy('version', 'desc')
    .limit(10)
    .get();

  const versions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  res.json({ success: true, versions });
});

/**
 * POST /api/cms/homepage/rollback/:versionId
 * Admin - Rollback to an earlier version
 */
const rollbackVersion = asyncHandler(async (req, res) => {
  const { versionId } = req.params;

  const doc = await db.collection('cms_homepage_history').doc(versionId).get();
  if (!doc.exists) {
    res.status(404);
    throw new Error('Version snapshot not found.');
  }

  const versionData = doc.data();
  const now = new Date().toISOString();

  // Set as both draft and published
  const restored = {
    version: (versionData.version || 1) + 1,
    publishedAt: now,
    publishedBy: req.user?.email || 'admin',
    updatedAt: now,
    sections: versionData.sections || DEFAULT_HOMEPAGE_SECTIONS,
  };

  await db.collection('cms_homepage').doc('published').set(restored);
  await db.collection('cms_homepage').doc('draft').set({
    updatedAt: now,
    updatedBy: req.user?.email || 'admin',
    sections: restored.sections,
  });

  res.json({
    success: true,
    message: `Restored to configuration from Version ${versionData.version}!`,
    data: restored,
  });
});

module.exports = {
  getPublishedHomepage,
  getDraftHomepage,
  saveDraftHomepage,
  publishHomepage,
  resetToDefault,
  getVersions,
  rollbackVersion,
  DEFAULT_HOMEPAGE_SECTIONS,
};
