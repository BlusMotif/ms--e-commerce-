const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

admin.initializeApp();

// Initialize services
const paystackSecretKey = functions.config().paystack?.secret_key;
const sendgridApiKey = functions.config().sendgrid?.api_key;
const twilioAccountSid = functions.config().twilio?.account_sid;
const twilioAuthToken = functions.config().twilio?.auth_token;
const twilioPhoneNumber = functions.config().twilio?.phone_number;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

let twilioClient;
if (twilioAccountSid && twilioAuthToken) {
  twilioClient = twilio(twilioAccountSid, twilioAuthToken);
}

// Paystack Webhook Verification
exports.verifyPaystackPayment = functions.https.onRequest(async (req, res) => {
  const hash = req.headers['x-paystack-signature'];
  
  if (!hash) {
    return res.status(400).send('No signature provided');
  }

  const body = JSON.stringify(req.body);
  const expectedHash = require('crypto')
    .createHmac('sha512', paystackSecretKey)
    .update(body)
    .digest('hex');

  if (hash !== expectedHash) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  // Handle successful payment
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    
    try {
      // Update order status in database
      await admin.database()
        .ref(`orders/${metadata.orderId}`)
        .update({
          paymentStatus: 'paid',
          paymentReference: reference,
          paidAt: Date.now()
        });

      // Trigger notifications
      await sendOrderNotification(metadata.orderId, 'payment_confirmed');
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  res.status(200).send('Webhook received');
});

// Send Email Notification
async function sendEmail(to, subject, html) {
  if (!sendgridApiKey) {
    console.log('SendGrid not configured');
    return;
  }

  try {
    await sgMail.send({
      to,
      from: 'msfoods.gh@gmail.com',
      subject,
      html
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Send SMS Notification
async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log('Twilio not configured');
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to
    });
    console.log('SMS sent successfully');
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Send Order Notifications
async function sendOrderNotification(orderId, type) {
  try {
    const orderSnapshot = await admin.database()
      .ref(`orders/${orderId}`)
      .once('value');
    
    const order = orderSnapshot.val();
    if (!order) return;

    const customerSnapshot = await admin.database()
      .ref(`users/${order.customerId}`)
      .once('value');
    
    const customer = customerSnapshot.val();
    if (!customer) return;

    let subject, message;

    switch (type) {
      case 'order_placed':
        subject = 'Order Placed Successfully';
        message = `Hi ${customer.fullName}, your order #${orderId.substring(0, 8)} has been placed successfully. Total: GH₵ ${order.total.toFixed(2)}`;
        break;
      case 'payment_confirmed':
        subject = 'Payment Confirmed';
        message = `Hi ${customer.fullName}, payment for order #${orderId.substring(0, 8)} has been confirmed.`;
        break;
      case 'order_confirmed':
        subject = 'Order Confirmed';
        message = `Hi ${customer.fullName}, your order #${orderId.substring(0, 8)} has been confirmed by our agent.`;
        break;
      case 'order_shipped':
        subject = order.deliveryMethod === 'delivery' ? 'Order Out for Delivery' : 'Order Ready for Pickup';
        message = `Hi ${customer.fullName}, your order #${orderId.substring(0, 8)} is ${order.deliveryMethod === 'delivery' ? 'out for delivery' : 'ready for pickup'}.`;
        break;
      case 'order_delivered':
        subject = 'Order Delivered';
        message = `Hi ${customer.fullName}, your order #${orderId.substring(0, 8)} has been ${order.deliveryMethod === 'delivery' ? 'delivered' : 'picked up'}. Thank you for shopping with MS Special!`;
        break;
    }

    // Send email
    if (customer.email) {
      await sendEmail(customer.email, subject, `<p>${message}</p>`);
    }

    // Send SMS
    if (customer.phone) {
      await sendSMS(customer.phone, message);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Trigger notifications on order status change
exports.onOrderStatusChange = functions.database
  .ref('orders/{orderId}/status')
  .onUpdate(async (change, context) => {
    const newStatus = change.after.val();
    const orderId = context.params.orderId;

    let notificationType;
    switch (newStatus) {
      case 'confirmed':
        notificationType = 'order_confirmed';
        break;
      case 'out-for-delivery':
      case 'ready-for-pickup':
        notificationType = 'order_shipped';
        break;
      case 'delivered':
      case 'picked-up':
        notificationType = 'order_delivered';
        break;
    }

    if (notificationType) {
      await sendOrderNotification(orderId, notificationType);
    }
  });

// Trigger notifications when new order is created
exports.onOrderCreated = functions.database
  .ref('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const orderId = context.params.orderId;
    await sendOrderNotification(orderId, 'order_placed');
  });
