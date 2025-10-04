import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Tag,
  Image as ImageIcon,
  User,
  Bell,
  Megaphone,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [products, setProducts] = useState([]);

  // Fetch products for agent filtering
  useEffect(() => {
    if (role !== 'agent') return;

    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productsArray);
      }
    });

    return () => unsubscribe();
  }, [role]);

  // Fetch pending orders count for admin/agent
  useEffect(() => {
    if (role !== 'admin' && role !== 'agent') return;

    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        let count = 0;
        if (role === 'admin') {
          // Count all pending orders for admin
          count = ordersArray.filter(o => 
            o.status === 'pending' || o.status === 'processing'
          ).length;
        } else if (role === 'agent') {
          // Count agent's pending orders only
          count = ordersArray.filter(order => {
            const hasPendingStatus = order.status === 'pending' || order.status === 'processing';
            const hasAgentProducts = order.items?.some(item => {
              // Find the product to check if it belongs to this agent
              const product = products.find(p => p.name === item.name || p.id === item.productId);
              return product && (product.agentId === user.uid || product.createdBy === user.uid);
            });
            return hasPendingStatus && hasAgentProducts;
          }).length;
        }

        setPendingOrdersCount(count);
      } else {
        setPendingOrdersCount(0);
      }
    });

    return () => unsubscribe();
  }, [role, user, products]);

  // Fetch notifications for admin and agent
  useEffect(() => {
    if (!user?.uid || (role !== 'admin' && role !== 'agent')) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const userNotificationsRef = ref(database, `notifications/${user.uid}`);
    const unsubscribeUser = onValue(userNotificationsRef, (snapshot) => {
      const userNotifs = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          userNotifs.push({
            id: key,
            ...data[key],
          });
        });
      }
      
      // Sort by createdAt descending and take top 5
      userNotifs.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(userNotifs.slice(0, 5));
      setUnreadCount(userNotifs.filter(n => !n.read).length);
    });

    return () => unsubscribeUser();
  }, [user, role]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getMenuItems = () => {
    if (role === 'customer') {
      return [
        { path: '/', label: 'Home', icon: Home },
        { path: '/customer', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customer/orders', label: 'My Orders', icon: ShoppingCart },
        { path: '/customer/profile', label: 'Profile', icon: User },
      ];
    }

    if (role === 'agent') {
      return [
        { path: '/agent', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/agent/products', label: 'Products', icon: Package },
        { path: '/agent/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/agent/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/agent/settings', label: 'Settings', icon: Settings },
      ];
    }

    if (role === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/admin/agents', label: 'Agents', icon: Users },
        { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
        { path: '/admin/categories', label: 'Categories', icon: Tag },
        { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
      ];
    }

    // Fallback for no role
    return [
      { path: '/', label: 'Home', icon: Home },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <Link to="/" className="text-xl font-bold text-primary-600">
            MS Special
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isOrdersPage = item.label === 'Orders';
            const showBadge = isOrdersPage && pendingOrdersCount > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {showBadge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              {/* Notification Bell - Only for admin and agent */}
              {(role === 'admin' || role === 'agent') && (
                <div className="relative">
                  <button
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown - Mobile Responsive */}
                  {notificationOpen && (
                    <>
                      {/* Backdrop for mobile */}
                      <div 
                        className="fixed inset-0 z-40 lg:hidden"
                        onClick={() => setNotificationOpen(false)}
                      />
                      
                      {/* Dropdown */}
                      <div className="fixed lg:absolute top-16 lg:top-full right-4 lg:right-0 mt-0 lg:mt-2 w-[calc(100vw-2rem)] lg:w-96 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[70vh] lg:max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <button
                            onClick={() => {
                              setNotificationOpen(false);
                              navigate('/notifications');
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View All
                          </button>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                                  !notif.read ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                  setNotificationOpen(false);
                                  navigate('/notifications');
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <span className="text-xl flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notif.type)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notif.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
