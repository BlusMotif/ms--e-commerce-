import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set, get, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { MapPin, CreditCard, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendOrderPlacedNotification } from '../utils/notifications';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [paymentMethod, setPaymentMethod] = useState('paystack'); // 'paystack' or 'cash'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if Paystack is loaded
  useEffect(() => {
    console.log('Checkout page loaded. Checking Paystack availability...');
    console.log('PaystackPop available:', typeof window.PaystackPop !== 'undefined');
    console.log('Paystack key configured:', !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
    
    if (typeof window.PaystackPop === 'undefined') {
      console.warn('PaystackPop not loaded. Retrying in 2 seconds...');
      setTimeout(() => {
        console.log('Retry check - PaystackPop available:', typeof window.PaystackPop !== 'undefined');
      }, 2000);
    }
  }, []);

  const deliveryFee = deliveryMethod === 'delivery' ? 10 : 0;
  const total = getTotal() + deliveryFee;

  // Function to deduct stock from products
  const deductStock = async (orderItems) => {
    try {
      for (const item of orderItems) {
        const productRef = ref(database, `products/${item.productId}`);
        const productSnapshot = await get(productRef);
        
        if (productSnapshot.exists()) {
          const product = productSnapshot.val();
          const newStock = (product.stock || 0) - item.quantity;
          
          await update(productRef, {
            stock: Math.max(0, newStock), // Ensure stock doesn't go below 0
            updatedAt: Date.now()
          });
          
          console.log(`Stock updated for ${item.name}: ${product.stock} -> ${newStock}`);
        }
      }
    } catch (error) {
      console.error('Error deducting stock:', error);
      // Don't throw error - we don't want to fail the order if stock update fails
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate Paystack is loaded
      if (paymentMethod === 'paystack') {
        if (typeof window.PaystackPop === 'undefined') {
          console.error('PaystackPop is not defined. Script may not be loaded.');
          toast.error('Payment system is still loading. Please wait a moment and try again.');
          setLoading(false);
          return;
        }

        // Validate environment variable
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!paystackKey) {
          console.error('VITE_PAYSTACK_PUBLIC_KEY is not set');
          toast.error('Payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        console.log('Paystack Key (first 10 chars):', paystackKey.substring(0, 10));
      }

      // Create order
      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);

      const orderData = {
        userId: user.uid, // Add userId for notifications
        customerId: user.uid,
        customerName: user.displayName || user.email,
        customerEmail: user.email,
        customerPhone: user.phoneNumber || '',
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
        })),
        subtotal: getTotal(),
        deliveryFee,
        total,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : '',
        pickupLocation: deliveryMethod === 'pickup' ? pickupLocation : '',
        notes,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
        status: 'pending',
        createdAt: Date.now(),
      };

      await set(newOrderRef, orderData);

      // DON'T send notification yet - wait until payment succeeds

      if (paymentMethod === 'paystack') {
        // Initialize Paystack payment
        try {
          console.log('Initializing Paystack with:', {
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.substring(0, 10) + '...',
            email: user.email,
            amount: total * 100,
            currency: 'GHS',
            ref: newOrderRef.key
          });

          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: total * 100, // Paystack expects amount in pesewas
            currency: 'GHS',
            ref: newOrderRef.key,
            metadata: {
              orderId: newOrderRef.key,
              customerId: user.uid,
              customerName: user.displayName || user.email,
            },
            callback: function (response) {
              // Payment successful - handle async operations
              console.log('Payment successful:', response);
              
              // Update payment status, deduct stock, and send notification
              set(ref(database, `orders/${newOrderRef.key}/paymentStatus`), 'paid')
                .then(() => set(ref(database, `orders/${newOrderRef.key}/paymentReference`), response.reference))
                .then(() => deductStock(orderData.items))
                .then(() => sendOrderPlacedNotification(user.uid, newOrderRef.key, total, orderData.items))
                .then(() => {
                  clearCart();
                  toast.success('Order placed and payment successful!');
                  navigate(`/customer/orders`);
                })
                .catch((error) => {
                  console.error('Error updating payment status:', error);
                  toast.error('Payment successful but order update failed. Contact support with reference: ' + response.reference);
                });
            },
            onClose: function () {
              console.log('Payment window closed by user');
              toast.error('Payment window closed. Your order was saved but not paid.');
              setLoading(false);
            },
          });

          console.log('Paystack handler created, opening iframe...');
          handler.openIframe();
        } catch (error) {
          console.error('Paystack initialization error:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            paystackPopExists: typeof window.PaystackPop !== 'undefined',
            keyExists: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
          });
          toast.error('Failed to initialize payment: ' + (error.message || 'Unknown error') + '. Please try cash on delivery.');
          setLoading(false);
        }
      } else {
        // Cash on delivery - deduct stock and send notification immediately
        await deductStock(orderData.items);
        await sendOrderPlacedNotification(user.uid, newOrderRef.key, total, orderData.items);
        clearCart();
        toast.success('Order placed successfully! Pay on delivery.');
        navigate(`/customer/orders`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      // Only set loading to false if not using Paystack (Paystack handles its own loading state)
      if (paymentMethod !== 'paystack') {
        setLoading(false);
      }
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Delivery Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 border-2 rounded-lg transition ${
                    deliveryMethod === 'delivery'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-600'
                  }`}
                >
                  <Truck className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                  <p className="font-semibold">Home Delivery</p>
                  <p className="text-sm text-gray-600">GH₵ 10.00</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 border-2 rounded-lg transition ${
                    deliveryMethod === 'pickup'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-600'
                  }`}
                >
                  <Package className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                  <p className="font-semibold">Pickup</p>
                  <p className="text-sm text-gray-600">Free</p>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {deliveryMethod === 'delivery' && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Enter your full delivery address..."
                  required
                />
              </div>
            )}

            {/* Pickup Location */}
            {deliveryMethod === 'pickup' && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Pickup Location
                </h2>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select pickup location</option>
                  <option value="okaishei">Okaishei - Accra (Main Store)</option>
                  <option value="madina">Madina</option>
                  <option value="spintex">Spintex</option>
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  We'll notify you when your order is ready for pickup
                </p>
              </div>
            )}

            {/* Payment Method */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="paystack"
                    checked={paymentMethod === 'paystack'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold">Pay with Paystack</p>
                    <p className="text-sm text-gray-600">
                      Mobile Money, Card, Bank Transfer
                    </p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold">Cash on Delivery/Pickup</p>
                    <p className="text-sm text-gray-600">
                      Pay when you receive your order
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Additional Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                      {item.images && item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.selectedSize && (
                        <p className="text-xs text-gray-600">Size: {item.selectedSize}</p>
                      )}
                      <p className="text-sm">
                        <span className="text-gray-600">Qty: {item.quantity}</span>
                        <span className="ml-2 font-semibold">
                          GH₵ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>GH₵ {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>GH₵ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary-600">GH₵ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6"
              >
                {loading ? 'Processing...' : `Place Order (GH₵ ${total.toFixed(2)})`}
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  );
};

export default CheckoutPage;
