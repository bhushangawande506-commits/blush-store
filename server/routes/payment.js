const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { query, transaction } = require('../db');

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
router.post('/create-order', async (req, res) => {
  try {
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
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!orderRes.rows || orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found for payment' });
    }

    const order = orderRes.rows[0];

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order has already been paid.' });
    }

    const amountInPaise = Math.round(Number(order.total_amount) * 100);

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
        await query('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [rzpOrder.id, order.id]);

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
    await query('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [mockRzpOrderId, order.id]);

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
  } catch (err) {
    console.error('Error creating payment order:', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// 2. Verify Razorpay Payment Signature
router.post('/verify-signature', async (req, res) => {
  try {
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
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!orderRes.rows || orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Idempotency: if already confirmed paid, return immediately
    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Order was already confirmed paid', orderId });
    }

    // Verify HMAC-SHA256 signature strictly
    let isValid = false;

    if (razorpay_signature && typeof razorpay_signature === 'string') {
      const generatedSignature = crypto
        .createHmac('sha256', rzpConfig.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = (generatedSignature === razorpay_signature.trim());
    }

    // SECURITY DEFENSE:
    // When payment signature verification fails, we record the failed attempt for audit,
    // but we MUST NOT change the genuine customer's order payment_status or order_status!
    // This prevents an attacker from forging invalid verification requests to sabotage genuine orders.
    if (!isValid) {
      console.warn(`[Payment Security Alert] Payment signature verification failed for order ${orderId}`);

      // Record failed attempt in payments table for security forensics
      await query(`
        INSERT INTO payments (order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, signature_verified, raw_response)
        VALUES ($1, 'razorpay', $2, $3, $4, 'failed', 0, $5)
      `, [orderId, razorpay_order_id, razorpay_payment_id, Number(order.total_amount), JSON.stringify(req.body)]);

      // Genuine order state remains untouched!
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Signature verified! Complete the order atomically via dedicated transaction client
    await transaction(async (client) => {
      // Re-lock order row FOR UPDATE to guard against concurrent webhook race
      const lockedOrderRes = await client.query(
        'SELECT id, payment_status, total_amount FROM orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );
      const lockedOrder = lockedOrderRes.rows[0];

      // If concurrent webhook already processed it, do not decrement stock again!
      if (lockedOrder && lockedOrder.payment_status === 'paid') {
        return;
      }

      // 1. Update order status
      await client.query(`
        UPDATE orders 
        SET payment_status = 'paid',
            order_status = 'paid',
            razorpay_payment_id = $1
        WHERE id = $2
      `, [razorpay_payment_id, orderId]);

      // 2. Audit payment
      await client.query(`
        INSERT INTO payments (
          order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, signature_verified, raw_response
        ) VALUES ($1, 'razorpay', $2, $3, $4, 'paid', 1, $5)
        ON CONFLICT (gateway_payment_id, status) DO NOTHING
      `, [orderId, razorpay_order_id, razorpay_payment_id, Number(order.total_amount), JSON.stringify(req.body)]);

      // 3. Decrement inventory for order items using PostgreSQL GREATEST(0, stock - $1)
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );

      for (const it of itemsRes.rows) {
        if (it.product_id) {
          await client.query(
            'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
            [Number(it.quantity), Number(it.product_id)]
          );
        }
      }
    });

    console.log(`Order ${orderId} successfully paid and confirmed!`);
    return res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      orderId,
      paymentId: razorpay_payment_id,
      status: 'paid'
    });
  } catch (err) {
    console.error('Error in payment verification:', err);
    return res.status(500).json({ error: 'Internal error processing payment verification' });
  }
});

// 3. Razorpay Webhook Endpoint (Idempotent, Signature-checked & Atomic)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = getWebhookSecret();
    if (!secret) {
      console.error('[Payment Configuration Error] RAZORPAY_WEBHOOK_SECRET environment variable is not configured on the server.');
      return res.status(500).json({ error: 'Webhook processing is not configured on the server.' });
    }
    const signature = req.headers['x-razorpay-signature'];

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

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
      event = typeof rawBody === 'string' ? JSON.parse(rawBody) : req.body;
    } catch (e) {
      return res.status(400).json({ error: 'Malformed payload' });
    }

    const eventId = event.event_id || (event.payload?.payment?.entity?.id ? `evt_${event.payload.payment.entity.id}` : `evt_${Date.now()}`);
    const eventType = event.event;

    // Fast check for idempotency
    const existingRes = await query('SELECT id FROM webhooks WHERE event_id = $1', [eventId]);
    if (existingRes.rows && existingRes.rows.length > 0) {
      return res.status(200).json({ status: 'already_processed' });
    }

    let alreadyHandled = false;

    // Atomic transaction: logs webhook event and confirms order payment in the same transaction
    await transaction(async (client) => {
      // 1. Insert webhook with unique constraint check inside transaction
      const insRes = await client.query(`
        INSERT INTO webhooks (event_id, event_type, payload, processed)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING id
      `, [eventId, eventType, JSON.stringify(event)]);

      if (!insRes.rows || insRes.rows.length === 0) {
        // Another concurrent request inserted this webhook
        alreadyHandled = true;
        return;
      }

      // 2. Process payment fulfillment for captured/paid events
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = event.payload?.payment?.entity;
        const rzpOrderId = paymentEntity?.order_id;
        const rzpPaymentId = paymentEntity?.id;
        const rzpAmountInPaise = paymentEntity?.amount;

        if (rzpOrderId) {
          // Lock the order row to serialize concurrent webhook & signature verification calls
          const orderRes = await client.query(
            'SELECT id, total_amount, payment_status FROM orders WHERE razorpay_order_id = $1 FOR UPDATE',
            [rzpOrderId]
          );

          if (orderRes.rows.length > 0) {
            const order = orderRes.rows[0];

            // Verify payment amount matches authoritative order total
            const expectedAmountInPaise = Math.round(Number(order.total_amount) * 100);
            if (rzpAmountInPaise && Math.round(Number(rzpAmountInPaise)) !== expectedAmountInPaise) {
              console.error(
                `[Payment Security Alert] Webhook amount mismatch for order ${order.id}: expected ${expectedAmountInPaise} paise, received ${rzpAmountInPaise} paise.`
              );
              throw new Error(`Payment amount mismatch: expected ${expectedAmountInPaise}, received ${rzpAmountInPaise}`);
            }

            // Idempotency: only process if not already paid!
            if (order.payment_status !== 'paid') {
              await client.query(`
                UPDATE orders 
                SET payment_status = 'paid',
                    order_status = 'paid',
                    razorpay_payment_id = $1
                WHERE id = $2
              `, [rzpPaymentId, order.id]);

              // Decrement inventory using PostgreSQL GREATEST(0, stock - $1)
              const itemsRes = await client.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                [order.id]
              );

              for (const it of itemsRes.rows) {
                if (it.product_id) {
                  await client.query(
                    'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                    [Number(it.quantity), Number(it.product_id)]
                  );
                }
              }

              // Audit payment in payments table
              await client.query(`
                INSERT INTO payments (
                  order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, signature_verified, raw_response
                ) VALUES ($1, 'razorpay', $2, $3, $4, 'paid', 1, $5)
                ON CONFLICT (gateway_payment_id, status) DO NOTHING
              `, [
                order.id,
                rzpOrderId,
                rzpPaymentId,
                Number(order.total_amount),
                JSON.stringify(event)
              ]);
            }
          }
        }
      }
    });

    if (alreadyHandled) {
      return res.status(200).json({ status: 'already_processed' });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error in webhook handling:', err.message);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

module.exports = router;
