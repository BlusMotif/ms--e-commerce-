import { ref, push, set } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Send a notification to a specific user
 * @param {string} userId - The user ID to send notification to
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (success, info, warning, error)
 * @param {Object} notificationData.metadata - Additional metadata (optional)
 */
export const sendNotification = async (userId, notificationData) => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const newNotificationRef = push(notificationsRef);
    
    await set(newNotificationRef, {
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      read: false,
      createdAt: Date.now(),
      metadata: notificationData.metadata || {},
    });
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Send order status update notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} orderId - Order ID
 * @param {string} oldStatus - Previous order status
 * @param {string} newStatus - New order status
 */
export const sendOrderStatusNotification = async (userId, orderId, oldStatus, newStatus) => {
  const statusMessages = {
    confirmed: {
      title: '🎉 Order Confirmed!',
      message: `Your order #${orderId.substring(0, 8)} has been confirmed and is being prepared.`,
      type: 'success',
    },
    'out-for-delivery': {
      title: '🚚 Order Out for Delivery',
      message: `Your order #${orderId.substring(0, 8)} is on its way! Expected delivery soon.`,
      type: 'info',
    },
    'ready-for-pickup': {
      title: '📦 Order Ready for Pickup',
      message: `Your order #${orderId.substring(0, 8)} is ready for pickup at your selected location.`,
      type: 'info',
    },
    delivered: {
      title: '✅ Order Delivered',
      message: `Your order #${orderId.substring(0, 8)} has been delivered successfully. Thank you for shopping with us!`,
      type: 'success',
    },
    'picked-up': {
      title: '✅ Order Picked Up',
      message: `Your order #${orderId.substring(0, 8)} has been picked up. Thank you for shopping with us!`,
      type: 'success',
    },
    cancelled: {
      title: '❌ Order Cancelled',
      message: `Your order #${orderId.substring(0, 8)} has been cancelled. If you have any questions, please contact us.`,
      type: 'error',
    },
  };

  const notificationData = statusMessages[newStatus];
  
  if (notificationData) {
    return await sendNotification(userId, {
      ...notificationData,
      metadata: {
        orderId,
        orderLink: `/customer/orders`,
        oldStatus,
        newStatus,
      },
    });
  }
  
  return false;
};

/**
 * Send payment confirmation notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 */
export const sendPaymentConfirmationNotification = async (userId, orderId, amount) => {
  return await sendNotification(userId, {
    title: '💰 Payment Confirmed',
    message: `Payment of GH₵ ${amount.toFixed(2)} for order #${orderId.substring(0, 8)} has been confirmed.`,
    type: 'success',
    metadata: {
      orderId,
      amount,
      orderLink: `/customer/orders`,
    },
  });
};

/**
 * Send payment reminder notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 */
export const sendPaymentReminderNotification = async (userId, orderId, amount) => {
  return await sendNotification(userId, {
    title: '💳 Payment Pending',
    message: `Payment of GH₵ ${amount.toFixed(2)} is pending for order #${orderId.substring(0, 8)}. Please complete payment upon delivery/pickup.`,
    type: 'warning',
    metadata: {
      orderId,
      amount,
      orderLink: `/customer/orders`,
    },
  });
};

/**
 * Send order placed notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} orderId - Order ID
 * @param {number} total - Order total
 */
export const sendOrderPlacedNotification = async (userId, orderId, total) => {
  return await sendNotification(userId, {
    title: '🛒 Order Placed Successfully',
    message: `Your order #${orderId.substring(0, 8)} totaling GH₵ ${total.toFixed(2)} has been placed successfully. You'll receive updates as your order progresses.`,
    type: 'success',
    metadata: {
      orderId,
      total,
      orderLink: `/customer/orders`,
    },
  });
};
