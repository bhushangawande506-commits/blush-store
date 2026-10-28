const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all products with filtering and sorting
router.get('/', (req, res) => {
  const { category, search, sort, size, minPrice, maxPrice, featured, newArrival } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All' && category !== 'all') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  if (search) {
    query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(fabric) LIKE ?)';
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term, term);
  }

  if (minPrice) {
    query += ' AND price >= ?';
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(Number(maxPrice));
  }

  if (featured === 'true' || featured === '1') {
    query += ' AND is_featured = 1';
  }

  if (newArrival === 'true' || newArrival === '1') {
    query += ' AND is_new_arrival = 1';
  }

  // Sorting
  if (sort === 'price_asc') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'price_desc') {
    query += ' ORDER BY price DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY is_new_arrival DESC, id DESC';
  } else {
    // Default featured sort
    query += ' ORDER BY is_featured DESC, id ASC';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Parse JSON fields
    const parsed = rows.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]'),
      sizes: JSON.parse(item.sizes || '[]'),
      colors: JSON.parse(item.colors || '[]'),
      is_featured: Boolean(item.is_featured),
      is_new_arrival: Boolean(item.is_new_arrival)
    }));

    // Filter by size in memory if specified
    let results = parsed;
    if (size) {
      results = results.filter(p => p.sizes.includes(size.toUpperCase()));
    }

    res.json({
      success: true,
      count: results.length,
      products: results
    });
  });
});

// GET single product by slug or id
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const isNumeric = /^\d+$/.test(slug);

  const query = isNumeric 
    ? 'SELECT * FROM products WHERE id = ?' 
    : 'SELECT * FROM products WHERE slug = ?';

  db.get(query, [isNumeric ? Number(slug) : slug], (err, row) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = {
      ...row,
      images: JSON.parse(row.images || '[]'),
      sizes: JSON.parse(row.sizes || '[]'),
      colors: JSON.parse(row.colors || '[]'),
      is_featured: Boolean(row.is_featured),
      is_new_arrival: Boolean(row.is_new_arrival)
    };

    // Also fetch related products from same category
    db.all(
      'SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4',
      [row.category, row.id],
      (relErr, relRows) => {
        const related = (relRows || []).map(r => ({
          ...r,
          images: JSON.parse(r.images || '[]'),
          sizes: JSON.parse(r.sizes || '[]'),
          colors: JSON.parse(r.colors || '[]')
        }));

        res.json({
          success: true,
          product,
          related
        });
      }
    );
  });
});

module.exports = router;
