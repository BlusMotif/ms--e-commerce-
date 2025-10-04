import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch orders
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setOrders(ordersArray);
      }
    });

    // Fetch products
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

    // Fetch users
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

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, []);

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStockProducts: products.filter(p => p.stock === 0).length,
    totalCustomers: users.filter(u => u.role === 'customer').length,
    totalAgents: users.filter(u => u.role === 'agent').length,
  };

  const getSalesData = () => {
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dayEnd = new Date(date).setHours(23, 59, 59, 999);
      
      const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd);
      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      
      last7Days.push({
        date: dateStr,
        sales: daySales,
        orders: dayOrders.length,
      });
    }
    
    return last7Days;
  };

  const getTopProducts = () => {
    const productSales = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = 0;
        }
        productSales[item.name] += item.quantity;
      });
    });
    
    return Object.keys(productSales)
      .map(name => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        sales: productSales[name],
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                GH₵ {stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                From {stats.totalOrders} orders
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
              <p className="text-xs text-yellow-600 mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {stats.pendingOrders} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-red-600 mt-1">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {stats.outOfStockProducts} out of stock
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Users</p>
              <p className="text-2xl font-bold">{stats.totalCustomers + stats.totalAgents}</p>
              <p className="text-xs text-gray-600 mt-1">
                <Users className="w-3 h-3 inline mr-1" />
                {stats.totalAgents} agents, {stats.totalCustomers} customers
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Sales Overview (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getSalesData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `GH₵ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#ff1744" strokeWidth={2} name="Sales (GH₵)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
          {getTopProducts().length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getTopProducts()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#ff1744" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-600 py-12">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      {order.customerName || 'N/A'} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">GH₵ {order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
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
            <p className="text-center text-gray-600 py-8">No orders yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/products" className="block p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-primary-900">Manage Products</p>
                  <p className="text-sm text-primary-700">{stats.totalProducts} products</p>
                </div>
              </div>
            </Link>
            <Link to="/admin/orders" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">View Orders</p>
                  <p className="text-sm text-blue-700">{stats.pendingOrders} pending orders</p>
                </div>
              </div>
            </Link>
            <Link to="/admin/agents" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Manage Agents</p>
                  <p className="text-sm text-green-700">{stats.totalAgents} agents</p>
                </div>
              </div>
            </Link>
            <Link to="/admin/categories" className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Categories</p>
                  <p className="text-sm text-purple-700">Manage product categories</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
