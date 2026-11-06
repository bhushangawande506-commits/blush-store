const express = require('express');
const router = express.Router();
const { query, transaction } = require('../db');
const { sendOrderConfirmationEmail } = require('../email');

/**
 * Safely extracts the primary image URL from a product database record.
 * Handles both pre-parsed JSONB arrays (pg driver) and stringified JSON.
 */
function getProductPrimaryImage(dbProd, fallbackImage) {
  if (fallbackImage && typeof fallbackImage === 'string' && fallbackImage.trim()) {
    return fallbackImage.trim();
  }
  const images = dbProd.images;
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {}
  }
  return '';
}

// POST /create: Create a new order with authoritative server-side validation & atomic transaction
router.post('/create', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      state,
      pincode,
      order_notes,
      items,
      payment_method = 'razorpay'
    } = req.body;

    // 1. Contact & Shipping Field Validation
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Please provide all required shipping and contact details.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // 2. Validate Item Structure, Product IDs, and Quantities (prevent invalid inputs)
    const productIds = [];
    for (const item of items) {
      const rawId = item.product_id || item.id;
      const numId = Number(rawId);
      if (!rawId || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
        return res.status(400).json({ error: `Invalid product ID: ${rawId}` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          error: `Invalid quantity for product ID ${rawId}: must be a positive integer.`
        });
      }
      productIds.push(numId);
    }

    // 3. Fetch Products Authoritatively from PostgreSQL using Parameterized Query
    const uniqueIds = Array.from(new Set(productIds));
    const placeholders = uniqueIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const dbProductsRes = await query(
      `SELECT id, name, price, stock, images FROM products WHERE id IN (${placeholders})`,
      uniqueIds
    );
    const dbProducts = dbProductsRes.rows || [];

    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(Number(p.id), p));

    // 4. Authoritative Pricing Calculation & Inventory Validation
    // Never trust frontend-submitted prices or totals!
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = Number(item.product_id || item.id);
      const dbProd = productMap.get(pid);

      if (!dbProd) {
        return res.status(400).json({ error: `Product with ID ${pid} is not found.` });
      }

      const qty = parseInt(item.quantity, 10);
      if (Number(dbProd.stock) < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock}, Requested: ${qty}`
        });
      }

      const itemPrice = Number(dbProd.price);
      serverSubtotal += itemPrice * qty;

      validatedItems.push({
        product_id: Number(dbProd.id),
        product_name: dbProd.name,
        size: item.size || 'Regular',
        color: item.color || '',
        price: itemPrice,
        quantity: qty,
        image: getProductPrimaryImage(dbProd, item.image)
      });
    }

    // 5. Authoritative Shipping Rules
    // Free shipping for orders >= ₹2,499, otherwise standard ₹150
    const shippingFee = serverSubtotal >= 2499 ? 0 : 150;
    const discount = 0;
    const totalAmount = serverSubtotal + shippingFee - discount;

    const orderId = `BLUSH-${Date.now().toString().slice(-6)}`;

    // 6. Atomic Transaction via Dedicated Client (orders + order_items)
    await transaction(async (client) => {
      // Insert master order record
      await client.query(`
        INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, shipping_address,
          city, state, pincode, order_notes, subtotal, shipping_fee, discount,
          total_amount, payment_method, payment_status, order_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', 'pending_payment'
        )
      `, [
        orderId,
        customer_name.trim(),
        customer_email.trim(),
        customer_phone.trim(),
        shipping_address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        (order_notes || '').trim(),
        serverSubtotal,
        shippingFee,
        discount,
        totalAmount,
        payment_method
      ]);

      // Insert line items
      for (const v of validatedItems) {
        await client.query(`
          INSERT INTO order_items (
            order_id, product_id, product_name, size, color, price, quantity, image
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          orderId,
          v.product_id,
          v.product_name,
          v.size,
          v.color,
          v.price,
          v.quantity,
          v.image
        ]);
      }
    });

    // 7. Non-blocking order confirmation email dispatch via Resend
    // Order is already committed authoritatively. Email failure must never block or cancel the order.
    sendOrderConfirmationEmail({
      orderId,
      customerEmail: customer_email.trim(),
      customerName: customer_name.trim(),
      items: validatedItems,
      subtotal: serverSubtotal,
      shippingFee,
      discount,
      totalAmount,
      shippingAddress: shipping_address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim()
    }).catch(err => {
      console.error(`[Email Warning] Background email error for order ${orderId}:`, err.message);
    });

    // 8. Successful Response Matching Exact API Contract
    return res.json({
      success: true,
      orderId,
      subtotal: serverSubtotal,
      shippingFee,
      discount,
      totalAmount,
      currency: 'INR',
      customer: {
        name: customer_name,
        email: customer_email,
        phone: customer_phone
      },
      items: validatedItems
    });
  } catch (err) {
    console.error('Failed to create order record:', err);
    return res.status(500).json({ error: 'Failed to record order' });
  }
});

// GET /:id: Retrieve single order details and its line items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [id.trim()]);
    if (!orderRes.rows || orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    const itemsRes = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
      [order.id]
    );

    const items = (itemsRes.rows || []).map(item => ({
      ...item,
      id: Number(item.id),
      product_id: item.product_id ? Number(item.product_id) : null,
      price: Number(item.price),
      quantity: Number(item.quantity)
    }));

    return res.json({
      success: true,
      order,
      items
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    return res.status(500).json({ error: 'Error fetching order' });
  }
});

module.exports = router;
