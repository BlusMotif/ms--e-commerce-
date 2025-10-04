import { create } from 'zustand';
import notificationSound from '../utils/notificationSound';

const useNotificationStore = create((set, get) => ({
  // Track if there are unseen orders
  hasUnseenOrders: false,
  
  // Track previous order count to detect new orders
  previousOrderCount: 0,
  
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
  
  // Mark orders as seen (stop sound and clear flag)
  markOrdersSeen: () => {
    set({ hasUnseenOrders: false });
    notificationSound.stopLoop();
  },
  
  // Reset state (useful for logout)
  reset: () => {
    set({ hasUnseenOrders: false, previousOrderCount: 0 });
    notificationSound.stopLoop();
  },
}));

export default useNotificationStore;
