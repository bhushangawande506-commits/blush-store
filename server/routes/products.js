const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Safely normalizes JSONB or string fields into JavaScript objects/arrays.
 * Prevents errors if value is already returned as a native JS array/object by the pg driver.
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
 * Guarantees numeric id and parsed JSONB arrays for compatibility with React frontend.
 */
function formatProduct(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    images: parseJsonField(row.images, []),
    sizes: parseJsonField(row.sizes, []),
    colors: parseJsonField(row.colors, []),
    is_featured: Boolean(row.is_featured === 1 || row.is_featured === true || row.is_featured === '1' || row.is_featured === 'true'),
    is_new_arrival: Boolean(row.is_new_arrival === 1 || row.is_new_arrival === true || row.is_new_arrival === '1' || row.is_new_arrival === 'true')
  };
}

// GET all products with filtering, search, and sorting
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, size, minPrice, maxPrice, featured, newArrival } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Category filter (case-insensitive)
    if (category && category !== 'All' && category !== 'all') {
      params.push(category);
      sql += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    // Search filter across name, description, and fabric
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term);
      const pIdx = params.length;
      sql += ` AND (LOWER(name) LIKE $${pIdx} OR LOWER(description) LIKE $${pIdx} OR LOWER(fabric) LIKE $${pIdx})`;
    }

    // Price range filters (guards against NaN / invalid parameters)
    if (minPrice !== undefined && minPrice !== '') {
      const numMin = Number(minPrice);
      if (!isNaN(numMin)) {
        params.push(numMin);
        sql += ` AND price >= $${params.length}`;
      }
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const numMax = Number(maxPrice);
      if (!isNaN(numMax)) {
        params.push(numMax);
        sql += ` AND price <= $${params.length}`;
      }
    }

    // Boolean / Flag filters (Parameterized boolean comparison; compatible with PostgreSQL boolean and smallint)
    if (featured === 'true' || featured === '1') {
      params.push(true);
      sql += ` AND (is_featured::text = '1' OR is_featured::text = 'true') = $${params.length}`;
    } else if (featured === 'false' || featured === '0') {
      params.push(false);
      sql += ` AND (is_featured::text = '1' OR is_featured::text = 'true') = $${params.length}`;
    }

    if (newArrival === 'true' || newArrival === '1') {
      params.push(true);
      sql += ` AND (is_new_arrival::text = '1' OR is_new_arrival::text = 'true') = $${params.length}`;
    } else if (newArrival === 'false' || newArrival === '0') {
      params.push(false);
      sql += ` AND (is_new_arrival::text = '1' OR is_new_arrival::text = 'true') = $${params.length}`;
    }

    // Sorting
    if (sort === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY is_new_arrival DESC, id DESC';
    } else {
      // Default featured sort
      sql += ' ORDER BY is_featured DESC, id ASC';
    }

    const result = await query(sql, params);
    const rows = result.rows || [];

    // Parse and format product fields
    const parsed = rows.map(formatProduct);

    // In-memory size filter (handles JSONB array of strings)
    let results = parsed;
    if (size && typeof size === 'string' && size.trim() !== '') {
      const targetSize = size.trim().toUpperCase();
      results = results.filter(p =>
        Array.isArray(p.sizes) && p.sizes.some(s => String(s).toUpperCase() === targetSize)
      );
    }

    res.json({
      success: true,
      count: results.length,
      products: results
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by slug or id
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      return res.status(404).json({ error: 'Product not found' });
    }

    const isNumeric = /^\d+$/.test(slug);
    const sql = isNumeric
      ? 'SELECT * FROM products WHERE id = $1'
      : 'SELECT * FROM products WHERE slug = $1';

    const param = isNumeric ? Number(slug) : slug;
    const result = await query(sql, [param]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = formatProduct(result.rows[0]);

    // Also fetch related products from same category
    const relatedResult = await query(
      'SELECT * FROM products WHERE category = $1 AND id != $2 LIMIT 4',
      [product.category, product.id]
    );

    const related = (relatedResult.rows || []).map(formatProduct);

    res.json({
      success: true,
      product,
      related
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
