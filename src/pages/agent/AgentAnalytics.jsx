import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { TrendingUp, Package, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgentAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

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
      } else {
        setOrders([]);
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
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const getFilteredOrders = () => {
    const now = Date.now();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'year':
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startDate = 0;
    }

    return orders.filter((order) => order.createdAt >= startDate);
  };

  const calculateStats = () => {
    const filteredOrders = getFilteredOrders();
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(
      (order) => order.status === 'delivered' || order.status === 'picked-up'
    ).length;
    const pendingOrders = filteredOrders.filter((order) => order.status === 'pending').length;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
    };
  };

  const getSalesChartData = () => {
    const filteredOrders = getFilteredOrders();
    const dailySales = {};

    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailySales[date]) {
        dailySales[date] = 0;
      }
      dailySales[date] += order.total;
    });

    return Object.keys(dailySales)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({
        date,
        sales: dailySales[date],
      }));
  };

  const getTopProducts = () => {
    const productSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.name]) {
          productSales[item.name] = 0;
        }
        productSales[item.name] += item.quantity;
      });
    });

    return Object.keys(productSales)
      .map((name) => ({
        name,
        sales: productSales[name],
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  };

  const stats = calculateStats();
  const salesData = getSalesChartData();
  const topProducts = getTopProducts();

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
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        {/* Time Range Filters - Scrollable on Mobile */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                timeRange === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                timeRange === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                timeRange === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                GH₵ {stats.totalRevenue.toFixed(2)}
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
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed Orders</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Sales Over Time</h2>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `GH₵ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#ff1744" strokeWidth={2} name="Sales (GH₵)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-600 py-8">No sales data available for the selected period</p>
        )}
      </div>

      {/* Top Products */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#ff1744" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-600 py-8">No product sales data available</p>
        )}
      </div>

      {/* Product Inventory Overview */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4">Product Inventory</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">Stock</th>
                <th className="text-right py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 10).map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{product.name}</td>
                  <td className="text-right py-3 px-4">GH₵ {product.price.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">{product.stock}</td>
                  <td className="text-right py-3 px-4">
                    {product.stock > 10 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentAnalytics;
