const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Retrieve and validate server-side ADMIN_KEY
function getAdminKey() {
  const key = process.env.ADMIN_KEY;
  if (!key || !key.trim()) {
    return null;
  }
  return key.trim();
}

// Endpoint to verify credentials securely on server side
router.post('/verify', (req, res) => {
  const adminKey = getAdminKey();
  if (!adminKey) {
    console.error('[Admin Security Error] ADMIN_KEY environment variable is not configured on the server.');
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  const { password } = req.body;
  if (!password || password.trim() !== adminKey) {
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
  return res.json({ success: true, token: adminKey });
});

// Middleware enforcing strict authentication for all management operations
function verifyAdmin(req, res, next) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    console.error('[Admin Security Error] ADMIN_KEY environment variable is not configured on the server.');
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (token && token === adminKey) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin credentials' });
}

router.use(verifyAdmin);

// GET Admin Stats
router.get('/stats', (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE payment_status = "paid"', (err, orderStats) => {
      db.get('SELECT COUNT(*) as total_products, COALESCE(SUM(stock), 0) as total_stock FROM products', (pErr, prodStats) => {
        db.all('SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status', (sErr, statusCounts) => {
          res.json({
            success: true,
            stats: {
              total_orders: orderStats?.total_orders || 0,
              total_revenue: orderStats?.total_revenue || 0,
              total_products: prodStats?.total_products || 0,
              total_stock: prodStats?.total_stock || 0,
              status_breakdown: statusCounts || []
            }
          });
        });
      });
    });
  });
});

// GET all orders for admin
router.get('/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve orders' });
    }

    // Attach items for each order
    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const placeholders = orderIds.map(() => '?').join(',');
    db.all(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds, (itemErr, items) => {
      const itemsByOrder = {};
      (items || []).forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      });

      const fullOrders = orders.map(o => ({
        ...o,
        items: itemsByOrder[o.id] || []
      }));

      res.json({
        success: true,
        orders: fullOrders
      });
    });
  });
});

// PUT update order status
router.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status } = req.body;

  const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (order_status && !validStatuses.includes(order_status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  let query = 'UPDATE orders SET ';
  const updates = [];
  const params = [];

  if (order_status) {
    updates.push('order_status = ?');
    params.push(order_status);
  }
  if (payment_status) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No status changes provided' });
  }

  query += updates.join(', ') + ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }
    res.json({ success: true, message: `Order ${id} updated`, changes: this.changes });
  });
});

// PUT update product stock or price
router.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { price, compare_at_price, stock, is_featured, is_new_arrival } = req.body;

  const updates = [];
  const params = [];

  if (price !== undefined) {
    updates.push('price = ?');
    params.push(Number(price));
  }
  if (compare_at_price !== undefined) {
    updates.push('compare_at_price = ?');
    params.push(Number(compare_at_price));
  }
  if (stock !== undefined) {
    updates.push('stock = ?');
    params.push(Number(stock));
  }
  if (is_featured !== undefined) {
    updates.push('is_featured = ?');
    params.push(is_featured ? 1 : 0);
  }
  if (is_new_arrival !== undefined) {
    updates.push('is_new_arrival = ?');
    params.push(is_new_arrival ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
  params.push(id);

  db.run(query, params, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update product' });
    }
    res.json({ success: true, message: 'Product updated successfully' });
  });
});

module.exports = router;
