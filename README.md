# 🛍️ MS Special E-Commerce Platform

A modern, full-featured e-commerce platform built with **React 19**, **Firebase**, and **Paystack** for selling premium products including Shito (pepper sauce), Dresses, and Bags. Features a Jumia-inspired design with real-time notifications, multi-image uploads, and comprehensive admin/agent management.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Paystack account (for payments)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd MS-SALES-SITE

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
copy .env.example .env

# Start development server
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 📋 Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Store Information
VITE_STORE_PHONE=+233 24 298 8277
VITE_STORE_LOCATION=Okaishei - Accra
VITE_STORE_EMAIL=msfoods.gh@gmail.com
```

---


## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Project name: `msspecial-e-commerce`
4. Disable Google Analytics (optional)

### 2. Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable the following:
   - ✅ **Email/Password**
   - ✅ **Google** (configure OAuth)
   - ✅ **Phone** (requires billing)

### 3. Create Realtime Database
1. Go to **Realtime Database** → **Create Database**
2. Location: Choose closest to your region
3. Security rules: Start in **test mode** (update later for production)
4. Database URL: `https://msspecial-e-commerce-default-rtdb.firebaseio.com/`

### 4. Database Structure

The app uses the following Firebase Realtime Database structure:

```
msspecial-e-commerce/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── role: "customer" | "agent" | "admin"
│       ├── displayName: string
│       ├── phoneNumber: string
│       └── createdAt: timestamp
│
├── categories/
│   └── {categoryId}/
│       ├── name: string
│       ├── slug: string
│       ├── description: string
│       ├── image: base64 string (optional)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── products/
│   └── {productId}/
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── comparePrice: number (optional)
│       ├── categoryId: string
│       ├── stock: number
│       ├── sizes: string[] (optional)
│       ├── featured: boolean
│       ├── images: base64[] (up to 6 images)
│       ├── agentId: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── orders/
│   └── {orderId}/
│       ├── userId: string
│       ├── items: array
│       ├── total: number
│       ├── status: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled"
│       ├── paymentStatus: "pending" | "paid"
│       ├── shippingInfo: object
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── notifications/
│   └── {userId}/
│       └── {notificationId}/
│           ├── type: "order" | "payment" | "announcement"
│           ├── title: string
│           ├── message: string
│           ├── read: boolean
│           ├── link: string (optional)
│           └── createdAt: timestamp
│
└── announcements/
    └── {announcementId}/
        ├── title: string
        ├── message: string
        ├── type: "info" | "warning" | "success" | "error"
        ├── targetAudience: "all" | "customers" | "agents" | "admins"
        ├── active: boolean
        ├── createdBy: string
        └── createdAt: timestamp
```

### 5. Create Admin User

```bash
# 1. Register a new user through the app
# 2. Go to Firebase Console → Realtime Database
# 3. Find your user under "users/{userId}"
# 4. Change the "role" field from "customer" to "admin"
```

---

## 🎨 Features

### 🛒 **E-Commerce Core**
- **Product Browsing**: Jumia-style 6-column grid layout
- **Product Details**: Multi-image gallery with vertical thumbnails
- **Shopping Cart**: Persistent cart with Zustand
- **Checkout**: Paystack payment integration
- **Order Tracking**: Real-time order status updates

### 👥 **User Roles**

#### **Customer**
- Browse products by category
- Add items to cart
- Place orders via Paystack
- Receive notifications (order updates, payments, announcements)
- View order history
- Leave product reviews

#### **Agent**
- All customer features
- Create/edit/delete own products
- Upload up to 6 images per product
- Manage product inventory
- View and manage customer orders
- Update order status and payment status
- Mark orders as paid

#### **Admin**
- All agent features
- Manage all products (any agent)
- Manage categories with images
- Create system-wide announcements
- View all orders from all agents
- Full user management capabilities

### 🔔 **Notification System**
- Real-time Firebase listeners
- Badge counter with unread notifications
- Filter by: All, Unread, Read
- Automatic notifications for:
  - Order status changes
  - Payment confirmations
  - System announcements
- Color-coded notification types

### 📸 **Image Management**
- Upload up to **6 images per product**
- Base64 encoding (stored in Firebase Realtime Database)
- Image preview with remove buttons
- Drag-and-drop style upload interface
- File size limit: 500KB per image
- Supported formats: PNG, JPG, JPEG

### 🎨 **UI/UX Features**
- **Jumia-inspired design** throughout
- Responsive grid layouts (2→3→4→6 columns)
- Vertical thumbnail strip for product images
- Orange accent color (#FF6600)
- Clean white cards with gray borders
- Smooth animations and transitions
- Mobile-first responsive design

---

## 📁 Project Structure

```
MS SALES SITE/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx       # Navigation with notification bell
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── layouts/
│   │   └── DashboardLayout.jsx  # Admin/Agent dashboard
│   │
│   ├── pages/
│   │   ├── HomePage.jsx         # Landing page (6-col grid)
│   │   ├── ProductsPage.jsx     # Product listing (6-col grid)
│   │   ├── ProductDetailPage.jsx # Jumia-style detail view
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── agent/
│   │   │   ├── AgentProducts.jsx    # Multi-image upload
│   │   │   └── AgentOrders.jsx      # Order management
│   │   │
│   │   └── admin/
│   │       ├── AdminCategories.jsx  # Category + image upload
│   │       ├── AdminProducts.jsx
│   │       ├── AdminOrders.jsx
│   │       └── AdminAnnouncements.jsx
│   │
│   ├── store/
│   │   ├── authStore.js     # Zustand auth state
│   │   └── cartStore.js     # Zustand cart state
│   │
│   ├── utils/
│   │   └── notifications.js # Helper functions
│   │
│   ├── config/
│   │   └── firebase.js      # Firebase initialization
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── .env                     # Environment variables
├── .env.example             # Template
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19.1.1 |
| **Build Tool** | Vite 7.1.9 |
| **Styling** | Tailwind CSS 3.4.1 |
| **Routing** | React Router v6.30.0 |
| **State Management** | Zustand 4.5.0 |
| **Database** | Firebase Realtime Database |
| **Authentication** | Firebase Auth |
| **Payments** | Paystack |
| **Icons** | Lucide React 0.468.0 |
| **Notifications** | React Hot Toast 2.4.1 |
| **Animations** | Framer Motion 11.15.0 |

---

## 🎯 Usage Guide

### Adding Categories

1. Login as **Admin**
2. Navigate to **Admin Dashboard** → **Categories**
3. Click **"Add Category"**
4. Fill in:
   - Name (e.g., "Shito")
   - Description (e.g., "Premium pepper sauce")
   - Upload image (PNG/JPG, max 2MB)
5. Click **"Save"**

**Default Categories:**
- Shito (Premium pepper sauce)
- Dresses (Stylish fashion)
- Bags (Quality accessories)

### Adding Products (Agent/Admin)

1. Login as **Agent** or **Admin**
2. Go to **My Products** → **"Add Product"**
3. Fill in product details:
   - Name, Description, Price
   - Category selection
   - Stock quantity
   - Sizes (optional, comma-separated)
4. **Upload Images** (up to 6):
   - Click upload area or drag & drop
   - First image becomes main product image
   - Remove unwanted images with ❌ button
5. Click **"Create Product"**

### Managing Orders

**For Agents:**
1. Go to **My Orders**
2. View customer orders
3. **Update Status**: Pending → Processing → Confirmed → Shipped → Delivered
4. **Mark as Paid**: Click button when payment confirmed
5. Customer receives automatic notifications

**For Admins:**
- Same as agents, but can view/manage ALL orders

### Creating Announcements (Admin Only)

1. Go to **Admin Dashboard** → **Announcements**
2. Click **"Create Announcement"**
3. Fill in:
   - Title & Message
   - Type: Info, Warning, Success, Error
   - Target Audience: All, Customers, Agents, Admins
   - Active status
4. Click **"Create"**
5. Users in target audience receive notification immediately

### Customer Shopping Flow

1. **Browse Products**: Homepage or Products page
2. **View Details**: Click product → View all images
3. **Select Options**: Size, Quantity
4. **Add to Cart**: Click "ADD TO CART" or "BUY NOW"
5. **Checkout**: Enter shipping info
6. **Pay**: Via Paystack
7. **Track Order**: View in "My Orders"
8. **Get Notified**: Real-time updates via notification bell

---

## 🔐 Security Rules (Production)

Update Firebase Realtime Database rules for production:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "products": {
      ".read": true,
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'agent' || root.child('users').child(auth.uid).child('role').val() === 'admin')"
    },
    "categories": {
      ".read": true,
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "orders": {
      "$orderId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'agent' || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null"
      }
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    },
    "announcements": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

---

## 📞 Store Information

- **Business Name**: MS Special Foods
- **Phone**: +233 24 298 8277
- **Email**: msfoods.gh@gmail.com
- **Location**: Okaishei - Accra, Ghana

---

## 🐛 Known Issues & Solutions

### Issue: "Failed to make purchase"
- **Cause**: Paystack integration or test mode
- **Solution**: Verify Paystack public key in `.env`, use test cards in test mode

### Issue: Images not displaying
- **Cause**: Base64 encoding/decoding
- **Solution**: Ensure images are under 500KB, check browser console for errors

### Issue: Notifications not updating
- **Cause**: Firebase listeners not connected
- **Solution**: Check Firebase database URL in `.env`, verify security rules

---

## 🚀 Deployment

### Deploy to Render (Recommended)

**Quick Steps:**

1. **Push to Git Repository:**
```bash
git init
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Create Render Account:**
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub/GitLab

3. **Create Static Site:**
   - Click "New +" → "Static Site"
   - Connect your repository
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables:**
   Add all VITE_* environment variables in Render dashboard

5. **Deploy!**
   - Render automatically builds and deploys
   - Your site will be live at: `https://your-app.onrender.com`

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide**

### Other Deployment Options

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

**Important:** Always set environment variables in your hosting platform's dashboard.

---

## 📝 License

This project is proprietary software for MS Special Foods.

---

## 👨‍💻 Support

For issues or questions, contact:
- **Email**: msfoods.gh@gmail.com
- **Phone**: +233 24 298 8277

---

**Built with ❤️ for MS Special Foods** 🌶️
