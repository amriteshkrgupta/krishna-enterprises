# 🛒 Krishna Enterprises — Grocery E-Commerce Platform

A production-grade, full-stack e-commerce web application designed for **Krishna Enterprises** in Sitamarhi, Bihar, India.

---

## 🌟 Features

### 👤 Customer Experience
* **Product Catalog & Search:** Real-time search, category filters, price sorting, in-stock status.
* **Product Details:** High-resolution galleries, discount tags, unit indicators (kg, g, L, piece).
* **Cart & Slide-over Drawer:** Quick add/remove with real-time subtotal calculation.
* **Checkout Flow:** Multi-step checkout with address selection, delivery time slots (Morning / Afternoon / Evening), and Cash on Delivery (COD).
* **Order Tracking & History:** Real-time order timeline tracking with status badges.
* **User Accounts:** Secure registration, JWT login, profile management, and saved addresses.

### 🛡️ Admin Dashboard (/admin)
* **Analytics Overview:** Total revenue, today's sales, order volume, low-stock warnings, and revenue trend chart.
* **Product Management:** Complete CRUD with multiple image uploads (AWS S3 or Local Disk fallback).
* **Inventory Control:** Real-time stock monitor, color-coded low-stock alerts, and inline stock updates.
* **Category Management:** Create, edit, and organize product categories.
* **Order Lifecycle:** Track customer orders, update progress (Pending ➔ Confirmed ➔ Packed ➔ Dispatched ➔ Delivered), and review notes.
* **Discounts & Coupons:** Manage promotional codes with percentage or flat discounts, usage caps, and expiry dates.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand, React Query (@tanstack/react-query), Lucide Icons, React Hot Toast.
* **Backend:** Node.js, Express.js, Firebase Admin SDK (Cloud Firestore + Firebase Auth), Multer, AWS S3 Client / Local Storage.
* **Image Storage:** AWS S3 (with automatic Local Disk Storage fallback if AWS credentials are not configured).
* **Location & Currency:** Madhuban, East Champaran, Bihar | INR (₹).

---

## 📁 Project Structure

```
KRISHNA ENTERPRISES/
├── backend/
│   ├── config/             # Firebase Admin SDK & service account
│   ├── controllers/        # Route controllers (Auth, Products, Orders, Cart, etc.)
│   ├── middleware/         # Auth, Admin check, Error handling
│   ├── routes/             # Express API endpoints
│   ├── utils/              # S3 & Local storage, seed script
│   ├── .env.example        # Environment variable template
│   ├── package.json
│   └── server.js           # Main Express server entry point
├── frontend/
│   ├── public/             # Static assets, manifest.json, robots.txt
│   ├── src/
│   │   ├── app/            # Next.js App Router (Storefront & Admin panel)
│   │   ├── components/     # Reusable UI components, layout, cards, modals
│   │   ├── hooks/          # React Query custom hooks
│   │   ├── lib/            # Axios API client, queryClient, utilities
│   │   ├── store/          # Zustand state stores (Cart, Auth)
│   │   └── types/          # TypeScript definitions
│   ├── .env.local.example  # Frontend environment template
│   ├── next.config.js
│   ├── package.json
│   └── tailwind.config.ts
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have installed:
* [Node.js (v18 or higher)](https://nodejs.org/)
* **MongoDB**:
  * *Option A (Cloud):* [MongoDB Atlas Free Cluster](https://www.mongodb.com/atlas)
  * *Option B (Local):* Local MongoDB running on mongodb://127.0.0.1:27017

---

### 2. Backend Setup

1. Open terminal and navigate to the backend folder:
   `ash
   cd backend
   `
2. Install dependencies:
   `ash
   npm install
   `
3. Create your .env configuration:
   `ash
   copy .env.example .env
   `
4. Configure .env:
   `env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/krishna-enterprises
   JWT_SECRET=krishna_enterprises_super_secret_jwt_key_2026
   FRONTEND_URL=http://localhost:3000

   # Optional: AWS S3 (Leave commented or empty to use automatic Local Disk Storage)
   # AWS_ACCESS_KEY_ID=
   # AWS_SECRET_ACCESS_KEY=
   # AWS_REGION=ap-south-1
   # AWS_BUCKET_NAME=krishna-enterprises-images
   `
5. **Seed the database** with initial grocery categories and 40 sample products:
   `ash
   npm run seed
   `
   * **Default Admin Account:**
     * **Email:** dmin@krishnaenterprises.com
     * **Password:** Admin@123
6. Start the backend server:
   `ash
   npm run dev
   `
   The backend API will run at http://localhost:5000.

---

### 3. Frontend Setup

1. In a new terminal, navigate to the frontend folder:
   `ash
   cd frontend
   `
2. Install dependencies:
   `ash
   npm install
   `
3. Create .env.local:
   `ash
   copy .env.local.example .env.local
   `
4. Start the frontend development server:
   `ash
   npm run dev
   `
5. Open your browser and visit:
   * **Storefront:** [http://localhost:3000](http://localhost:3000)
   * **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin) (Log in with admin credentials)

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Store Admin** | dmin@krishnaenterprises.com | Admin@123 |
| **Customer** | Register a new account at /register | (Any password >= 6 chars) |

---

## 📦 API Endpoints Summary

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | /api/health | Backend health check | Public |
| POST | /api/auth/register | Register customer | Public |
| POST | /api/auth/login | Login user / admin | Public |
| GET | /api/products | Get products (search, filter, pagination) | Public |
| GET | /api/products/:slug | Get single product detail | Public |
| POST | /api/products/admin | Create product with images | Admin |
| GET | /api/categories | Get active categories | Public |
| GET | /api/cart | Get customer cart | Customer |
| POST | /api/cart | Add / update item in cart | Customer |
| POST | /api/orders | Place COD order | Customer |
| GET | /api/orders | Get user order history | Customer |
| GET | /api/admin/dashboard | Analytics stats & chart data | Admin |
| GET | /api/admin/orders/all | Get all store orders | Admin |
| PUT | /api/admin/orders/:id/status | Update order status | Admin |
| POST | /api/offers/validate | Validate coupon code | Customer |

---

## 📄 License
Created for Krishna Enterprises, Sitamarhi, Bihar. All rights reserved.
