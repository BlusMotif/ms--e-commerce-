# 🔧 Firebase Admin SDK Setup Guide

## 📋 Current Setup

Your project **already has Firebase Admin SDK initialized** in `functions/index.js`:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
```

This works automatically for Firebase Cloud Functions because it uses the default credentials.

---

## 🎯 When You Need Service Account Key

You only need the service account key setup if you're running a **separate Node.js backend** outside of Firebase Cloud Functions.

### Use Cases:
- ✅ Express.js server on Render/Heroku/AWS
- ✅ Custom Node.js backend
- ✅ Local development server
- ✅ Scheduled jobs on external servers
- ❌ **NOT needed for Firebase Cloud Functions** (already configured)

---

## 🔐 How to Get Service Account Key

### Step 1: Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/project/msspecial-e-commerce
2. Click the **gear icon** ⚙️ (Settings)
3. Select **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key**
7. A JSON file will download (e.g., `serviceAccountKey.json`)

### Step 2: Secure the Key

⚠️ **CRITICAL SECURITY WARNINGS**:
- ❌ **NEVER commit this file to Git**
- ❌ **NEVER expose it publicly**
- ❌ **NEVER share it with anyone**
- ✅ Add to `.gitignore`
- ✅ Store as environment variable in production

---

## 🚀 Implementation for Your Use Case

### Option 1: Update Existing Cloud Function (Recommended)

Your `functions/index.js` already has admin initialized. To send FCM notifications from Cloud Functions:

```javascript
// Add this to functions/index.js

exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  const { userId, title, body, url } = data;

  try {
    // Get user's FCM token from database
    const tokenSnapshot = await admin.database()
      .ref(`fcmTokens/${userId}`)
      .once('value');
    
    const tokenData = tokenSnapshot.val();
    if (!tokenData || !tokenData.token) {
      throw new functions.https.HttpsError('not-found', 'No FCM token found for user');
    }

    // Send notification
    const message = {
      notification: {
        title: title,
        body: body,
        icon: '/vite.svg'
      },
      data: {
        url: url || '/notifications',
        timestamp: Date.now().toString()
      },
      token: tokenData.token
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});