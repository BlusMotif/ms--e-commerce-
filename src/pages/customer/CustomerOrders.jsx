import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';

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

const CustomerOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, delivered

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(database, 'orders');
    const customerOrdersQuery = query(
      ordersRef,
      orderByChild('customerId'),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(customerOrdersQuery, (snapshot) => {
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
  }, [user]);

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

  const getStatusText = (status) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
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
        <h1 className="text-3xl font-bold">My Orders</h1>
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
            All Orders ({orders.length})
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
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'delivered'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Delivered ({orders.filter(o => o.status === 'delivered' || o.status === 'picked-up').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Order #{order.id.substring(0, 8)}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
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
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    GH₵ {order.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.paymentStatus === 'paid' ? (
                      <span className="text-green-600">Paid</span>
                    ) : (
                      <span className="text-yellow-600">Payment Pending</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Order Items - Jumia Style */}
              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <OrderItem key={index} item={item} />
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Method</p>
                    <p className="font-medium capitalize">{order.deliveryMethod}</p>
                  </div>
                  {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
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

              {/* Order Notes */}
              {order.notes && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
