// Firebase Messaging Service Worker
// This enables background notifications when the app is not in focus

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAq_TJqkwNNTLLcJQaA4vZuvXG2rBTTUkQ",
  authDomain: "msspecial-e-commerce.firebaseapp.com",
  databaseURL: "https://msspecial-e-commerce-default-rtdb.firebaseio.com",
  projectId: "msspecial-e-commerce",
  storageBucket: "msspecial-e-commerce.firebasestorage.app",
  messagingSenderId: "58578486361",
  appId: "1:58578486361:web:678ec06364c0c5780e1d48"
});

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'MS Special';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.tag || 'ms-special-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/notifications',
      ...payload.data
    }
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/notifications';

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window with the URL is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
