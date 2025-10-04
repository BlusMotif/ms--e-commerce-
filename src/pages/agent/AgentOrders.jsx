import React, { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Package, Clock, Truck, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { sendOrderStatusNotification, sendPaymentConfirmationNotification } from '../../utils/notifications';
import { logActivity } from '../../utils/activityLogger';
import { useAuthStore } from '../../store/authStore';

// Order Item Component with Product Image
const OrderItem = ({ item }) => {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = ref(database, `products/${item.productId}`);
        const snapshot = await get(productRef);
        if (snapshot.exists()) {
          setProduct(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    if (item.productId) {
      fetchProduct();
    }
  }, [item.productId]);

  return (
    <div className="flex gap-3 py-2 border-b hover:bg-gray-50 transition">
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded border border-gray-200 overflow-hidden">
        {product?.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-8 h-8" />
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{item.name}</p>
        {item.selectedSize && (
          <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
        )}
        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
      </div>
      
      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-orange-600">GH₵ {(item.price * item.quantity).toFixed(2)}</p>
        <p className="text-xs text-gray-500">GH₵ {item.price.toFixed(2)} each</p>
      </div>
    </div>
  );
};

const AgentOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

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
      
      // Log the activity
      await logActivity(
        user.uid,
        user.displayName || user.email || 'Agent',
        'update',
        'order',
        `Changed order #${orderId.substring(0, 8)} status to ${newStatus}`
      );
      
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
        isPaid: true,
        paymentStatus: 'paid',
        paidAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Log the activity
      await logActivity(
        user.uid,
        user.displayName || user.email || 'Agent',
        'update',
        'payment',
        `Confirmed payment for order #${orderId.substring(0, 8)} - GH₵${order.total.toFixed(2)}`
      );
      
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
      // pickup
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

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return order.status === 'delivered' || order.status === 'picked-up';
    return order.status === filter;
  });

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
        <h1 className="text-3xl font-bold">Manage Orders</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-primary-600">{orders.length}</p>
        </div>
      </div>

      {/* Filter Tabs - Scrollable on Mobile */}
      <div className="overflow-x-auto mb-6">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'confirmed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed ({orders.filter(o => o.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Order #{order.id.substring(0, 8)}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span>{order.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                    </span>
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
                    {order.paymentStatus === 'paid' ? (
                      <span className="text-green-600 font-semibold">Paid</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">COD</span>
                    )}
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
                  {/* Order Items - Jumia Style with Images */}
                  <div>
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <OrderItem key={index} item={item} />
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

                  {/* Status Actions */}
                  <div className="flex flex-col gap-4 pt-4 border-t">
                    {/* Payment Status Button */}
                    {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-yellow-800 mb-1">Payment Pending (Cash on Delivery)</p>
                            <p className="text-sm text-yellow-700">
                              Mark as paid once you receive GH₵ {order.total.toFixed(2)} from the customer
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
                      <div className="flex gap-2">
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
                            className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentOrders;
