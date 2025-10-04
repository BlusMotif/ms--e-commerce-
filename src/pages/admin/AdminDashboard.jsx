import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, remove, set } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Link } from 'react-router-dom';
import notificationSound from '../../utils/notificationSound';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Box,
  ShoppingBag,
  Trash2,
  History,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [agentLogs, setAgentLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(notificationSound.getEnabled());
  const previousOrderCountRef = useRef(0);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        
        // Check for new orders and play sound
        if (previousOrderCountRef.current > 0 && ordersArray.length > previousOrderCountRef.current) {
          // New order detected!
          notificationSound.playOrderNotification();
        }
        previousOrderCountRef.current = ordersArray.length;
        
        setOrders(ordersArray);
      }
    });

    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productsArray);
      }
      setLoading(false);
    });

    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersArray = Object.keys(data).map((key) => ({
          uid: key,
          ...data[key],
        }));
        setUsers(usersArray);
      }
    });

    // Fetch agent activity logs
    const logsRef = ref(database, 'agentLogs');
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const logsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => b.timestamp - a.timestamp);
        setAgentLogs(logsArray);
      } else {
        setAgentLogs([]);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  // Function to delete all orders (requires authentication)
  const handleDeleteAllOrders = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user || !user.email) {
        setDeleteError('No authenticated user found. Please log in again.');
        return;
      }

      // Create credential with user's email and entered password
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      
      // Re-authenticate to verify password
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication succeeds, delete all orders
      const ordersRef = ref(database, 'orders');
      await remove(ordersRef);
      
      // Log this action
      const logRef = ref(database, `agentLogs/${Date.now()}`);
      await set(logRef, {
        action: 'DELETE_ALL_ORDERS',
        performedBy: user.email || 'Admin',
        timestamp: Date.now(),
        details: `Deleted ${orders.length} orders`
      });

      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteError('');
      alert('All orders have been successfully deleted!');
    } catch (error) {
      console.error('Delete error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password! Access denied.');
      } else if (error.code === 'auth/too-many-requests') {
        setDeleteError('Too many failed attempts. Please try again later.');
      } else {
        setDeleteError('Error: ' + error.message);
      }
    }
  };

  // Function to reset agent logs
  const handleResetLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) {
      return;
    }

    const password = prompt('Enter your admin password to confirm:');
    if (!password) {
      return;
    }

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user || !user.email) {
        alert('No authenticated user found. Please log in again.');
        return;
      }

      // Create credential with user's email and entered password
      const credential = EmailAuthProvider.credential(user.email, password);
      
      // Re-authenticate to verify password
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication succeeds, clear logs
      const logsRef = ref(database, 'agentLogs');
      await remove(logsRef);
      alert('Activity logs have been cleared successfully!');
    } catch (error) {
      console.error('Reset logs error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert('Incorrect password! Access denied.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many failed attempts. Please try again later.');
      } else {
        alert('Error clearing logs: ' + error.message);
      }
    }
  };

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
    totalRevenue: paidOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length,
    totalProducts: products.length,
    inStockProducts: products.filter(p => p.stock > 10).length,
    lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStockProducts: products.filter(p => p.stock === 0).length,
    totalCustomers: users.filter(u => u.role === 'customer').length,
    totalAgents: users.filter(u => u.role === 'agent').length,
  };

  // Get sold items from paid orders with product details
  const soldItems = paidOrders.flatMap(order => 
    order.items.map(item => {
      // Find the actual product to get the correct image
      const product = products.find(p => p.name === item.name || p.id === item.productId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationSound.setEnabled(newState);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Business Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview of your store performance</p>
        </div>
        <button
          onClick={toggleSound}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            soundEnabled 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={soundEnabled ? 'Notifications sounds enabled' : 'Notification sounds disabled'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="text-sm font-medium">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>

      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-2">💰 Total Revenue (Paid Orders)</p>
            <p className="text-5xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</p>
            <p className="text-green-100 mt-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              From {stats.paidOrders} paid orders out of {stats.totalOrders} total
            </p>
          </div>
          <DollarSign className="w-24 h-24 text-green-200 opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">📦 Total Orders</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalOrders}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {stats.completedOrders} completed
                </p>
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {stats.pendingOrders} pending
                </p>
              </div>
            </div>
            <ShoppingCart className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">📦 Products</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalProducts}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {stats.inStockProducts} in stock
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.outOfStockProducts} out of stock
                </p>
              </div>
            </div>
            <Package className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="card bg-orange-50 border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-1">👥 Agents</p>
              <p className="text-3xl font-bold text-orange-900">{stats.totalAgents}</p>
              <p className="text-xs text-orange-600 mt-2">Selling your products</p>
            </div>
            <Users className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="card bg-pink-50 border-l-4 border-pink-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-1">🛍️ Customers</p>
              <p className="text-3xl font-bold text-pink-900">{stats.totalCustomers}</p>
              <p className="text-xs text-pink-600 mt-2">People who buy</p>
            </div>
            <Users className="w-10 h-10 text-pink-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Box className="w-6 h-6 text-primary-600" />
          📦 Inventory Status (Stock Levels)
        </h2>
        <p className="text-sm text-gray-600 mb-4">See how much stock you have</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-green-600">{stats.inStockProducts}</p>
            <p className="text-green-700 font-medium mt-2">✅ Good Stock</p>
            <p className="text-xs text-green-600 mt-1">More than 10 items</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-4xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
            <p className="text-yellow-700 font-medium mt-2">⚠️ Running Low</p>
            <p className="text-xs text-yellow-600 mt-1">1-10 items left</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600">{stats.outOfStockProducts}</p>
            <p className="text-red-700 font-medium mt-2">❌ Out of Stock</p>
            <p className="text-xs text-red-600 mt-1">Need to restock!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              Latest Orders
            </h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              See All →
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">#{order.id.substring(0, 8)}</p>
                    <p className="text-sm text-gray-600">{order.customerName || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">GH₵ {order.total.toFixed(2)}</p>
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
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No orders yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link to="/admin/products" className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">View Products</p>
                  <p className="text-sm text-blue-700">{stats.totalProducts} total products</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/orders" className="block p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900">View Orders</p>
                  <p className="text-sm text-green-700">{stats.pendingOrders} need attention</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/agents" className="block p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg transition border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-900">Manage Agents</p>
                  <p className="text-sm text-orange-700">{stats.totalAgents} agents</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sold Products Section */}
      {soldProducts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" />
                Products Sold & Paid
              </h2>
              <p className="text-sm text-gray-600 mt-1">Top selling products with verified payments</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Items Sold</p>
              <p className="text-2xl font-bold text-green-600">
                {soldProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {soldProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-primary-200">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity Sold: <span className="font-semibold text-primary-600">{product.totalQuantity} units</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Number of Sales: {product.sales}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        GH₵ {product.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-sm">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Total Sales Revenue (Paid Orders Only)</p>
                <p className="text-xs text-green-600 mt-1">Sum of all products sold and paid for</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-700">
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

      {/* Admin Controls Section */}
      <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
        <h2 className="text-xl font-bold mb-4 text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Admin Controls (Danger Zone)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-md"
          >
            <Trash2 className="w-5 h-5" />
            Delete All Orders
          </button>
          
          <button
            onClick={() => setShowLogsModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md"
          >
            <History className="w-5 h-5" />
            View Activity Logs ({agentLogs.length})
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete All Orders</h3>
                <p className="text-sm text-gray-600">This action cannot be undone!</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                ⚠️ You are about to delete <strong>{orders.length} orders</strong>. This will permanently remove all order data from the system.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter admin password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDeleteAllOrders()}
                className="input"
                placeholder="Enter password"
                autoFocus
              />
              {deleteError && (
                <p className="text-red-600 text-sm mt-2">❌ {deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllOrders}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Agent Activity Logs</h3>
                    <p className="text-sm text-gray-600">{agentLogs.length} total activities recorded</p>
                  </div>
                </div>
                <button
                  onClick={handleResetLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear Logs
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {agentLogs.length > 0 ? (
                <div className="space-y-3">
                  {agentLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              log.action === 'DELETE_ALL_ORDERS' ? 'bg-red-100 text-red-700' :
                              log.action === 'ADD_PRODUCT' ? 'bg-green-100 text-green-700' :
                              log.action === 'UPDATE_PRODUCT' ? 'bg-blue-100 text-blue-700' :
                              log.action === 'DELETE_PRODUCT' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {log.performedBy}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{log.details}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No activity logs yet</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowLogsModal(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
