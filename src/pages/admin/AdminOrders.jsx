import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Filter, DollarSign, Calendar } from 'lucide-react';
import { sendOrderStatusNotification, sendPaymentConfirmationNotification } from '../../utils/notifications';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const orderRef = ref(database, `orders/${orderId}`);
      
      await update(orderRef, {
        status: newStatus,
        updatedAt: Date.now(),
      });
      
      // Send notification to customer
      if (order && order.userId) {
        await sendOrderStatusNotification(order.userId, orderId, order.status, newStatus);
      }
      
      toast.success('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const orderRef = ref(database, `orders/${orderId}`);
      
      await update(orderRef, {
        paymentStatus: 'paid',
        paidAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Send payment confirmation notification to customer
      if (order && order.userId) {
        await sendPaymentConfirmationNotification(order.userId, orderId, order.total);
      }
      
      toast.success('Payment marked as received!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        const orderRef = ref(database, `orders/${orderId}`);
        await remove(orderRef);
        toast.success('Order deleted successfully!');
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Failed to delete order');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'out-for-delivery':
      case 'ready-for-pickup':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'delivered':
      case 'picked-up':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'out-for-delivery':
      case 'ready-for-pickup':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'picked-up':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus, deliveryMethod) => {
    if (deliveryMethod === 'delivery') {
      switch (currentStatus) {
        case 'pending':
          return 'confirmed';
        case 'confirmed':
          return 'out-for-delivery';
        case 'out-for-delivery':
          return 'delivered';
        default:
          return null;
      }
    } else {
      switch (currentStatus) {
        case 'pending':
          return 'confirmed';
        case 'confirmed':
          return 'ready-for-pickup';
        case 'ready-for-pickup':
          return 'picked-up';
        default:
          return null;
      }
    }
  };

  const getNextStatusLabel = (currentStatus, deliveryMethod) => {
    const nextStatus = getNextStatus(currentStatus, deliveryMethod);
    if (!nextStatus) return null;
    return nextStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getDateFilteredOrders = (orders) => {
    const now = Date.now();
    switch (dateFilter) {
      case 'today': {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        return orders.filter(order => order.createdAt >= todayStart);
      }
      case 'week': {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        return orders.filter(order => order.createdAt >= weekAgo);
      }
      case 'month': {
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
        return orders.filter(order => order.createdAt >= monthAgo);
      }
      default:
        return orders;
    }
  };

  const filteredOrders = getDateFilteredOrders(orders).filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'completed') return matchesSearch && (order.status === 'delivered' || order.status === 'picked-up');
    return matchesSearch && order.status === filter;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    inTransit: orders.filter(o => o.status === 'out-for-delivery' || o.status === 'ready-for-pickup').length,
    completed: orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length,
    totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
  };

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
        <h1 className="text-3xl font-bold">All Orders</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">In Transit</p>
          <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Revenue</p>
          <p className="text-xl font-bold text-primary-600">GH₵ {stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-2" />
              Search Orders
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Order ID, customer name or phone..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-2" />
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="ready-for-pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg">Order #{order.id.substring(0, 8)}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span>{order.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                    </span>
                    {order.paymentStatus === 'paid' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Paid
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        COD
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer: {order.customerName || 'N/A'} | Phone: {order.customerPhone || 'N/A'}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    GH₵ {order.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full flex items-center justify-between py-2 text-primary-600 hover:text-primary-700 font-medium border-t"
              >
                <span>View Order Details</span>
                {expandedOrder === order.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="border-t pt-4 space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.selectedSize && (
                              <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mx-4">x{item.quantity}</p>
                          <p className="font-semibold">GH₵ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Method</p>
                        <p className="font-medium capitalize">{order.deliveryMethod}</p>
                      </div>
                      {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{order.deliveryAddress}</p>
                        </div>
                      )}
                      {order.deliveryMethod === 'pickup' && order.pickupLocation && (
                        <div>
                          <p className="text-sm text-gray-600">Pickup Location</p>
                          <p className="font-medium capitalize">{order.pickupLocation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-semibold mb-2">Order Summary</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>GH₵ {order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span>GH₵ {order.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total</span>
                        <span className="text-primary-600">GH₵ {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex flex-col gap-4 pt-4 border-t">
                    {/* Payment Status Section */}
                    {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-yellow-800 mb-1">Payment Pending (Cash on Delivery)</p>
                            <p className="text-sm text-yellow-700">
                              Mark as paid once GH₵ {order.total.toFixed(2)} is received from customer
                            </p>
                          </div>
                          <button
                            onClick={() => handleMarkAsPaid(order.id)}
                            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                          >
                            <DollarSign className="w-4 h-4" />
                            Mark as Paid
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {order.paymentStatus === 'paid' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800">Payment Received</p>
                            <p className="text-sm text-green-700">
                              GH₵ {order.total.toFixed(2)} received on {new Date(order.paidAt || order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Status Actions */}
                    {order.status !== 'delivered' && order.status !== 'picked-up' && order.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2">
                        {getNextStatus(order.status, order.deliveryMethod) && (
                          <button
                            onClick={() => handleStatusChange(order.id, getNextStatus(order.status, order.deliveryMethod))}
                            className="btn-primary"
                          >
                            Mark as {getNextStatusLabel(order.status, order.deliveryMethod)}
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            className="btn-outline text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Delete Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="text-sm text-gray-600 text-center py-4">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm || filter !== 'all' || dateFilter !== 'all' 
              ? 'No orders found matching your filters' 
              : 'No orders yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
