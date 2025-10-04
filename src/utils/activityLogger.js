import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Log agent activity to Firebase
 * @param {string} action - The action performed (e.g., 'ADD_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT')
 * @param {string} performedBy - Name or UID of the user who performed the action
 * @param {string} details - Additional details about the action
 */
export const logActivity = async (action, performedBy, details) => {
  try {
    const logRef = ref(database, `agentLogs/${Date.now()}`);
    await set(logRef, {
      action,
      performedBy,
      details,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Pre-defined action types for consistency
 */
export const ACTION_TYPES = {
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  DELETE_ALL_ORDERS: 'DELETE_ALL_ORDERS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
};
