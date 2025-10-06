/**
 * Browser Notifications Utility
 * Handles requesting permission and displaying browser notifications
 * Works on both desktop and mobile devices
 */

class BrowserNotifications {
  constructor() {
    this.permission = 'default';
    this.checkPermission();
  }

  /**
   * Check current notification permission status
   */
  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status ('granted', 'denied', or 'default')
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @param {string} options.body - Notification body text
   * @param {string} options.icon - URL to notification icon
   * @param {string} options.badge - URL to notification badge (for mobile)
   * @param {string} options.tag - Unique tag to replace existing notification
   * @param {boolean} options.requireInteraction - Keep notification visible until user interacts
   * @param {Array} options.actions - Array of action buttons (for supported browsers)
   * @param {string} options.url - URL to open when notification is clicked
   * @returns {Notification|null} Notification object or null if failed
   */
  show(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const defaultOptions = {
        icon: '/vite.svg', // Default icon
        badge: '/vite.svg', // Badge for mobile
        vibrate: [200, 100, 200], // Vibration pattern for mobile
        silent: false,
        requireInteraction: false,
        tag: 'ms-special-notification',
      };

      const notificationOptions = {
        ...defaultOptions,
        ...options,
      };

      const notification = new Notification(title, notificationOptions);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.url) {
          window.location.href = options.url;
        }
        
        notification.close();
      };

      // Auto-close after specified duration (default: 5 seconds)
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, options.duration || 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show order update notification
   * @param {Object} order - Order object
   */
  showOrderUpdate(order) {
    const statusMessages = {
      pending: 'Your order has been received and is pending approval',
      processing: 'Your order is being processed',
      shipped: 'Your order has been shipped!',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
    };

    const statusIcons = {
      pending: '⏳',
      processing: '📦',
      shipped: '🚚',
      delivered: '✅',
      cancelled: '❌',
    };

    this.show(
      `${statusIcons[order.status] || '📬'} Order Update`,
      {
        body: statusMessages[order.status] || `Order status: ${order.status}`,
        tag: `order-${order.id}`,
        url: '/customer/orders',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      }
    );
  }

  /**
   * Show new announcement notification
   * @param {Object} announcement - Announcement object
   */
  showAnnouncement(announcement) {
    this.show(
      `📢 ${announcement.title}`,
      {
        body: announcement.message,
        tag: `announcement-${announcement.id}`,
        url: '/notifications',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      }
    );
  }

  /**
   * Show generic notification
   * @param {Object} notification - Notification object
   */
  showNotification(notification) {
    const icons = {
      order: '📦',
      announcement: '📢',
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };

    this.show(
      `${icons[notification.type] || '📬'} ${notification.title}`,
      {
        body: notification.message || notification.body,
        tag: `notification-${notification.id}`,
        url: notification.url || '/notifications',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      }
    );
  }

  /**
   * Check if browser supports notifications
   * @returns {boolean}
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   * @returns {boolean}
   */
  isGranted() {
    return this.permission === 'granted';
  }

  /**
   * Check if notifications are enabled and supported
   * @returns {boolean}
   */
  isEnabled() {
    return this.isSupported() && this.isGranted();
  }
}

// Create and export a singleton instance
const browserNotifications = new BrowserNotifications();

export default browserNotifications;
