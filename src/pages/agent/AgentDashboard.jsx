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
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Box,
  ShoppingCart,
  Users
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        }));

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 My Business Dashboard</h1>
        <p className="text-gray-600 mt-1">Complete overview of your sales performance</p>
      </div>

      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-2">💰 My Total Earnings (Paid Orders)</p>
            <p className="text-5xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</p>
            <p className="text-green-100 mt-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              From {stats.paidOrders} paid sales out of {stats.totalOrders} total
            </p>
          </div>
          <DollarSign className="w-24 h-24 text-green-200 opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">📦 My Products</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalProducts}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {stats.inStockProducts} in stock
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.outOfStock} out of stock
                </p>
              </div>
            </div>
            <Package className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">🛍️ My Sales</p>
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

        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">✅ Good Stock</p>
              <p className="text-3xl font-bold text-green-900">{stats.inStockProducts}</p>
              <p className="text-xs text-green-600 mt-2">More than 10 items</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-1">⚠️ Low Stock</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.lowStock}</p>
              <p className="text-xs text-yellow-600 mt-2">Need to restock soon</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Box className="w-6 h-6 text-primary-600" />
          📦 My Inventory Status
        </h2>
        <p className="text-sm text-gray-600 mb-4">See how much stock you have in your products</p>
        
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
            <p className="text-4xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-yellow-700 font-medium mt-2">⚠️ Running Low</p>
            <p className="text-xs text-yellow-600 mt-1">1-10 items left</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-red-700 font-medium mt-2">❌ Out of Stock</p>
            <p className="text-xs text-red-600 mt-1">Need to restock now!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              My Recent Sales
            </h2>
            <Link to="/agent/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
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
              <p>No sales yet</p>
              <p className="text-sm mt-1">Add products to start selling!</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link to="/agent/products" className="block p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-purple-900">My Products</p>
                  <p className="text-sm text-purple-700">{stats.totalProducts} total products</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/orders" className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">My Sales</p>
                  <p className="text-sm text-blue-700">{stats.pendingOrders} need attention</p>
                </div>
              </div>
            </Link>

            <Link to="/agent/analytics" className="block p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Sales Report</p>
                  <p className="text-sm text-green-700">View detailed analytics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* My Sold Products Section */}
      {soldProducts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" />
                My Products Sold & Paid
              </h2>
              <p className="text-sm text-gray-600 mt-1">Your best selling products with verified payments</p>
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
                      <p className="text-sm text-gray-600">My Revenue</p>
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
                <p className="text-sm text-green-700 font-medium">My Total Sales Revenue (Paid Orders Only)</p>
                <p className="text-xs text-green-600 mt-1">Sum of all my products sold and paid for</p>
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
    </div>
  );
};

export default AgentDashboard;
