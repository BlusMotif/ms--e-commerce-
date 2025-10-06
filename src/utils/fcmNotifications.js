/**
 * Firebase Cloud Messaging (FCM) Utility
 * Handles push notifications even when app is in background or screen is off
 */

import { messaging } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';
import browserNotifications from './browserNotifications';

// VAPID key for web push (get this from Firebase Console -> Project Settings -> Cloud Messaging)
// You need to generate this in Firebase Console
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

class FCMService {
  constructor() {
    this.currentToken = null;
    this.initialized = false;
  }

  /**
   * Check if FCM is supported in this browser
   */
  isSupported() {
    return messaging !== null && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialize FCM and register service worker
   */
  async initialize() {
    if (this.initialized || !this.isSupported()) {
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Set up foreground message handler
      this.setupForegroundMessageHandler();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      return false;
    }
  }

  /**
   * Request notification permission and get FCM token
   * @param {string} userId - User ID to associate the token with
   * @returns {Promise<string|null>} FCM token or null if failed
   */
  async requestPermissionAndGetToken(userId) {
    if (!this.isSupported()) {
      console.warn('FCM not supported in this browser');
      return null;
    }

    try {
      // First, ensure FCM is initialized
      await this.initialize();

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        this.currentToken = token;

        // Save token to database for this user
        if (userId) {
          await this.saveTokenToDatabase(userId, token);
        }

        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to database
   * @param {string} userId - User ID
   * @param {string} token - FCM token
   */
  async saveTokenToDatabase(userId, token) {
    try {
      const tokenRef = ref(database, `fcmTokens/${userId}`);
      await set(tokenRef, {
        token,
        timestamp: Date.now(),
        platform: this.getPlatform(),
      });
      console.log('FCM token saved to database');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Set up handler for foreground messages (when app is in focus)
   */
  setupForegroundMessageHandler() {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show browser notification using our utility
      if (payload.notification) {
        browserNotifications.show(
          payload.notification.title || 'MS Special',
          {
            body: payload.notification.body || '',
            icon: payload.notification.icon || '/vite.svg',
            badge: '/vite.svg',
            tag: payload.data?.tag || 'fcm-notification',
            url: payload.data?.url || '/notifications',
            vibrate: [200, 100, 200],
            data: payload.data,
          }
        );
      }
    });
  }

  /**
   * Get current platform
   */
  getPlatform() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Windows/.test(ua)) return 'windows';
    if (/Mac/.test(ua)) return 'mac';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
  }

  /**
   * Check if notifications are enabled
   */
  areNotificationsEnabled() {
    return Notification.permission === 'granted' && this.currentToken !== null;
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.currentToken;
  }
}

// Create and export singleton instance
const fcmService = new FCMService();

export default fcmService;
