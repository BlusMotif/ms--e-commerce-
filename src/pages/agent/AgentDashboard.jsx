import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch agent's products
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

    // Fetch orders related to agent's products
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allOrders = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Filter orders that contain agent's products
        const agentOrders = allOrders.filter((order) =>
          order.items.some((item) => {
            const product = products.find((p) => p.name === item.name);
            return product && (product.agentId === user.uid || product.createdBy === user.uid);
          })
        );

        setOrders(agentOrders);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubscribeOrders();
    };
  }, [user, products]);

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.stock > 0).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    processingOrders: orders.filter((o) => o.status === 'processing').length,
    completedOrders: orders.filter((o) => o.status === 'delivered').length,
    totalRevenue: orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0),
    pendingRevenue: orders
      .filter((o) => ['pending', 'processing', 'shipped'].includes(o.status))
      .reduce((sum, order) => sum + (order.total || 0), 0),
  };

  // Prepare chart data - Last 7 days
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });

      const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      days.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: revenue,
      });
    }
    return days;
  };

  const chartData = getLast7DaysData();

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.fullName || user?.displayName || 'Agent'}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Products */}
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Products</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.activeProducts} in stock
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Orders */}
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              <p className="text-green-100 text-sm mt-2">
                {stats.pendingOrders} pending
              </p>
            </div>
            <ShoppingBag className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Revenue */}
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</p>
              <p className="text-purple-100 text-sm mt-2">
                {stats.completedOrders} completed
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Pending Revenue</p>
              <p className="text-3xl font-bold">GH₵ {stats.pendingRevenue.toFixed(2)}</p>
              <p className="text-orange-100 text-sm mt-2">
                {stats.processingOrders} processing
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Orders (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2} 
                name="Revenue (GH₵)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/agent/products" className="card hover:shadow-lg transition group">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Add Product</h3>
              <p className="text-sm text-gray-600">Create new product</p>
            </div>
          </div>
        </Link>

        <Link to="/agent/orders" className="card hover:shadow-lg transition group">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">View Orders</h3>
              <p className="text-sm text-gray-600">Manage your orders</p>
            </div>
          </div>
        </Link>

        <Link to="/agent/analytics" className="card hover:shadow-lg transition group">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-gray-600">View detailed stats</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders and Product Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link to="/agent/orders" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
              View All →
            </Link>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {order.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                    {order.status === 'processing' && <Truck className="w-5 h-5 text-blue-600" />}
                    {order.status === 'delivered' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {order.status === 'cancelled' && <XCircle className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">GH₵ {order.total?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No orders yet</p>
            </div>
          )}
        </div>

        {/* Product Alerts */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Product Alerts</h2>

          <div className="space-y-4">
            {/* Low Stock */}
            {stats.lowStock > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
                    <p className="text-sm text-yellow-800">
                      {stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''} running low on stock
                    </p>
                    <Link 
                      to="/agent/products" 
                      className="text-sm text-yellow-700 font-semibold hover:text-yellow-900 mt-1 inline-block"
                    >
                      View Products →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Out of Stock */}
            {stats.outOfStock > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Out of Stock</h3>
                    <p className="text-sm text-red-800">
                      {stats.outOfStock} product{stats.outOfStock !== 1 ? 's' : ''} out of stock
                    </p>
                    <Link 
                      to="/agent/products" 
                      className="text-sm text-red-700 font-semibold hover:text-red-900 mt-1 inline-block"
                    >
                      Restock Now →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Orders */}
            {stats.pendingOrders > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Pending Orders</h3>
                    <p className="text-sm text-blue-800">
                      {stats.pendingOrders} order{stats.pendingOrders !== 1 ? 's' : ''} awaiting processing
                    </p>
                    <Link 
                      to="/agent/orders" 
                      className="text-sm text-blue-700 font-semibold hover:text-blue-900 mt-1 inline-block"
                    >
                      Process Orders →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {stats.lowStock === 0 && stats.outOfStock === 0 && stats.pendingOrders === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>All systems running smoothly!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
