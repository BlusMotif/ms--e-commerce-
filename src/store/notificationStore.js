import { create } from 'zustand';
import notificationSound from '../utils/notificationSound';
import browserNotifications from '../utils/browserNotifications';

const useNotificationStore = create((set, get) => ({
  // Track if there are unseen orders
  hasUnseenOrders: false,
  
  // Track previous order count to detect new orders
  previousOrderCount: 0,
  
  // Track unread notifications count
  unreadNotificationsCount: 0,
  
  // Track last notification ID to detect new notifications
  lastNotificationId: null,
  
  // Set unseen orders flag and start sound loop
  setUnseenOrders: (hasUnseen) => {
    set({ hasUnseenOrders: hasUnseen });
    if (hasUnseen) {
      notificationSound.startLoop();
    } else {
      notificationSound.stopLoop();
    }
  },
  
  // Update order count and check for new orders
  updateOrderCount: (newCount) => {
    const { previousOrderCount } = get();
    
    // Detect new orders (count increased and not initial load)
    if (previousOrderCount > 0 && newCount > previousOrderCount) {
      set({ hasUnseenOrders: true, previousOrderCount: newCount });
      notificationSound.startLoop();
    } else {
      set({ previousOrderCount: newCount });
    }
  },
  
  // Update notification count and show browser notification if new ones arrive
  updateNotificationCount: (count, latestNotification = null) => {
    const { lastNotificationId } = get();
    
    // Detect new notification
    if (latestNotification && latestNotification.id !== lastNotificationId) {
      // Show browser notification if permission granted
      if (browserNotifications.isEnabled()) {
        browserNotifications.showNotification(latestNotification);
      }
      
      set({ 
        unreadNotificationsCount: count, 
        lastNotificationId: latestNotification.id 
      });
    } else {
      set({ unreadNotificationsCount: count });
    }
  },
  
  // Show order update browser notification
  showOrderNotification: (order) => {
    if (browserNotifications.isEnabled()) {
      browserNotifications.showOrderUpdate(order);
    }
  },
  
  // Show announcement browser notification
  showAnnouncementNotification: (announcement) => {
    if (browserNotifications.isEnabled()) {
      browserNotifications.showAnnouncement(announcement);
    }
  },
  
  // Request notification permission
  requestNotificationPermission: async () => {
    const permission = await browserNotifications.requestPermission();
    return permission === 'granted';
  },
  
  // Check if browser notifications are enabled
  areNotificationsEnabled: () => {
    return browserNotifications.isEnabled();
  },
  
  // Mark orders as seen (stop sound and clear flag)
  markOrdersSeen: () => {
    set({ hasUnseenOrders: false });
    notificationSound.stopLoop();
  },
  
  // Reset state (useful for logout)
  reset: () => {
    set({ 
      hasUnseenOrders: false, 
      previousOrderCount: 0,
      unreadNotificationsCount: 0,
      lastNotificationId: null
    });
    notificationSound.stopLoop();
  },
}));

export default useNotificationStore;
