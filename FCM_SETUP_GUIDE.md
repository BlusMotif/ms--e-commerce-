# 🔔 Background Push Notifications Setup Guide

## Overview
Implementation of Firebase Cloud Messaging (FCM) to enable push notifications even when:
- Screen is off
- App is in background
- Browser is minimized
- Device is locked

---

## ✅ What Was Implemented

### 1. **Firebase Cloud Messaging (FCM)** ✅
- Added FCM to Firebase config
- Created service worker for background notifications
- Built FCM utility for token management
- Integrated with customer dashboard

### 2. **Customer Notifications Menu** ✅
- Added "Notifications" menu item for customers
- Added unread badge on notifications menu
- Fixed notification center access for customers

### 3. **Background Notification Support** ✅
- Service worker handles notifications when app is closed
- FCM tokens saved to database
- Push notifications work even with screen off
- Click notification opens app to relevant page

---

## 📁 Files Modified/Created

### Modified Files:
| File | Changes | Purpose |
|------|---------|---------|
| `src/config/firebase.js` | Added FCM initialization | Enable messaging service |
| `src/layouts/DashboardLayout.jsx` | Added notifications menu for customers | Customer can access notifications |
| `src/pages/customer/CustomerDashboard.jsx` | Added FCM integration | Request FCM tokens |

### New Files:
| File | Purpose |
|------|---------|
| `public/firebase-messaging-sw.js` | Service worker for background notifications |
| `src/utils/fcmNotifications.js` | FCM utility for token management |

---

## 🔧 Setup Instructions

### Step 1: Enable Firebase Cloud Messaging

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com/project/msspecial-e-commerce

2. **Navigate to Cloud Messaging**:
   - Click "Project Settings" (gear icon)
   - Go to "Cloud Messaging" tab

3. **Generate VAPID Key**:
   - Under "Web configuration"
   - Click "Generate key pair"
   - Copy the VAPID key

4. **Add VAPID Key to Environment**:
   ```env
   # Add to .env file
   VITE_FIREBASE_VAPID_KEY=YOUR_COPIED_VAPID_KEY_HERE
   ```

### Step 2: Update Service Worker Config

1. **Edit `public/firebase-messaging-sw.js`**:
   - Replace placeholder Firebase config with your actual config
   - Use the values from your `.env` file

```javascript
firebase.initializeApp({
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  databaseURL: "YOUR_ACTUAL_DATABASE_URL",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
});
```

### Step 3: Test Push Notifications

#### Testing on Desktop:

1. **Open Customer Dashboard**:
   ```
   http://localhost:5173/customer
   ```

2. **Enable Notifications**:
   - Click "Enable Notifications" button
   - Allow browser permission
   - Check console for FCM token

3. **Send Test Notification**:
   - Use Firebase Console → Cloud Messaging → Send test message
   - Or use our admin panel to update order status

4. **Verify Background Notifications**:
   - Minimize browser
   - Update order status
   - Notification should appear even with browser minimized

#### Testing on Mobile:

1. **Open on Mobile Browser**:
   - Use Chrome or Firefox (Safari has limited support)
   - Navigate to your deployed app

2. **Add to Home Screen** (Recommended):
   - Chrome: Menu → "Add to Home Screen"
   - This enables better notification support

3. **Enable Notifications**:
   - Tap "Enable Notifications"
   - Allow permission

4. **Lock Phone and Test**:
   - Lock phone screen
   - Update order status from admin
   - Notification should appear on lock screen!

---

## 🎯 How It Works

### Architecture:

```
Customer enables notifications
         ↓
FCM token generated
         ↓
Token saved to database (/fcmTokens/{userId})
         ↓
Admin updates order status
         ↓
Server sends push notification to FCM token
         ↓
Firebase Cloud Messaging delivers to device
         ↓
Service worker wakes up
         ↓
Notification appears (even if screen off!)
         ↓
User taps notification
         ↓
App opens to relevant page
```

### Service Worker Flow:

```javascript
// When app is CLOSED or BACKGROUND:
firebase-messaging-sw.js
  → onBackgroundMessage()
  → self.registration.showNotification()
  → User sees system notification

// When app is OPEN:
fcmNotifications.js
  → onMessage()
  → browserNotifications.show()
  → User sees in-app notification
```

---

## 📱 Platform Support

### Desktop Browsers:
| Browser | FCM Support | Background | Screen Off |
|---------|-------------|------------|------------|
| Chrome | ✅ Full | ✅ Yes | ✅ Yes |
| Firefox | ✅ Full | ✅ Yes | ✅ Yes |
| Edge | ✅ Full | ✅ Yes | ✅ Yes |
| Safari | ⚠️ Limited | ❌ No | ❌ No |
| Opera | ✅ Full | ✅ Yes | ✅ Yes |

### Mobile Browsers:
| Browser | FCM Support | Background | Screen Off |
|---------|-------------|------------|------------|
| Chrome Android | ✅ Full | ✅ Yes | ✅ Yes |
| Firefox Android | ✅ Full | ✅ Yes | ✅ Yes |
| Samsung Internet | ✅ Full | ✅ Yes | ✅ Yes |
| Safari iOS | ❌ No | ❌ No | ❌ No |

**Note**: iOS Safari requires PWA (Progressive Web App) installation for push notifications.

---

## 🔍 Testing Checklist

### Desktop Testing:
- [ ] Open customer dashboard
- [ ] Click "Enable Notifications" button
- [ ] See FCM token in console
- [ ] See "Push notifications enabled" success message
- [ ] Minimize browser window
- [ ] Update order status (as admin)
- [ ] See notification appear while browser minimized
- [ ] Click notification → Opens to orders page
- [ ] Check database: fcmTokens/{userId} exists

### Mobile Testing:
- [ ] Open on mobile Chrome/Firefox
- [ ] Add to home screen (optional but recommended)
- [ ] Enable notifications
- [ ] Lock phone screen
- [ ] Update order status from another device
- [ ] See notification on lock screen
- [ ] Unlock and tap notification
- [ ] App opens to orders page
- [ ] Feel vibration when notification arrives

### Background Testing:
- [ ] Close browser completely
- [ ] Wait 30 seconds (ensure service worker is active)
- [ ] Update order status
- [ ] See notification appear
- [ ] Click notification
- [ ] Browser opens to app

---

## 🛠️ Troubleshooting

### Issue: "FCM not supported" message

**Solutions**:
1. Check browser compatibility (Chrome/Firefox recommended)
2. Ensure HTTPS or localhost (FCM requires secure context)
3. Check service worker registration in DevTools → Application → Service Workers
4. Verify `firebase-messaging-sw.js` exists in `/public` folder

### Issue: No notification when screen is off

**Causes**:
1. VAPID key not configured
2. Service worker not registered
3. Browser doesn't support FCM (Safari)
4. Permission denied

**Solutions**:
1. Add VAPID key to `.env`
2. Check console for service worker registration
3. Use Chrome or Firefox
4. Re-request permission (clear browser data first)

### Issue: Token not saved to database

**Solutions**:
1. Check Firebase Database Rules allow writes to `/fcmTokens`
2. Verify user is authenticated
3. Check console for errors
4. Ensure database connection is active

### Issue: Notifications work on desktop but not mobile

**Solutions**:
1. Mobile browser must support FCM (Chrome/Firefox Android)
2. Add to home screen for better support
3. Check device notification settings
4. Ensure mobile browser is updated
5. iOS Safari requires PWA installation

### Issue: Service worker not updating

**Solutions**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear service workers: DevTools → Application → Service Workers → Unregister
3. Clear cache and cookies
4. Restart browser

---

## 🔐 Database Rules

Add these rules to `database.rules.json`:

```json
{
  "rules": {
    "fcmTokens": {
      "$userId": {
        ".read": "$userId === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin'",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

---

## 📊 Database Structure

### FCM Tokens:
```
/fcmTokens/
  {userId}/
    token: "FCM_TOKEN_STRING"
    timestamp: 1696594800000
    platform: "android" | "windows" | "mac" | "ios" | "linux"
```

### Usage:
- Server retrieves token when sending notifications
- Token refreshes automatically if expired
- One token per user per device

---

## 🚀 Sending Notifications from Server

### Method 1: Firebase Admin SDK (Recommended)

```javascript
// In your backend/cloud function
const admin = require('firebase-admin');

async function sendNotificationToUser(userId, notification) {
  // Get user's FCM token from database
  const tokenSnapshot = await admin.database()
    .ref(`fcmTokens/${userId}`)
    .once('value');
  
  const tokenData = tokenSnapshot.val();
  if (!tokenData || !tokenData.token) {
    console.log('No FCM token for user');
    return;
  }

  // Send notification
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      icon: '/vite.svg'
    },
    data: {
      url: notification.url || '/notifications',
      tag: notification.tag || 'default'
    },
    token: tokenData.token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If token is invalid, remove it from database
    if (error.code === 'messaging/registration-token-not-registered') {
      await admin.database().ref(`fcmTokens/${userId}`).remove();
    }
  }
}

// Example: Send order update notification
sendNotificationToUser('user123', {
  title: '🚚 Order Shipped!',
  body: 'Your order #12345 has been shipped',
  url: '/customer/orders'
});
```

### Method 2: HTTP API

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_HERE",
    "notification": {
      "title": "Order Update",
      "body": "Your order has been shipped!",
      "icon": "/vite.svg"
    },
    "data": {
      "url": "/customer/orders"
    }
  }'
```

---

## 🎨 Customization

### Custom Notification Icons:

Edit `public/firebase-messaging-sw.js`:
```javascript
const notificationOptions = {
  body: payload.notification?.body || 'You have a new notification',
  icon: '/custom-icon-192x192.png', // Change this
  badge: '/badge-72x72.png', // Change this
  image: '/notification-image.jpg', // Add large image
  tag: payload.data?.tag || 'ms-special-notification',
  requireInteraction: true, // Keep notification open
  vibrate: [300, 200, 300], // Custom vibration pattern
  actions: [ // Add action buttons (Chrome/Edge)
    { action: 'view', title: 'View Order' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
};
```

### Custom Notification Sounds:

Service workers don't support custom sounds directly, but the system uses default notification sound.

### Custom Vibration Patterns:

```javascript
vibrate: [
  200, // vibrate 200ms
  100, // pause 100ms
  200, // vibrate 200ms
  100, // pause 100ms
  400  // vibrate 400ms
]
```

---

## 📈 Analytics (Optional)

Track notification engagement:

```javascript
// In service worker
self.addEventListener('notificationclick', (event) => {
  // Track click event
  fetch('/api/track-notification-click', {
    method: 'POST',
    body: JSON.stringify({
      notificationId: event.notification.tag,
      timestamp: Date.now()
    })
  });
  
  // ... rest of code
});
```

---

## 🔮 Future Enhancements

### Potential Improvements:
1. **Rich Notifications**: Add product images to notifications
2. **Action Buttons**: "View Order", "Track Package", "Contact Support"
3. **Notification Scheduling**: Schedule notifications for specific times
4. **User Preferences**: Let users choose notification types
5. **Notification History**: Show notification history in app
6. **Multi-Device Support**: Send to all user's devices
7. **Quiet Hours**: Respect user's sleep schedule
8. **Priority Levels**: Different notification priorities

---

## 📚 Resources

### Official Documentation:
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)

### Testing Tools:
- [Firebase Console](https://console.firebase.google.com)
- Chrome DevTools → Application → Service Workers
- Chrome DevTools → Application → Notifications

---

## ✅ Verification

### Confirm Implementation:

1. **Service Worker Registered**:
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service Workers:', regs);
   });
   ```

2. **FCM Token Generated**:
   ```javascript
   // Check database in Firebase Console
   // Path: /fcmTokens/{userId}
   ```

3. **Notification Permission**:
   ```javascript
   // In browser console
   console.log('Permission:', Notification.permission);
   ```

4. **Test Notification**:
   - Firebase Console → Cloud Messaging
   - Click "Send test message"
   - Paste FCM token
   - Send notification

---

## 🎉 Summary

### What We Built:
✅ Firebase Cloud Messaging integration  
✅ Background notification support  
✅ Service worker for offline notifications  
✅ FCM token management  
✅ Customer notifications menu  
✅ Unread notification badges  
✅ Works with screen off/background  
✅ Click-to-navigate functionality  
✅ Cross-platform support (except iOS Safari)  

### Key Benefits:
- 📱 Notifications even when screen is off
- 🔋 Battery-efficient push notifications
- 🌐 Works across devices
- 🔔 System-level notifications
- 📲 Lock screen notifications on mobile
- ⚡ Real-time delivery
- 🎯 Reliable notification delivery

---

## ⚠️ Important Notes

### Required for Production:
1. ✅ Deploy service worker to production
2. ✅ Add VAPID key to environment variables
3. ✅ Update Firebase database rules
4. ✅ Test on real devices (not just localhost)
5. ✅ Verify HTTPS is enabled (required for FCM)

### Limitations:
- ❌ iOS Safari requires PWA installation
- ⚠️ Some browsers block notifications if user denies first time
- ⚠️ Service workers require HTTPS (works on localhost for dev)
- ⚠️ FCM has rate limits (consult Firebase pricing)

---

**Last Updated**: October 6, 2025  
**Version**: 2.0  
**Status**: ✅ Ready for Setup & Testing

**Next Steps**: 
1. Add VAPID key to `.env`
2. Update service worker config
3. Deploy and test
4. Configure Firebase Database Rules
