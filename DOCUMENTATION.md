# MS Special E-Commerce - Complete Documentation

## Table of Contents
1. [Quick Start](#quick-start)
2. [Firebase Setup](#firebase-setup)
3. [Admin Setup](#admin-setup)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Feature Guide](#feature-guide)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Environment Configuration
Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

VITE_STORE_PHONE=+233 24 298 8277
VITE_STORE_LOCATION=Okaishei - Accra
VITE_STORE_EMAIL=msfoods.gh@gmail.com
```

### Step 3: Start Development Server
```bash
npm run dev
```

Access at: **http://localhost:5173**

---

## Firebase Setup

### 1. Create Project
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name: `msspecial-e-commerce`
4. Disable Google Analytics (optional)
5. Create project

### 2. Get Configuration
1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click web icon `</>` to add web app
4. Copy configuration values to `.env`

### 3. Enable Authentication
Navigate to **Authentication → Sign-in method**, enable:
- Email/Password ✅
- Google (optional) ✅
- Phone (optional, requires billing) ✅

### 4. Create Realtime Database
1. Go to **Realtime Database**
2. Click "Create Database"
3. Choose location (closest to users)
4. Start in **test mode** (update rules later)
5. Copy database URL to `.env`

### 5. Security Rules (Production)
Update rules when ready for production:

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
      ".write": "auth != null"
    },
    "categories": {
      ".read": true,
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "orders": {
      "$orderId": {
        ".read": "auth != null",
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
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

---

## Admin Setup

### Create First Admin User

#### Method 1: Manual (Recommended)
1. Start the app: `npm run dev`
2. Register a new account at `/register`
3. Complete registration with email/password
4. Open Firebase Console → Realtime Database
5. Navigate to `users/{userId}`
6. Find your user ID
7. Change `role` field from `"customer"` to `"admin"`
8. Logout and login again
9. You now have admin access!

#### Method 2: Direct Database Entry
1. Go to Firebase Console → Realtime Database
2. Click on `users` node
3. Add child with your user ID
4. Add fields:
   ```json
   {
     "email": "admin@msspecial.com",
     "role": "admin",
     "displayName": "Admin User",
     "createdAt": 1234567890000
   }
   ```

---

## User Roles & Permissions

### Customer (Default)
**Can:**
- Browse all products
- Search and filter by category
- Add items to cart
- Place orders via Paystack
- View order history
- Receive notifications
- Leave product reviews

**Cannot:**
- Add/edit products
- Access admin dashboard
- Manage other users

### Agent
**Can (includes all Customer permissions):**
- Add/edit/delete own products
- Upload up to 6 images per product
- Manage product inventory
- View customer orders
- Update order status
- Mark payments as paid
- Send order notifications

**Cannot:**
- Manage other agents' products
- Access admin-only features
- Create categories
- Create announcements

### Admin
**Can (includes all Agent permissions):**
- Manage ALL products (any agent)
- Create/edit/delete categories
- Upload category images
- Create system announcements
- View all orders from all agents
- Manage user roles
- Full system access

---

## Feature Guide

### 1. Category Management (Admin Only)

#### Add Category
1. Login as Admin
2. Navigate to **Admin Dashboard → Categories**
3. Click **"Add Category"**
4. Fill in:
   - **Name**: e.g., "Shito", "Dresses", "Bags"
   - **Description**: Brief description
   - **Image**: Click to upload (PNG/JPG, max 2MB)
5. Click **"Save"**

#### Default Categories
```
Shito - Premium pepper sauce
Dresses - Stylish fashion
Bags - Quality accessories
```

### 2. Product Management (Agent/Admin)

#### Add Product
1. Go to **My Products → Add Product**
2. Fill in:
   - **Name**: Product name
   - **Description**: Detailed description
   - **Price**: Product price (GH₵)
   - **Compare Price**: Original price (optional, for discounts)
   - **Category**: Select from dropdown
   - **Stock**: Available quantity
   - **Sizes**: Comma-separated (e.g., "S, M, L, XL")
   - **Featured**: Toggle for homepage display

3. **Upload Images**:
   - Click upload area or drag files
   - Max 6 images per product
   - Each image max 500KB
   - Formats: PNG, JPG, JPEG
   - First image = main product image
   - Remove unwanted images with ❌ button

4. Click **"Create Product"**

#### Edit Product
1. Find product in list
2. Click **Edit** icon
3. Modify fields as needed
4. Add/remove images
5. Click **"Save Changes"**

#### Delete Product
1. Find product in list
2. Click **Delete** icon
3. Confirm deletion

### 3. Order Management

#### View Orders
- **Agents**: See orders for their products
- **Admins**: See all orders

#### Update Order Status
1. Go to **My Orders** (Agent) or **Admin Orders** (Admin)
2. Find order
3. Click **Status** dropdown
4. Select new status:
   - Pending
   - Processing
   - Confirmed
   - Shipped
   - Delivered
   - Cancelled
5. Customer receives automatic notification

#### Mark Payment as Paid
1. Find order in list
2. Look for **"Mark as Paid"** button (if payment pending)
3. Click button
4. Confirm action
5. Customer receives payment confirmation notification

### 4. Notification System

#### For Users
- **Bell Icon**: Top right navbar
- **Badge**: Shows unread count
- **Click**: Opens notifications page

#### Notification Types
- 🔵 **Order Updates**: Status changes
- 💰 **Payment**: Confirmation notifications
- 📢 **Announcements**: System messages

#### Mark as Read
- Click any notification to mark as read
- Badge updates automatically

#### Filter Notifications
- **All**: View all notifications
- **Unread**: Only unread
- **Read**: Already viewed

### 5. Announcements (Admin Only)

#### Create Announcement
1. Go to **Admin Dashboard → Announcements**
2. Click **"Create Announcement"**
3. Fill in:
   - **Title**: Announcement headline
   - **Message**: Detailed message
   - **Type**: Info, Warning, Success, Error
   - **Target Audience**:
     - All Users
     - Customers Only
     - Agents Only
     - Admins Only
   - **Active**: Toggle on/off

4. Click **"Create"**
5. Target users receive notification instantly

#### Manage Announcements
- **Edit**: Update existing announcements
- **Delete**: Remove announcements
- **Toggle Active**: Show/hide announcements

### 6. Shopping Experience (Customer)

#### Browse Products
- **Homepage**: Featured products + categories (6-column grid)
- **Products Page**: All products (6-column grid)
- **Click Category**: Filter by category

#### View Product Details
1. Click any product card
2. **Images**: Vertical thumbnails on left, click to view
3. **Product Info**: Right side with details
4. **Select Options**:
   - Size (if available)
   - Quantity (+ / - buttons)
5. **Actions**:
   - **ADD TO CART**: Adds to cart
   - **BUY NOW**: Goes to checkout immediately
   - **SHARE**: Share product
   - **WISHLIST**: Save for later

#### Checkout Process
1. Review cart items
2. Click **"Proceed to Checkout"**
3. Fill shipping information
4. Click **"Continue to Payment"**
5. **Paystack Payment**:
   - Enter card details
   - Confirm payment
6. Order confirmed!
7. Receive confirmation notification

---

## Troubleshooting

### App won't start
**Error**: `Cannot find module` or dependency issues
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Firebase connection error
**Error**: `Firebase: Error (auth/invalid-api-key)`
**Solution**:
- Verify `.env` file exists
- Check all Firebase variables are correct
- Ensure no extra spaces in `.env`
- Restart dev server

### Images not uploading
**Error**: Images don't appear after upload
**Solution**:
- Check file size (max 500KB per image)
- Use PNG, JPG, or JPEG format
- Check browser console for errors
- Ensure Firebase database rules allow writes

### Notifications not showing
**Error**: Bell icon shows 0 but notifications exist
**Solution**:
- Check Firebase database URL in `.env`
- Verify security rules allow read access
- Check browser console for errors
- Try logout/login again

### Payment failing
**Error**: "Failed to make purchase"
**Solution**:
- Verify Paystack public key in `.env`
- Use test card in test mode:
  - Card: 5531886652142950
  - CVV: 564
  - Expiry: Any future date
  - PIN: 3310
- Check browser console for errors
- Ensure Paystack account is active

### Orders not updating
**Error**: Status changes don't save
**Solution**:
- Check Firebase security rules
- Verify user has agent/admin role
- Check browser console for errors
- Refresh the page

### Build errors
**Error**: Build fails with dependency conflicts
**Solution**:
```bash
npm install --legacy-peer-deps
npm run build
```

---

## Database Structure Reference

### Users
```json
{
  "email": "user@example.com",
  "role": "customer|agent|admin",
  "displayName": "John Doe",
  "phoneNumber": "+233123456789",
  "createdAt": 1234567890000
}
```

### Products
```json
{
  "name": "Premium Shito",
  "description": "Spicy pepper sauce",
  "price": 25.00,
  "comparePrice": 30.00,
  "categoryId": "-NabcXYZ123",
  "stock": 50,
  "sizes": ["Small", "Medium", "Large"],
  "featured": true,
  "images": ["base64string1", "base64string2"],
  "agentId": "uid123",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

### Orders
```json
{
  "userId": "uid123",
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "price": 25.00
    }
  ],
  "total": 50.00,
  "status": "pending",
  "paymentStatus": "pending",
  "shippingInfo": {
    "name": "John Doe",
    "phone": "+233123456789",
    "address": "123 Main St",
    "city": "Accra"
  },
  "createdAt": 1234567890000
}
```

---

## Support

For technical support or questions:

- **Email**: msfoods.gh@gmail.com
- **Phone**: +233 24 298 8277
- **Location**: Okaishei - Accra, Ghana

---

**Last Updated**: October 4, 2025
