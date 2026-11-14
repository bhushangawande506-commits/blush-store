const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');

/**
 * Safely parses JSONB or string fields into JavaScript objects/arrays.
 */
function parseJsonField(val, fallback = []) {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
    return val;
  }
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Formats a database product record into the standard Blush API product shape.
 */
function formatProduct(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price),
    compare_at_price: row.compare_at_price !== null && row.compare_at_price !== undefined ? Number(row.compare_at_price) : null,
    stock: Number(row.stock),
    images: parseJsonField(row.images, []),
    sizes: parseJsonField(row.sizes, []),
    colors: parseJsonField(row.colors, []),
    is_featured: Boolean(row.is_featured === 1 || row.is_featured === true || row.is_featured === '1' || row.is_featured === 'true'),
    is_new_arrival: Boolean(row.is_new_arrival === 1 || row.is_new_arrival === true || row.is_new_arrival === '1' || row.is_new_arrival === 'true')
  };
}

/**
 * Converts input value into a valid stringified JSON array for PostgreSQL JSONB columns.
 */
function toJsonbString(val, fallback = '[]') {
  if (val === undefined || val === null) return fallback;
  if (Array.isArray(val)) {
    return JSON.stringify(val.map(s => String(s).trim()).filter(Boolean));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map(s => String(s).trim()).filter(Boolean));
      }
      return JSON.stringify([String(parsed).trim()]);
    } catch {
      const items = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      return JSON.stringify(items);
    }
  }
  return fallback;
}

/**
 * Generates a clean URL slug from a product title.
 */
function generateSlug(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Retrieve and validate server-side ADMIN_KEY
function getAdminKey() {
  let key = process.env.ADMIN_KEY;
  if (!key || !key.trim()) {
    // Attempt fallback resolution from root .env and server/.env
    try {
      const dotenv = require('dotenv');
      const path = require('path');
      dotenv.config({ path: path.resolve(__dirname, '../../.env') });
      dotenv.config({ path: path.resolve(__dirname, '../.env') });
      dotenv.config({ path: path.resolve(__dirname, '.env') });
      dotenv.config();
      key = process.env.ADMIN_KEY;
    } catch {
      // Fallback silently
    }
  }
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

// GET /config: Check whether the admin authentication service is properly configured on the server
router.get('/config', (req, res) => {
  const adminKey = getAdminKey();
  return res.json({
    success: true,
    configured: Boolean(adminKey),
    service: 'Blush Boutique Admin Authentication'
  });
});

// POST /verify: Authenticate admin credentials or verify existing session token
router.post('/verify', (req, res) => {
  const adminKey = getAdminKey();
  if (!adminKey) {
    console.error('[Admin Security Error] ADMIN_KEY environment variable is not configured on the server.');
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  const { password, token } = req.body || {};
  const tokenHeader = req.headers['x-admin-token'];
  const candidate = token || password || tokenHeader;

  console.log(`[BACKEND DIAGNOSTIC] POST /api/admin/verify received - hasPassword: ${Boolean(password)}, hasToken: ${Boolean(token)}, hasHeader: ${Boolean(tokenHeader)}`);

  if (!candidate || !safeCompare(String(candidate).trim(), adminKey)) {
    console.log('[BACKEND DIAGNOSTIC] POST /api/admin/verify: Authentication FAILED (401)');
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
  console.log('[BACKEND DIAGNOSTIC] POST /api/admin/verify: Authentication SUCCESS (200), token issued');
  return res.json({ success: true, token: adminKey });
});

// GET /verify: Fast token session check via x-admin-token header
router.get('/verify', (req, res) => {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return res.status(500).json({ success: false, error: 'Authentication service is not configured on the server.' });
  }

  const token = req.headers['x-admin-token'];
  if (token && typeof token === 'string' && safeCompare(token.trim(), adminKey)) {
    console.log('[BACKEND DIAGNOSTIC] GET /api/admin/verify: Valid token session (200)');
    return res.json({ success: true, token: adminKey });
  }
  console.log('[BACKEND DIAGNOSTIC] GET /api/admin/verify: Unauthorized token (401)');
  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin credentials' });
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
    console.log(`[BACKEND DIAGNOSTIC] verifyAdmin authorized: ${req.method} ${req.baseUrl}${req.path}`);
    return next();
  }
  console.warn(`[BACKEND DIAGNOSTIC] verifyAdmin rejected (401): ${req.method} ${req.baseUrl}${req.path}`);
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

// POST /products: Create a new garment in the catalog
router.post('/products', async (req, res) => {
  try {
    const {
      name,
      slug: customSlug,
      category,
      price,
      compare_at_price,
      description = '',
      fabric = '',
      care = '',
      images = [],
      sizes = [],
      colors = [],
      is_featured = 0,
      is_new_arrival = 0,
      stock = 10
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Product category is required' });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Valid price (non-negative number) is required' });
    }

    let numCompare = null;
    if (compare_at_price !== undefined && compare_at_price !== null && compare_at_price !== '') {
      numCompare = Number(compare_at_price);
      if (isNaN(numCompare) || numCompare < 0) {
        return res.status(400).json({ error: 'compare_at_price must be a non-negative number' });
      }
      numCompare = Math.round(numCompare);
    }

    const numStock = parseInt(stock !== undefined ? stock : 10, 10);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ error: 'stock must be a non-negative integer' });
    }

    // Slug generation and uniqueness check
    let slug = (customSlug && typeof customSlug === 'string' && customSlug.trim())
      ? generateSlug(customSlug)
      : generateSlug(name);
    if (!slug) {
      slug = `product-${Date.now()}`;
    }

    // Check slug collision
    const slugCheck = await query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (slugCheck.rowCount > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const imagesJson = toJsonbString(images, '[]');
    const sizesJson = toJsonbString(sizes, '["XS", "S", "M", "L"]');
    const colorsJson = toJsonbString(colors, '[]');
    const featVal = (is_featured === true || is_featured === 1 || is_featured === '1' || is_featured === 'true') ? 1 : 0;
    const newArrVal = (is_new_arrival === true || is_new_arrival === 1 || is_new_arrival === '1' || is_new_arrival === 'true') ? 1 : 0;

    const insertSql = `
      INSERT INTO products (
        name, slug, category, price, compare_at_price,
        description, fabric, care, images, sizes, colors,
        is_featured, is_new_arrival, stock
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14)
      RETURNING *
    `;
    const params = [
      name.trim(),
      slug,
      category.trim(),
      Math.round(numPrice),
      numCompare,
      String(description || '').trim(),
      String(fabric || '').trim(),
      String(care || '').trim(),
      imagesJson,
      sizesJson,
      colorsJson,
      featVal,
      newArrVal,
      numStock
    ];

    const result = await query(insertSql, params);
    const createdProduct = formatProduct(result.rows[0]);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: createdProduct
    });
  } catch (err) {
    console.error('Failed to create product:', err);
    return res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
});

// PUT /products/:id: Update full product details, stock, pricing, and showcase flags
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const {
      name,
      slug,
      category,
      price,
      compare_at_price,
      description,
      fabric,
      care,
      images,
      sizes,
      colors,
      stock,
      is_featured,
      is_new_arrival
    } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Product name cannot be empty' });
      }
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }

    if (slug !== undefined) {
      const sanitizedSlug = generateSlug(slug);
      if (!sanitizedSlug) {
        return res.status(400).json({ error: 'Invalid slug' });
      }
      params.push(sanitizedSlug);
      const slugIdx = params.length;
      params.push(numId);
      const idIdx = params.length;
      const slugCheck = await query(`SELECT id FROM products WHERE slug = $${slugIdx} AND id != $${idIdx}`, [sanitizedSlug, numId]);
      if (slugCheck.rowCount > 0) {
        return res.status(400).json({ error: 'Slug is already used by another product' });
      }
      updates.push(`slug = $${slugIdx}`);
    }

    if (category !== undefined) {
      if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Category cannot be empty' });
      }
      params.push(category.trim());
      updates.push(`category = $${params.length}`);
    }

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

    if (description !== undefined) {
      params.push(String(description || '').trim());
      updates.push(`description = $${params.length}`);
    }

    if (fabric !== undefined) {
      params.push(String(fabric || '').trim());
      updates.push(`fabric = $${params.length}`);
    }

    if (care !== undefined) {
      params.push(String(care || '').trim());
      updates.push(`care = $${params.length}`);
    }

    if (images !== undefined) {
      params.push(toJsonbString(images, '[]'));
      updates.push(`images = $${params.length}::jsonb`);
    }

    if (sizes !== undefined) {
      params.push(toJsonbString(sizes, '[]'));
      updates.push(`sizes = $${params.length}::jsonb`);
    }

    if (colors !== undefined) {
      params.push(toJsonbString(colors, '[]'));
      updates.push(`colors = $${params.length}::jsonb`);
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

    updates.push(`updated_at = timezone('utc'::text, now())`);

    params.push(numId);
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;

    const result = await query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: formatProduct(result.rows[0]),
      changes: result.rowCount
    });
  } catch (err) {
    console.error('Failed to update product:', err);
    return res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
});

// DELETE /products/:id: Safely delete product from catalog
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Verify product exists
    const checkRes = await query('SELECT id, name FROM products WHERE id = $1', [numId]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = checkRes.rows[0];

    // Deleting product automatically sets order_items.product_id to NULL due to ON DELETE SET NULL FK constraint
    await query('DELETE FROM products WHERE id = $1', [numId]);

    return res.json({
      success: true,
      message: `Product "${product.name}" (#${numId}) deleted successfully`,
      id: numId
    });
  } catch (err) {
    console.error('Failed to delete product:', err);
    return res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
});

// GET /settings: Retrieve boutique store configuration
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT key, value, description, is_public, updated_at FROM store_settings ORDER BY key ASC');
    const settingsMap = {};
    for (const row of result.rows || []) {
      settingsMap[row.key] = row.value;
    }
    return res.json({
      success: true,
      settings: settingsMap,
      raw: result.rows || []
    });
  } catch (err) {
    console.error('Failed to retrieve store settings:', err);
    return res.status(500).json({ error: 'Failed to retrieve store settings' });
  }
});

// PUT /settings: Update boutique store configuration
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload: expected object' });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (!key || typeof key !== 'string') continue;
      const strVal = String(value !== null && value !== undefined ? value : '');
      await query(`
        INSERT INTO store_settings (key, value, updated_at)
        VALUES ($1, $2, timezone('utc'::text, now()))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
      `, [key.trim(), strVal]);
    }

    return res.json({
      success: true,
      message: 'Store settings updated successfully'
    });
  } catch (err) {
    console.error('Failed to update store settings:', err);
    return res.status(500).json({ error: 'Failed to update store settings: ' + err.message });
  }
});

module.exports = router;
