import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import notificationSound from '../../utils/notificationSound';
import useNotificationStore from '../../store/notificationStore';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Box,
  ShoppingCart,
  Users,
  Volume2,
  VolumeX,
  Bell,
  X
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(notificationSound.getEnabled());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Use global notification store
  const { hasUnseenOrders, updateOrderCount, markOrdersSeen } = useNotificationStore();

  useEffect(() => {
    if (!user?.uid) return;

    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const agentProducts = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((product) => product.agentId === user.uid || product.createdBy === user.uid);
        setProducts(agentProducts);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.uid || products.length === 0) return;

    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allOrders = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).filter(order => {
          // Exclude cancelled orders UNLESS they are Cash on Delivery
          const isCancelled = order.status === 'cancelled' || order.paymentStatus === 'cancelled';
          const isCashOnDelivery = order.paymentMethod === 'cash' || order.paymentMethod === 'cod';
          
          // Show if: NOT cancelled OR is cash on delivery
          return !isCancelled || isCashOnDelivery;
        });

        const agentOrders = allOrders.filter((order) =>
          order.items.some((item) => {
            const product = products.find((p) => p.name === item.name);
            return product && (product.agentId === user.uid || product.createdBy === user.uid);
          })
        );

        // Use global store to track order count and trigger sound
        updateOrderCount(agentOrders.length);

        setOrders(agentOrders);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubscribeOrders();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, products]);

  // Show latest agent orders as notifications (not announcements)
  useEffect(() => {
    // Use the agent orders already fetched to create notifications - show ALL orders
    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(order => ({
        id: order.id,
        title: `New Order #${order.id.slice(0, 8)}`,
        message: `${order.customerName} placed an order including your products`,
        type: order.isPaid || order.paymentMethod === 'cash' ? 'success' : 'info',
        createdAt: order.createdAt,
        source: 'order',
      }));
    
    setNotifications(recentOrders);
  }, [orders]);

  // Stop sound on any click/interaction - REMOVED from here, moved to App.jsx for global effect

  // Calculate stats - only count paid orders for revenue
  // Check multiple payment field possibilities for compatibility
  const paidOrders = orders.filter(o => 
    o.isPaid === true || 
    o.isPaid === 'true' || 
    o.paymentStatus === 'paid' || 
    o.paymentStatus === 'completed' ||
    (o.status === 'delivered' || o.status === 'picked-up') // Delivered/picked-up orders are assumed paid
  );
  
  const stats = {
    totalProducts: products.length,
    inStockProducts: products.filter((p) => p.stock > 10).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    completedOrders: orders.filter((o) => o.status === 'delivered' || o.status === 'picked-up').length,
    totalRevenue: paidOrders.reduce((sum, order) => {
      const orderRevenue = order.items
        .filter((item) => {
          const product = products.find((p) => p.name === item.name);
          return product && (product.agentId === user.uid || product.createdBy === user.uid);
        })
        .reduce((itemSum, item) => itemSum + ((item.price || 0) * (item.quantity || 0)), 0);
      return sum + orderRevenue;
    }, 0),
  };

  // Get sold items from paid orders with product details (agent's products only)
  const soldItems = paidOrders.flatMap(order => 
    order.items
      .filter(item => {
        const product = products.find((p) => p.name === item.name);
        return product && (product.agentId === user.uid || product.createdBy === user.uid);
      })
      .map(item => {
        // Find the actual product to get the correct image
        const product = products.find((p) => p.name === item.name || p.id === item.productId);
        return {
          ...item,
          image: item.image || product?.image || product?.images?.[0] || '',
          orderId: order.id,
          orderDate: order.createdAt
        };
      })
  );

  // Group sold items by product name and calculate totals
  const soldProductsMap = soldItems.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = {
        name: item.name,
        image: item.image,
        totalQuantity: 0,
        totalRevenue: 0,
        sales: 0
      };
    }
    acc[item.name].totalQuantity += item.quantity;
    acc[item.name].totalRevenue += item.price * item.quantity;
    acc[item.name].sales += 1;
    return acc;
  }, {});

  const soldProducts = Object.values(soldProductsMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  const recentOrders = orders
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Toggle notification sound
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationSound.setEnabled(newState);
  };

  const handleNotificationClick = () => {
    // Stop looping sound when notifications are opened - use global store
    markOrdersSeen();
    setShowNotifications(!showNotifications);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 My Business Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Complete overview of your sales performance</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              title="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Notifications</span>
              {hasUnseenOrders && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  !
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown - Mobile Responsive */}
            {showNotifications && (
              <>
                {/* Backdrop for mobile */}
                <div 
                  className="fixed inset-0 z-40 lg:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Dropdown */}
                <div className="fixed lg:absolute left-4 right-4 lg:left-auto lg:right-0 top-20 lg:top-full mt-0 lg:mt-2 w-auto lg:w-80 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[70vh] lg:max-h-96 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-3 hover:bg-gray-50 transition">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                {notif.type === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                                {!notif.type && <Bell className="w-4 h-4 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 flex-shrink-0">
                    <Link 
                      to="/notifications" 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium block text-center"
                      onClick={() => setShowNotifications(false)}
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Click to turn off notification sounds' : 'Click to turn on notification sounds'}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={20} />
                <span className="text-xs sm:text-sm font-medium">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX size={20} />
                <span className="text-xs sm:text-sm font-medium">Sound Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Revenue Card with better spacing */}
      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-green-100 text-xs sm:text-sm mb-2">💰 My Total Earnings (Paid Orders)</p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</p>
            <p className="text-green-100 mt-2 sm:mt-3 flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4" />
              From {stats.paidOrders} paid sales out of {stats.totalOrders} total
            </p>
          </div>
          <DollarSign className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-green-200 opacity-50" />
        </div>
      </div>

      {/* Stats Cards with better gaps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-purple-700 text-xs sm:text-sm font-medium mb-1">📦 My Products</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.totalProducts}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{stats.inStockProducts} in stock</span>
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{stats.outOfStock} out</span>
                </p>
              </div>
            </div>
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500 flex-shrink-0" />
          </div>
        </div>

        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-blue-700 text-xs sm:text-sm font-medium mb-1">🛍️ My Sales</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.totalOrders}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{stats.completedOrders} completed</span>
                </p>
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{stats.pendingOrders} pending</span>
                </p>
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 flex-shrink-0" />
          </div>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-green-700 text-xs sm:text-sm font-medium mb-1">✅ Good Stock</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.inStockProducts}</p>
              <p className="text-xs text-green-600 mt-2 truncate">More than 10 items</p>
            </div>
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 flex-shrink-0" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-yellow-700 text-xs sm:text-sm font-medium mb-1">⚠️ Low Stock</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{stats.lowStock}</p>
              <p className="text-xs text-yellow-600 mt-2 truncate">Need to restock soon</p>
            </div>
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Inventory Status - More Compact */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
          <Box className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          📦 My Inventory Status
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">Stock levels in your products</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 sm:p-5 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-green-600">{stats.inStockProducts}</p>
            <p className="text-green-700 font-medium mt-2 text-sm">✅ Good Stock</p>
            <p className="text-xs text-green-600 mt-1">More than 10 items</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-5 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-yellow-700 font-medium mt-2 text-sm">⚠️ Running Low</p>
            <p className="text-xs text-yellow-600 mt-1">1-10 items left</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-5 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-red-700 font-medium mt-2 text-sm">❌ Out of Stock</p>
            <p className="text-xs text-red-600 mt-1">Need to restock now!</p>
          </div>
        </div>
      </div>

      {/* Recent Sales and Quick Actions - Better Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              My Recent Sales
            </h2>
            <Link to="/agent/orders" className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium">
              See All →
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-gray-900 text-sm truncate">#{order.id.substring(0, 8)}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerName || 'Customer'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600 text-sm sm:text-base">GH₵ {order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'delivered' || order.status === 'picked-up' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No sales yet</p>
              <p className="text-xs sm:text-sm mt-1">Add products to start selling!</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            Quick Actions
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <Link to="/agent/products" className="block p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-purple-900 text-sm sm:text-base">My Products</p>
                  <p className="text-xs sm:text-sm text-purple-700 truncate">{stats.totalProducts} total products</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/orders" className="block p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-900 text-sm sm:text-base">My Sales</p>
                  <p className="text-xs sm:text-sm text-blue-700 truncate">{stats.pendingOrders} need attention</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/analytics" className="block p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-green-900 text-sm sm:text-base">Sales Report</p>
                  <p className="text-xs sm:text-sm text-green-700 truncate">View detailed analytics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* My Sold Products Section - More Compact */}
      {soldProducts.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                My Products Sold & Paid
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Your best selling products with verified payments</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-600">Total Items Sold</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {soldProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}
              </p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {soldProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition">
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-primary-200">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Sold: <span className="font-semibold text-primary-600">{product.totalQuantity} units</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {product.sales} sales
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-600">My Revenue</p>
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        GH₵ {product.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-xs sm:text-sm">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs sm:text-sm text-green-700 font-medium">My Total Sales Revenue (Paid Orders Only)</p>
                <p className="text-xs text-green-600 mt-1">Sum of all my products sold and paid for</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-green-700">
                  GH₵ {soldProducts.reduce((sum, p) => sum + p.totalRevenue, 0).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {soldProducts.reduce((sum, p) => sum + p.totalQuantity, 0)} items sold
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
