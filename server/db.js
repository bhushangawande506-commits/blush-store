const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'blush.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
  }
});

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          price INTEGER NOT NULL,
          compare_at_price INTEGER,
          description TEXT,
          fabric TEXT,
          care TEXT,
          images TEXT NOT NULL, -- JSON array of image URLs
          sizes TEXT NOT NULL,  -- JSON array of available sizes
          colors TEXT NOT NULL, -- JSON array of available colors
          is_featured INTEGER DEFAULT 0,
          is_new_arrival INTEGER DEFAULT 0,
          stock INTEGER DEFAULT 10,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          shipping_address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          pincode TEXT NOT NULL,
          order_notes TEXT,
          subtotal INTEGER NOT NULL,
          shipping_fee INTEGER NOT NULL,
          discount INTEGER DEFAULT 0,
          total_amount INTEGER NOT NULL,
          payment_method TEXT NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'pending',
          order_status TEXT NOT NULL DEFAULT 'pending_payment',
          razorpay_order_id TEXT,
          razorpay_payment_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Order items table
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          size TEXT,
          color TEXT,
          price INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          image TEXT,
          FOREIGN KEY (order_id) REFERENCES orders (id)
        )
      `);

      // Payments audit log table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          gateway TEXT NOT NULL,
          gateway_order_id TEXT,
          gateway_payment_id TEXT,
          amount INTEGER NOT NULL,
          currency TEXT DEFAULT 'INR',
          status TEXT NOT NULL,
          signature_verified INTEGER DEFAULT 0,
          raw_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Webhooks idempotency audit log
      db.run(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT UNIQUE,
          event_type TEXT NOT NULL,
          payload TEXT,
          processed INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Store settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS store_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  db,
  initDatabase
};
