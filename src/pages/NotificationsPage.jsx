import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { Bell, CheckCircle, AlertCircle, Info, Megaphone, X, Check, Trash2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const NotificationsPage = () => {
  const { user, role } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch user-specific notifications
    const userNotificationsRef = ref(database, `notifications/${user.uid}`);
    const unsubscribeUser = onValue(userNotificationsRef, (snapshot) => {
      const userNotifs = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          userNotifs.push({
            id: key,
            ...data[key],
            source: 'user',
          });
        });
      }
      
      // Fetch system-wide announcements
      const announcementsRef = ref(database, 'announcements');
      const unsubscribeAnnouncements = onValue(announcementsRef, (announcementSnapshot) => {
        const allNotifs = [...userNotifs];
        
        if (announcementSnapshot.exists()) {
          const announcementData = announcementSnapshot.val();
          Object.keys(announcementData).forEach((key) => {
            const announcement = announcementData[key];
            
            // Check if announcement is for this user's role
            if (
              announcement.active &&
              (announcement.targetAudience === 'all' ||
                announcement.targetAudience === role ||
                (announcement.targetAudience === 'customers' && role === 'customer') ||
                (announcement.targetAudience === 'agents' && role === 'agent') ||
                (announcement.targetAudience === 'admins' && role === 'admin'))
            ) {
              allNotifs.push({
                id: key,
                ...announcement,
                source: 'announcement',
                read: false, // Announcements are always unread
              });
            }
          });
        }
        
        // Sort by createdAt descending
        allNotifs.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(allNotifs);
        setLoading(false);
      });

      return () => unsubscribeAnnouncements();
    });

    return () => unsubscribeUser();
  }, [user, role]);

  const handleMarkAsRead = async (notificationId, source) => {
    if (source === 'announcement') return; // Can't mark announcements as read
    
    try {
      const notifRef = ref(database, `notifications/${user.uid}/${notificationId}`);
      await update(notifRef, { read: true });
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadUserNotifs = notifications.filter(n => !n.read && n.source === 'user');
      
      for (const notif of unreadUserNotifs) {
        const notifRef = ref(database, `notifications/${user.uid}/${notif.id}`);
        await update(notifRef, { read: true });
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'error':
        return <X className="w-6 h-6 text-red-600" />;
      case 'announcement':
        return <Megaphone className="w-6 h-6 text-blue-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read && n.source === 'user').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-outline flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Stay updated with your orders, activities, and announcements
        </p>
      </div>

      {/* Filters - Scrollable on Mobile */}
      <div className="card mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <div className="overflow-x-auto flex-1">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filter === 'unread'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filter === 'read'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read ({notifications.filter(n => n.read).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`card hover:shadow-md transition-shadow ${
                !notification.read && notification.source === 'user' ? 'bg-white border-l-4 border-orange-500' : 'bg-gray-50'
              }`}
            >
              {/* Jumia-style layout: image on left, content on right */}
              <div className="flex gap-4">
                {/* Product Images - Jumia style */}
                {notification.metadata?.productImages && notification.metadata.productImages.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex gap-2">
                      {notification.metadata.productImages.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {notification.metadata.itemCount > 3 && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        +{notification.metadata.itemCount - 3} more
                      </p>
                    )}
                  </div>
                )}

                {/* Icon for non-order notifications */}
                {!notification.metadata?.productImages && (
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type || 'info')}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base">{notification.title}</h3>
                        {!notification.read && notification.source === 'user' && (
                          <span className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                        {notification.source === 'announcement' && (
                          <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                            Announcement
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    {!notification.read && notification.source === 'user' && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id, notification.source)}
                        className="flex-shrink-0 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Link - Navigate to My Orders for customers */}
                  {notification.metadata?.orderLink && (
                    <Link
                      to={role === 'customer' ? '/customer/orders' : notification.metadata.orderLink}
                      className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm mt-2"
                      onClick={() => handleMarkAsRead(notification.id, notification.source)}
                    >
                      View Order →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? "You're all caught up! No unread notifications."
              : filter === 'read'
              ? "No read notifications yet."
              : "You'll see notifications here when you have updates."}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
