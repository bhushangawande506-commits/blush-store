const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');

// Retrieve and validate server-side ADMIN_KEY
function getAdminKey() {
  const key = process.env.ADMIN_KEY;
  if (!key || !key.trim()) {
    return null;
  }
  return key.trim();
}

/**
 * Constant-time comparison to prevent timing attacks against secret credentials
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// POST /verify: Authenticate admin credentials securely
router.post('/verify', (req, res) => {
  const adminKey = getAdminKey();
  if (!adminKey) {
    console.error('[Admin Security Error] ADMIN_KEY environment variable is not configured on the server.');
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  const { password } = req.body;
  if (!password || !safeCompare(String(password).trim(), adminKey)) {
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
  return res.json({ success: true, token: adminKey });
});

// Middleware enforcing strict authentication exclusively via x-admin-token header
function verifyAdmin(req, res, next) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    console.error('[Admin Security Error] ADMIN_KEY environment variable is not configured on the server.');
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  // Security Hardening: Token authentication through URL query parameters is strictly rejected.
  const token = req.headers['x-admin-token'];
  if (token && typeof token === 'string' && safeCompare(token.trim(), adminKey)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin credentials' });
}

router.use(verifyAdmin);

// GET /stats: Retrieve aggregate sales, inventory, and status breakdown statistics
router.get('/stats', async (req, res) => {
  try {
    // 1. Order stats (total revenue & order count for confirmed paid orders)
    // Note: 'paid' is a PostgreSQL string literal (single quotes).
    const orderStatsRes = await query(
      "SELECT COUNT(*)::int as total_orders, COALESCE(SUM(total_amount), 0)::int as total_revenue FROM orders WHERE payment_status = 'paid'"
    );

    // 2. Product stats (catalog count & aggregated inventory)
    const prodStatsRes = await query(
      'SELECT COUNT(*)::int as total_products, COALESCE(SUM(stock), 0)::int as total_stock FROM products'
    );

    // 3. Status breakdown across all order lifecycle states
    const statusCountsRes = await query(
      'SELECT order_status, COUNT(*)::int as count FROM orders GROUP BY order_status ORDER BY order_status ASC'
    );

    const orderStats = orderStatsRes.rows[0] || {};
    const prodStats = prodStatsRes.rows[0] || {};
    const statusCounts = statusCountsRes.rows || [];

    return res.json({
      success: true,
      stats: {
        total_orders: Number(orderStats.total_orders || 0),
        total_revenue: Number(orderStats.total_revenue || 0),
        total_products: Number(prodStats.total_products || 0),
        total_stock: Number(prodStats.total_stock || 0),
        status_breakdown: statusCounts.map(s => ({
          order_status: s.order_status,
          count: Number(s.count)
        }))
      }
    });
  } catch (err) {
    console.error('Failed to retrieve admin stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics' });
  }
});

// GET /orders: Retrieve all orders and their line items for admin ledger
router.get('/orders', async (req, res) => {
  try {
    const ordersRes = await query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = ordersRes.rows || [];

    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    // Attach line items for each order
    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const itemsRes = await query(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
      orderIds
    );
    const items = itemsRes.rows || [];

    const itemsByOrder = {};
    for (const it of items) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push({
        ...it,
        id: Number(it.id),
        product_id: it.product_id ? Number(it.product_id) : null,
        price: Number(it.price),
        quantity: Number(it.quantity)
      });
    }

    const fullOrders = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    return res.json({
      success: true,
      orders: fullOrders
    });
  } catch (err) {
    console.error('Failed to retrieve orders for admin:', err);
    return res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// PUT /orders/:id/status: Update order lifecycle status or payment status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid order ID is required' });
    }

    const validOrderStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (order_status && !validOrderStatuses.includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const updates = [];
    const params = [];

    if (order_status) {
      params.push(order_status);
      updates.push(`order_status = $${params.length}`);
    }
    if (payment_status) {
      params.push(payment_status);
      updates.push(`payment_status = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No status changes provided' });
    }

    params.push(id.trim());
    const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${params.length}`;

    const result = await query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      success: true,
      message: `Order ${id} updated`,
      changes: result.rowCount
    });
  } catch (err) {
    console.error('Failed to update order status:', err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PUT /products/:id: Update product stock, pricing, and showcase flags
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const { price, compare_at_price, stock, is_featured, is_new_arrival } = req.body;

    const updates = [];
    const params = [];

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Invalid price: must be a non-negative number' });
      }
      params.push(Math.round(numPrice));
      updates.push(`price = $${params.length}`);
    }

    if (compare_at_price !== undefined) {
      if (compare_at_price === null || compare_at_price === '') {
        params.push(null);
        updates.push(`compare_at_price = $${params.length}`);
      } else {
        const numCompare = Number(compare_at_price);
        if (isNaN(numCompare) || numCompare < 0) {
          return res.status(400).json({ error: 'Invalid compare_at_price: must be a non-negative number or null' });
        }
        params.push(Math.round(numCompare));
        updates.push(`compare_at_price = $${params.length}`);
      }
    }

    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return res.status(400).json({ error: 'Invalid stock: must be a non-negative integer' });
      }
      params.push(numStock);
      updates.push(`stock = $${params.length}`);
    }

    if (is_featured !== undefined) {
      const val = (is_featured === true || is_featured === 1 || is_featured === '1' || is_featured === 'true') ? 1 : 0;
      params.push(val);
      updates.push(`is_featured = $${params.length}`);
    }

    if (is_new_arrival !== undefined) {
      const val = (is_new_arrival === true || is_new_arrival === 1 || is_new_arrival === '1' || is_new_arrival === 'true') ? 1 : 0;
      params.push(val);
      updates.push(`is_new_arrival = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(numId);
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${params.length}`;

    const result = await query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      changes: result.rowCount
    });
  } catch (err) {
    console.error('Failed to update product:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

module.exports = router;
