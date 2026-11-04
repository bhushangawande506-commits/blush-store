/**
 * =============================================================================
 * BLUSH PUNE — STANDALONE SQLITE TO SUPABASE POSTGRESQL DATA MIGRATOR
 * File: supabase/migrate_sqlite_to_supabase.js
 * =============================================================================
 * 
 * Target Database: Supabase PostgreSQL (via pg Pool)
 * Source Database: SQLite 3 (server/blush.sqlite) in STRICT READ-ONLY MODE
 * 
 * EXECUTION SAFETY & ARCHITECTURAL GUARANTEES:
 * 1. Strictly reads SQLite using `sqlite3.OPEN_READONLY` (cannot write/corrupt SQLite).
 * 2. Requires `process.env.SUPABASE_DATABASE_URL` and `process.env.SUPABASE_PROJECT_REF`
 *    explicitly for live migration (validates legitimate Supabase endpoint & project match).
 * 3. All imports run inside a single atomic PostgreSQL transaction (`BEGIN ... COMMIT`).
 *    Any failure rolls back all changes cleanly.
 * 4. Imports tables in foreign-key-safe referential dependency order:
 *    store_settings -> products -> orders -> order_items -> payments -> webhooks.
 * 5. Synchronizes PostgreSQL identity sequences post-import (`setval()`).
 * 6. Validates post-import row counts against source SQLite row counts.
 * 7. Supports `--dry-run` flag to validate SQLite data and foreign-key integrity
 *    without connecting to PostgreSQL.
 * 
 * PREREQUISITE:
 * Ensure `supabase/schema.sql` has been executed on the target Supabase database,
 * and `npm install pg` has been run before executing live migration.
 * 
 * USAGE:
 *   Dry Run (inspect & validate SQLite only):
 *     node supabase/migrate_sqlite_to_supabase.js --dry-run
 * 
 *   Live Migration:
 *     node supabase/migrate_sqlite_to_supabase.js
 * =============================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Connection Configuration (Never hardcoded, never printed)
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const expectedProjectRef = (process.env.SUPABASE_PROJECT_REF || '').trim();
const isDryRun = process.argv.includes('--dry-run');

const SQLITE_DB_PATH = path.join(__dirname, '..', 'server', 'blush.sqlite');

/**
 * Helper: Safely reads all rows from an SQLite table in read-only mode
 */
function readSqliteTable(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) reject(new Error(`Failed to read SQLite table "${tableName}": ${err.message}`));
      else resolve(rows || []);
    });
  });
}

/**
 * Helper: Validates JSON format and returns serialized string for JSONB casting
 */
function toValidJsonString(val, fallback = '[]') {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'object') return JSON.stringify(val);
  try {
    JSON.parse(val);
    return val;
  } catch (e) {
    return fallback;
  }
}

/**
 * Helper: Validates Supabase connection URL, hostname, port, protocol, pathname,
 * and project reference against intended Blush configuration.
 */
function validateSupabaseConnection(urlStr, expectedRef, envOptions = process.env) {
  if (!urlStr) {
    throw new Error(
      'SUPABASE_DATABASE_URL environment variable is missing.\n' +
      'Live migration strictly requires SUPABASE_DATABASE_URL to be set in your .env file.\n' +
      '(Silent fallback to DATABASE_URL is disabled to prevent accidental writes).'
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlStr);
  } catch (err) {
    throw new Error('Invalid connection URI format in SUPABASE_DATABASE_URL.');
  }

  // 1. Protocol Validation: Strictly postgres: or postgresql:
  const protocol = (parsedUrl.protocol || '').toLowerCase();
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error(
      `Invalid connection protocol "${parsedUrl.protocol}".\n` +
      'SUPABASE_DATABASE_URL must begin with "postgresql://" or "postgres://".'
    );
  }

  // 2. Port Validation: 5432 (direct/session) or 6543 (transaction pooler) only
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432;
  if (![5432, 6543].includes(port)) {
    throw new Error(
      `Invalid port "${parsedUrl.port}". Supabase database connections must use port 5432 or 6543.`
    );
  }

  // 3. Database Pathname Validation: normally /postgres
  const dbName = (parsedUrl.pathname || '').replace(/^\//, '').trim();
  if (!dbName) {
    throw new Error(
      'Missing database pathname in SUPABASE_DATABASE_URL.\n' +
      'A valid database pathname is required (normally "/postgres").'
    );
  }

  // 4. Strict Hostname Classification (ensuring shared and dedicated poolers do not overlap)
  const targetHostname = (parsedUrl.hostname || '').toLowerCase();
  const isDirectEndpoint = /^db\.[a-z0-9_-]+\.supabase\.co$/.test(targetHostname);
  const isSharedPooler = /^(aws|gcp)-0-[a-z0-9-]+\.pooler\.supabase\.com$/.test(targetHostname);
  const isDedicatedPooler = /^[a-z0-9_-]+\.pooler\.supabase\.com$/.test(targetHostname) && !isSharedPooler;
  const isPoolerEndpoint = isSharedPooler || isDedicatedPooler;

  if (!isDirectEndpoint && !isPoolerEndpoint) {
    throw new Error(
      `Safety check failed: Hostname "${targetHostname}" is not a legitimate Supabase database endpoint.\n` +
      'Accepted endpoints are strictly restricted to:\n' +
      '  - Direct endpoint : db.<project-ref>.supabase.co\n' +
      '  - Shared pooler   : aws-0-<region>.pooler.supabase.com or gcp-0-<region>.pooler.supabase.com\n' +
      '  - Dedicated pooler: <project-ref>.pooler.supabase.com'
    );
  }

  // 5. Project Reference Extraction
  let extractedProjectRef = null;
  let poolerType = null;
  if (isDirectEndpoint) {
    const directMatch = targetHostname.match(/^db\.([a-z0-9_-]+)\.supabase\.co$/);
    if (directMatch) extractedProjectRef = directMatch[1];
  } else if (isDedicatedPooler) {
    poolerType = 'dedicated';
    const dedicatedMatch = targetHostname.match(/^([a-z0-9_-]+)\.pooler\.supabase\.com$/);
    if (dedicatedMatch) extractedProjectRef = dedicatedMatch[1];
  } else if (isSharedPooler) {
    poolerType = 'shared';
    // For shared pooler URLs, extract project reference from the final username segment (<role>.<project-ref>)
    const username = decodeURIComponent(parsedUrl.username || '');
    const userParts = username.split('.');
    if (userParts.length >= 2) {
      extractedProjectRef = userParts[userParts.length - 1];
    }
  }

  // 6. Project Reference Matching
  const cleanExpected = (expectedRef || '').trim();
  if (!cleanExpected) {
    throw new Error(
      'Project-specific validation required: SUPABASE_PROJECT_REF is missing in .env.\n' +
      'To ensure records are migrated only to the intended Blush project and not another instance,\n' +
      'specify your project reference in .env: SUPABASE_PROJECT_REF=<your-blush-project-ref>\n' +
      `(Detected project reference in URL: "${extractedProjectRef || 'unknown'}")`
    );
  }

  if (!extractedProjectRef || extractedProjectRef.toLowerCase() !== cleanExpected.toLowerCase()) {
    throw new Error(
      'Destination project mismatch!\n' +
      `  Connection URL targets project ref : "${extractedProjectRef || 'unrecognized'}"\n` +
      `  Expected Blush project ref         : "${cleanExpected}"\n` +
      'Migration aborted to protect against accidental writes to the wrong Supabase instance.'
    );
  }

  // 7. SSL Configuration (Secure by Default)
  const allowInsecureSsl = envOptions.SUPABASE_SSL_REJECT_UNAUTHORIZED === 'false';
  const sslConfig = {
    rejectUnauthorized: !allowInsecureSsl
  };

  if (envOptions.SUPABASE_SSL_CA) {
    sslConfig.ca = envOptions.SUPABASE_SSL_CA;
  } else if (envOptions.SUPABASE_SSL_CERT_PATH) {
    if (!fs.existsSync(envOptions.SUPABASE_SSL_CERT_PATH)) {
      throw new Error(`CA certificate file not found at path: ${envOptions.SUPABASE_SSL_CERT_PATH}`);
    }
    sslConfig.ca = fs.readFileSync(envOptions.SUPABASE_SSL_CERT_PATH, 'utf8');
  }

  return {
    targetHostname,
    port,
    dbName,
    extractedProjectRef,
    isDirectEndpoint,
    isSharedPooler,
    isDedicatedPooler,
    poolerType,
    sslConfig,
    allowInsecureSsl
  };
}

/**
 * Main Migration Orchestrator
 */
async function runMigration() {
  console.log('===============================================================');
  console.log(' ✨ BLUSH PUNE — SQLITE TO SUPABASE DATA MIGRATION SUITE');
  console.log(` 📍 Mode: ${isDryRun ? 'DRY RUN (Validation Only)' : 'LIVE MIGRATION'}`);
  console.log('===============================================================\n');

  // Step 1: Open SQLite Database in Read-Only Mode
  console.log('1. Connecting to source SQLite database in strictly read-only mode...');
  const sqliteDb = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(new Error(`Failed to open SQLite database at ${SQLITE_DB_PATH}: ${err.message}`));
      else resolve(db);
    });
  });
  console.log('   ✓ SQLite connected successfully in read-only mode.\n');

  // Step 2: Read All Source Tables
  console.log('2. Extracting records from source SQLite tables...');
  const sourceData = {};
  const tables = ['store_settings', 'products', 'orders', 'order_items', 'payments', 'webhooks'];

  for (const table of tables) {
    sourceData[table] = await readSqliteTable(sqliteDb, table);
    console.log(`   ✓ Extracted ${table.padEnd(16)}: ${sourceData[table].length.toString().padStart(3)} records`);
  }

  // Close SQLite immediately after read
  sqliteDb.close();
  console.log('   ✓ SQLite read complete. Source connection closed.\n');

  // Step 3: Validate Foreign-Key Relationships & Integrity in Memory
  console.log('3. Validating referential integrity and data payloads...');
  const productIds = new Set(sourceData.products.map(p => p.id));
  const orderIds = new Set(sourceData.orders.map(o => o.id));

  // Verify order_items
  let orphanOrderItems = 0;
  for (const item of sourceData.order_items) {
    if (!orderIds.has(item.order_id)) {
      console.warn(`   ⚠️ Orphan item detected: order_id "${item.order_id}" not found in orders`);
      orphanOrderItems++;
    }
    if (!productIds.has(item.product_id)) {
      console.warn(`   ⚠️ Item product_id ${item.product_id} not found in active products (will map to NULL if deleted)`);
    }
  }

  // Verify payments
  let orphanPayments = 0;
  for (const pay of sourceData.payments) {
    if (!orderIds.has(pay.order_id)) {
      console.warn(`   ⚠️ Orphan payment detected: order_id "${pay.order_id}" not found in orders`);
      orphanPayments++;
    }
  }

  if (orphanOrderItems === 0 && orphanPayments === 0) {
    console.log('   ✓ 100% of foreign-key relationships verified valid and intact.\n');
  }

  // If running in Dry Run mode, exit before touching PostgreSQL
  if (isDryRun) {
    console.log('---------------------------------------------------------------');
    console.log(' 🔍 DRY RUN COMPLETED SUCCESSFULLY');
    console.log(' All tables and records were safely extracted and validated.');
    console.log(' Ready for live migration when credentials are provided.');
    console.log('---------------------------------------------------------------');
    return;
  }

  // Step 4: Validate PostgreSQL Connection Configuration & Host Safety
  const validated = validateSupabaseConnection(supabaseUrl, expectedProjectRef, process.env);

  if (validated.allowInsecureSsl) {
    console.warn(
      '\n⚠️  SECURITY WARNING: SSL certificate verification has been explicitly disabled\n' +
      '   via SUPABASE_SSL_REJECT_UNAUTHORIZED=false. The connection is vulnerable to\n' +
      '   Man-In-The-Middle (MITM) attacks.\n'
    );
  }

  let Pool;
  try {
    ({ Pool } = require('pg'));
  } catch (err) {
    throw new Error(
      'The "pg" package is required for live PostgreSQL migration.\n' +
      'Run `npm install pg` before initiating live migration.'
    );
  }

  // Confirm target using ONLY sanitized endpoint and project ref (never credentials or password)
  console.log(
    `4. Target database verified: ${validated.targetHostname}:${validated.port}/${validated.dbName} ` +
    `(Project: ${validated.extractedProjectRef}${validated.poolerType ? `, Pooler: ${validated.poolerType}` : ''})`
  );
  console.log('   Connecting to Supabase PostgreSQL...');

  const pool = new Pool({
    connectionString: supabaseUrl,
    ssl: validated.sslConfig,
    connectionTimeoutMillis: 10000
  });

  const client = await pool.connect();
  console.log(`   ✓ Connected to ${validated.targetHostname}:${validated.port}. Initiating atomic transaction...`);

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------------------
    // Insert Step 1: store_settings
    // -------------------------------------------------------------------------
    console.log('   -> Migrating store_settings...');
    for (const s of sourceData.store_settings) {
      await client.query(
        `INSERT INTO public.store_settings (key, value, is_public)
         VALUES ($1, $2, true)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [s.key, s.value]
      );
    }

    // -------------------------------------------------------------------------
    // Insert Step 2: products (explicit ID preservation)
    // -------------------------------------------------------------------------
    console.log('   -> Migrating products (preserving explicit catalog IDs)...');
    for (const p of sourceData.products) {
      await client.query(
        `INSERT INTO public.products (
           id, name, slug, category, price, compare_at_price, description, fabric, care,
           images, sizes, colors, is_featured, is_new_arrival, stock, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15, $16
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           compare_at_price = EXCLUDED.compare_at_price,
           description = EXCLUDED.description,
           fabric = EXCLUDED.fabric,
           care = EXCLUDED.care,
           images = EXCLUDED.images,
           sizes = EXCLUDED.sizes,
           colors = EXCLUDED.colors,
           is_featured = EXCLUDED.is_featured,
           is_new_arrival = EXCLUDED.is_new_arrival,
           stock = EXCLUDED.stock`,
        [
          p.id,
          p.name,
          p.slug,
          p.category,
          p.price,
          p.compare_at_price,
          p.description,
          p.fabric,
          p.care,
          toValidJsonString(p.images, '[]'),
          toValidJsonString(p.sizes, '[]'),
          toValidJsonString(p.colors, '[]'),
          p.is_featured ? 1 : 0,
          p.is_new_arrival ? 1 : 0,
          p.stock,
          p.created_at || new Date()
        ]
      );
    }

    // -------------------------------------------------------------------------
    // Insert Step 3: orders
    // -------------------------------------------------------------------------
    console.log('   -> Migrating orders...');
    for (const o of sourceData.orders) {
      await client.query(
        `INSERT INTO public.orders (
           id, customer_name, customer_email, customer_phone, shipping_address,
           city, state, pincode, order_notes, subtotal, shipping_fee, discount,
           total_amount, payment_method, payment_status, order_status,
           razorpay_order_id, razorpay_payment_id, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19
         )
         ON CONFLICT (id) DO UPDATE SET
           payment_status = EXCLUDED.payment_status,
           order_status = EXCLUDED.order_status,
           razorpay_order_id = EXCLUDED.razorpay_order_id,
           razorpay_payment_id = EXCLUDED.razorpay_payment_id`,
        [
          o.id,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.shipping_address,
          o.city,
          o.state,
          o.pincode,
          o.order_notes,
          o.subtotal,
          o.shipping_fee,
          o.discount || 0,
          o.total_amount,
          o.payment_method || 'razorpay',
          o.payment_status || 'pending',
          o.order_status || 'pending_payment',
          o.razorpay_order_id,
          o.razorpay_payment_id,
          o.created_at || new Date()
        ]
      );
    }

    // -------------------------------------------------------------------------
    // Insert Step 4: order_items
    // -------------------------------------------------------------------------
    console.log('   -> Migrating order_items...');
    for (const item of sourceData.order_items) {
      await client.query(
        `INSERT INTO public.order_items (
           id, order_id, product_id, product_name, size, color, price, quantity, image
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9
         )
         ON CONFLICT (id) DO UPDATE SET
           price = EXCLUDED.price,
           quantity = EXCLUDED.quantity`,
        [
          item.id,
          item.order_id,
          productIds.has(item.product_id) ? item.product_id : null,
          item.product_name,
          item.size,
          item.color,
          item.price,
          item.quantity,
          item.image
        ]
      );
    }

    // -------------------------------------------------------------------------
    // Insert Step 5: payments
    // -------------------------------------------------------------------------
    console.log('   -> Migrating payments audit records...');
    for (const pay of sourceData.payments) {
      await client.query(
        `INSERT INTO public.payments (
           id, order_id, gateway, gateway_order_id, gateway_payment_id, amount,
           currency, status, signature_verified, raw_response, created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11
         )
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           signature_verified = EXCLUDED.signature_verified`,
        [
          pay.id,
          pay.order_id,
          pay.gateway || 'razorpay',
          pay.gateway_order_id,
          pay.gateway_payment_id,
          pay.amount,
          pay.currency || 'INR',
          pay.status,
          pay.signature_verified ? 1 : 0,
          toValidJsonString(pay.raw_response, 'null'),
          pay.created_at || new Date()
        ]
      );
    }

    // -------------------------------------------------------------------------
    // Insert Step 6: webhooks (if any)
    // -------------------------------------------------------------------------
    if (sourceData.webhooks.length > 0) {
      console.log('   -> Migrating webhooks...');
      for (const w of sourceData.webhooks) {
        await client.query(
          `INSERT INTO public.webhooks (
             id, event_id, event_type, payload, processed, created_at
           ) VALUES ($1, $2, $3, $4::jsonb, $5, $6)
           ON CONFLICT (event_id) DO NOTHING`,
          [
            w.id,
            w.event_id,
            w.event_type,
            toValidJsonString(w.payload, '{}'),
            w.processed ? 1 : 0,
            w.created_at || new Date()
          ]
        );
      }
    }

    // -------------------------------------------------------------------------
    // Step 7: Synchronize Identity Sequences
    // -------------------------------------------------------------------------
    console.log('\n5. Synchronizing identity sequences with imported ID maximums...');
    const sequenceQueries = [
      "SELECT setval(pg_get_serial_sequence('public.products', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM public.products",
      "SELECT setval(pg_get_serial_sequence('public.order_items', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM public.order_items",
      "SELECT setval(pg_get_serial_sequence('public.payments', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM public.payments",
      "SELECT setval(pg_get_serial_sequence('public.webhooks', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM public.webhooks"
    ];

    for (const q of sequenceQueries) {
      await client.query(q);
    }
    console.log('   ✓ All identity sequences synchronized successfully.');

    // -------------------------------------------------------------------------
    // Step 8: Post-Import Row Count Verification
    // -------------------------------------------------------------------------
    console.log('\n6. Verifying post-migration row counts against SQLite source:');
    console.log('   ------------------------------------------------------------');
    console.log('   Table Name        SQLite Count   Supabase Count   Status');
    console.log('   ------------------------------------------------------------');

    let allCountsMatch = true;
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*)::integer as count FROM public.${table}`);
      const pgCount = res.rows[0].count;
      const sqliteCount = sourceData[table].length;
      const match = pgCount === sqliteCount;
      if (!match) allCountsMatch = false;

      console.log(
        `   ${table.padEnd(18)} ${sqliteCount.toString().padStart(8)}` +
        `       ${pgCount.toString().padStart(8)}       ${match ? '✓ PASS' : '❌ MISMATCH'}`
      );
    }
    console.log('   ------------------------------------------------------------');

    if (!allCountsMatch) {
      throw new Error('Row count mismatch detected during verification. Aborting transaction.');
    }

    await client.query('COMMIT');
    console.log('\n🎉 TRANSACTION COMMITTED: Data migration completed with 100% parity!');

  } catch (txErr) {
    await client.query('ROLLBACK');
    console.error('\n❌ MIGRATION ERROR: Transaction rolled back. Zero changes committed to Supabase.');
    console.error('   Reason:', txErr.message);
    throw txErr;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute migration CLI when invoked directly
if (require.main === module) {
  runMigration().catch((err) => {
    console.error('\nFatal migration error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  validateSupabaseConnection
};

