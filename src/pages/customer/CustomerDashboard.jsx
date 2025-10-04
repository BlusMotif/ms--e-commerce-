import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch customer's orders
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const customerOrders = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((order) => order.customerId === user.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(customerOrders);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    processingOrders: orders.filter(o => o.status === 'processing').length,
    completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length,
    totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    paidOrders: orders.filter(o => 
      o.isPaid === true || 
      o.isPaid === 'true' || 
      o.paymentStatus === 'paid'
    ).length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'picked-up': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'picked-up': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">🛍️ My Orders Dashboard</h1>
        <p className="text-gray-600 mt-1">Track and manage all your orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalOrders}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pendingOrders}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900">{stats.completedOrders}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-purple-900">GH₵ {stats.totalSpent.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary-600" />
          My Orders
        </h2>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">Order #{order.id.substring(0, 8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                      {(order.isPaid === true || order.isPaid === 'true' || order.paymentStatus === 'paid') && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✓ Paid
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {order.items?.length || 0} items
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">GH₵ {order.total.toFixed(2)}</p>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="flex items-center justify-center bg-gray-100 p-2 rounded text-sm text-gray-600">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.deliveryOption && (
                  <div className="border-t mt-3 pt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Delivery:</span> {order.deliveryOption === 'delivery' ? '🚚 Home Delivery' : '🏪 Pick Up'}
                    </p>
                    {order.deliveryOption === 'delivery' && order.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Address:</span> {order.address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Start shopping to see your orders here!</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold">#{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.isPaid === true || selectedOrder.isPaid === 'true' || selectedOrder.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.isPaid === true || selectedOrder.isPaid === 'true' || selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Delivery Information</h3>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Method:</span> {selectedOrder.deliveryOption === 'delivery' ? 'Home Delivery' : 'Pick Up'}
                  </p>
                  {selectedOrder.deliveryOption === 'delivery' && selectedOrder.address && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Address:</span> {selectedOrder.address}
                    </p>
                  )}
                  {selectedOrder.phone && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Phone:</span> {selectedOrder.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 border-b pb-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">GH₵ {item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold">GH₵ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">GH₵ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowOrderModal(false)}
                className="mt-6 w-full btn-primary"
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

export default CustomerDashboard;
