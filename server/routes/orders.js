const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Create a new order (authoritative server validation)
router.post('/create', (req, res) => {
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

  // Validation
  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !state || !pincode) {
    return res.status(400).json({ error: 'Please provide all required shipping and contact details.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  // Fetch products from database to verify stock and compute true price
  const productIds = items.map(i => i.product_id || i.id);
  const placeholders = productIds.map(() => '?').join(',');

  db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, dbProducts) => {
    if (err) {
      console.error('Error querying products for order:', err);
      return res.status(500).json({ error: 'Database error validating products' });
    }

    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p.id, p));

    // Calculate authoritative totals and check inventory
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = item.product_id || item.id;
      const dbProd = productMap.get(pid);

      if (!dbProd) {
        return res.status(400).json({ error: `Product with ID ${pid} is not found.` });
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (dbProd.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock}, Requested: ${qty}`
        });
      }

      const itemTotal = dbProd.price * qty;
      serverSubtotal += itemTotal;

      validatedItems.push({
        product_id: dbProd.id,
        product_name: dbProd.name,
        size: item.size || 'Regular',
        color: item.color || '',
        price: dbProd.price,
        quantity: qty,
        image: item.image || (JSON.parse(dbProd.images || '[]')[0] || '')
      });
    }

    // Shipping rules: Free shipping for orders >= ₹2,499, otherwise standard ₹150
    const shippingFee = serverSubtotal >= 2499 ? 0 : 150;
    const discount = 0;
    const totalAmount = serverSubtotal + shippingFee - discount;

    const orderId = `BLUSH-${Date.now().toString().slice(-6)}`;

    // Insert order and order items
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const insertOrder = db.prepare(`
        INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, shipping_address,
          city, state, pincode, order_notes, subtotal, shipping_fee, discount,
          total_amount, payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending_payment')
      `);

      insertOrder.run(
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
        payment_method,
        function (insErr) {
          if (insErr) {
            db.run('ROLLBACK');
            console.error('Failed to create order record:', insErr);
            return res.status(500).json({ error: 'Failed to record order' });
          }

          const insertItem = db.prepare(`
            INSERT INTO order_items (
              order_id, product_id, product_name, size, color, price, quantity, image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          validatedItems.forEach(v => {
            insertItem.run(orderId, v.product_id, v.product_name, v.size, v.color, v.price, v.quantity, v.image);
          });

          insertItem.finalize((itemErr) => {
            if (itemErr) {
              db.run('ROLLBACK');
              console.error('Failed to insert order items:', itemErr);
              return res.status(500).json({ error: 'Failed to record order items' });
            }

            db.run('COMMIT');

            res.json({
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
          });
        }
      );
    });
  });
});

// GET single order details
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching order' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.all('SELECT * FROM order_items WHERE order_id = ?', [id], (iErr, items) => {
      if (iErr) {
        return res.status(500).json({ error: 'Error fetching order items' });
      }

      res.json({
        success: true,
        order,
        items
      });
    });
  });
});

module.exports = router;
