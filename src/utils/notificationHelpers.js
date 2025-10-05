import { ref, update, onValue } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Mark notifications related to a specific order as read
 * @param {string} userId - The user ID who owns the notifications
 * @param {string} orderId - The order ID to match notifications against
 */
export const markOrderNotificationsAsRead = async (userId, orderId) => {
  if (!userId || !orderId) return;

  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    
    // Fetch all notifications for the user
    onValue(notificationsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const notifications = snapshot.val();
        const updatePromises = [];

        // Find and mark notifications related to this order as read
        Object.keys(notifications).forEach((notifId) => {
          const notif = notifications[notifId];
          
          // Check if notification is related to this order and is unread
          if (!notif.read && notif.orderId === orderId) {
            const notifRef = ref(database, `notifications/${userId}/${notifId}`);
            updatePromises.push(update(notifRef, { read: true }));
          }
        });

        // Execute all updates
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`Marked ${updatePromises.length} notification(s) as read for order ${orderId}`);
        }
      }
    }, { onlyOnce: true }); // Only fetch once
  } catch (error) {
    console.error('Error marking order notifications as read:', error);
  }
};

/**
 * Mark a single notification as read
 * @param {string} userId - The user ID who owns the notification
 * @param {string} notificationId - The notification ID to mark as read
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  if (!userId || !notificationId) return;

  try {
    const notifRef = ref(database, `notifications/${userId}/${notificationId}`);
    await update(notifRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications for a user as read
 * @param {string} userId - The user ID whose notifications to mark as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;

  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    
    onValue(notificationsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const notifications = snapshot.val();
        const updatePromises = [];

        Object.keys(notifications).forEach((notifId) => {
          const notif = notifications[notifId];
          if (!notif.read) {
            const notifRef = ref(database, `notifications/${userId}/${notifId}`);
            updatePromises.push(update(notifRef, { read: true }));
          }
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`Marked ${updatePromises.length} notification(s) as read`);
        }
      }
    }, { onlyOnce: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
