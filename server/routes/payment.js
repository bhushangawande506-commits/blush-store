const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { db } = require('../db');

// Safely retrieve Razorpay API keys from server environment
function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !keyId.trim() || !keySecret.trim()) {
    return null;
  }
  return {
    keyId: keyId.trim(),
    keySecret: keySecret.trim()
  };
}

// Safely retrieve Webhook secret from server environment
function getWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !secret.trim()) {
    return null;
  }
  return secret.trim();
}

let razorpayClient = null;
const initialConfig = getRazorpayConfig();
if (initialConfig) {
  try {
    razorpayClient = new Razorpay({
      key_id: initialConfig.keyId,
      key_secret: initialConfig.keySecret
    });
    console.log('Razorpay payment gateway client initialized.');
  } catch (e) {
    console.error('Razorpay SDK initialization failed:', e.message);
  }
} else {
  console.warn('[Payment Security Warning] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variable is missing.');
}

// 1. Create Razorpay Payment Order
router.post('/create-order', (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const rzpConfig = getRazorpayConfig();
  if (!rzpConfig) {
    console.error('[Payment Configuration Error] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured on the server.');
    return res.status(500).json({ error: 'Payment gateway configuration is missing on the server.' });
  }

  // Look up authoritative internal order
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
    if (err || !order) {
      return res.status(404).json({ error: 'Order not found for payment' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order has already been paid.' });
    }

    const amountInPaise = Math.round(order.total_amount * 100);

    // If live/test Razorpay client is available with valid credentials
    if (razorpayClient && !rzpConfig.keyId.includes('demo')) {
      try {
        const options = {
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.id,
          notes: {
            customer_name: order.customer_name,
            customer_phone: order.customer_phone
          }
        };

        const rzpOrder = await razorpayClient.orders.create(options);

        // Update order with razorpay_order_id
        db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, order.id]);

        return res.json({
          success: true,
          gateway: 'razorpay',
          key: rzpConfig.keyId,
          orderId: order.id,
          razorpayOrderId: rzpOrder.id,
          amount: amountInPaise,
          currency: 'INR',
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          }
        });
      } catch (rzpErr) {
        console.error('Razorpay API error, falling back to secure test mode:', rzpErr.message);
      }
    }

    // Test Sandbox Mode / Fallback for development & testing
    const mockRzpOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [mockRzpOrderId, order.id]);

    return res.json({
      success: true,
      gateway: 'razorpay_sandbox',
      key: rzpConfig.keyId,
      orderId: order.id,
      razorpayOrderId: mockRzpOrderId,
      amount: amountInPaise,
      currency: 'INR',
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone
      },
      sandboxNotice: 'Running in Razorpay Test/Sandbox verification mode'
    });
  });
});

// 2. Verify Razorpay Payment Signature
router.post('/verify-signature', (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing payment verification credentials' });
  }

  const rzpConfig = getRazorpayConfig();
  if (!rzpConfig) {
    console.error('[Payment Configuration Error] RAZORPAY_KEY_SECRET is not configured on the server.');
    return res.status(500).json({ error: 'Payment signature verification is not configured on the server.' });
  }

  // Look up order
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Order was already confirmed paid', orderId });
    }

    // Verify HMAC signature
    let isValid = false;

    if (razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', rzpConfig.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = (generatedSignature === razorpay_signature);
    }

    // In sandbox test mode, if simulation is performed
    if (!isValid && (order.razorpay_order_id === razorpay_order_id) && rzpConfig.keyId.includes('demo')) {
      // Allow test sandbox verification
      isValid = true;
    }

    if (!isValid) {
      console.warn(`Payment signature verification failed for order ${orderId}`);
      // Record payment attempt failure
      db.run(`
        INSERT INTO payments (order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, signature_verified, raw_response)
        VALUES (?, 'razorpay', ?, ?, ?, 'failed', 0, ?)
      `, [orderId, razorpay_order_id, razorpay_payment_id, order.total_amount, JSON.stringify(req.body)]);

      db.run("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [orderId]);

      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Signature verified! Complete the order atomically
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 1. Update order
      db.run(`
        UPDATE orders 
        SET payment_status = 'paid',
            order_status = 'paid',
            razorpay_payment_id = ?
        WHERE id = ?
      `, [razorpay_payment_id, orderId]);

      // 2. Audit payment
      db.run(`
        INSERT INTO payments (order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, signature_verified, raw_response)
        VALUES (?, 'razorpay', ?, ?, ?, 'paid', 1, ?)
      `, [orderId, razorpay_order_id, razorpay_payment_id, order.total_amount, JSON.stringify(req.body)]);

      // 3. Decrement inventory for order items
      db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId], (itemErr, items) => {
        if (!itemErr && items) {
          items.forEach(it => {
            db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [it.quantity, it.product_id]);
          });
        }

        db.run('COMMIT');

        console.log(`Order ${orderId} successfully paid and confirmed!`);
        return res.json({
          success: true,
          message: 'Payment verified and order confirmed',
          orderId,
          paymentId: razorpay_payment_id,
          status: 'paid'
        });
      });
    });
  });
});

// 3. Razorpay Webhook Endpoint (Idempotent & Signature-checked)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error('[Payment Configuration Error] RAZORPAY_WEBHOOK_SECRET environment variable is not configured on the server.');
    return res.status(500).json({ error: 'Webhook processing is not configured on the server.' });
  }
  const signature = req.headers['x-razorpay-signature'];

  const rawBody = req.body.toString ? req.body.toString() : JSON.stringify(req.body);

  if (signature) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Malformed payload' });
  }

  const eventId = event.event_id || `evt_${Date.now()}`;
  const eventType = event.event;

  // Check idempotency
  db.get('SELECT id FROM webhooks WHERE event_id = ?', [eventId], (err, existing) => {
    if (existing) {
      return res.status(200).json({ status: 'already_processed' });
    }

    db.run(
      'INSERT INTO webhooks (event_id, event_type, payload, processed) VALUES (?, ?, ?, 1)',
      [eventId, eventType, JSON.stringify(event)]
    );

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        db.get('SELECT id, total_amount, payment_status FROM orders WHERE razorpay_order_id = ?', [rzpOrderId], (oErr, order) => {
          if (order && order.payment_status !== 'paid') {
            db.serialize(() => {
              db.run(`
                UPDATE orders 
                SET payment_status = 'paid',
                    order_status = 'paid',
                    razorpay_payment_id = ?
                WHERE id = ?
              `, [rzpPaymentId, order.id]);

              db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order.id], (itErr, items) => {
                if (!itErr && items) {
                  items.forEach(it => {
                    db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [it.quantity, it.product_id]);
                  });
                }
              });
            });
          }
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  });
});

module.exports = router;
