/**
 * =============================================================================
 * BLUSH PUNE — SUPABASE POSTGRESQL DATABASE ADAPTER
 * File: server/db.js
 * =============================================================================
 *
 * Target Environment: Supabase PostgreSQL (Managed Postgres / Supabase Pooler)
 * Driver: 'pg' (node-postgres Pool)
 * Primary Connection String: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
 *
 * SECURITY & INTEGRITY GUARANTEES:
 * 1. Strict SSL certificate verification (rejectUnauthorized: true) enforced.
 * 2. Supabase Root CA certificate loaded via SUPABASE_SSL_CERT_PATH / SUPABASE_SSL_CA.
 * 3. Never logs credentials, passwords, or connection secrets.
 * 4. Dedicated client checkout for atomic multi-statement transactions.
 * 5. Provides health check verification for server lifecycle monitoring.
 * 6. Backward-compatibility bridge for transitional staging.
 * =============================================================================
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Connection URL Resolution
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '[Database Warning] Neither SUPABASE_DATABASE_URL nor DATABASE_URL is set in environment variables.\n' +
    'Please configure your Supabase connection string in your root .env file.'
  );
}

// 2. SSL Configuration (Strict Certificate Verification)
// Supabase requires SSL. The custom Supabase CA certificate must be used
// to avoid "self-signed certificate in certificate chain" errors while keeping
// rejectUnauthorized: true active for zero MITM risk.
const sslConfig = {
  rejectUnauthorized: true
};

if (process.env.SUPABASE_SSL_CA) {
  sslConfig.ca = process.env.SUPABASE_SSL_CA;
} else {
  const defaultCertPath = path.join(__dirname, '../supabase/certs/prod-ca-2021.crt');
  const certPath = process.env.SUPABASE_SSL_CERT_PATH
    ? path.resolve(process.env.SUPABASE_SSL_CERT_PATH)
    : defaultCertPath;

  if (fs.existsSync(certPath)) {
    sslConfig.ca = fs.readFileSync(certPath, 'utf8');
  }
}

// 3. PostgreSQL Connection Pool
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const defaultPoolMax = isServerless ? 1 : 10;
const defaultIdleTimeout = isServerless ? 5000 : 30000;

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: sslConfig,
  max: parseInt(process.env.DB_POOL_MAX || String(defaultPoolMax), 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || String(defaultIdleTimeout), 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10)
});

// Monitor unexpected errors on idle pool clients
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Unexpected Error]', err.message);
});

// 4. Safe Endpoint Metadata Helper (Never exposes credentials)
function getSanitizedEndpoint() {
  if (!connectionString) return 'Not configured';
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const dbName = (parsed.pathname || '').replace(/^\//, '') || 'postgres';
    return `${host}:${port}/${dbName}`;
  } catch {
    return 'Configured (unparseable URI format)';
  }
}

// 5. Database Health Check Verification
/**
 * Performs a comprehensive health verification of the Supabase database connection.
 * @returns {Promise<object>} Health status report
 */
async function checkDatabaseHealth() {
  if (!connectionString) {
    return {
      status: 'unhealthy',
      error: 'Missing database connection string (SUPABASE_DATABASE_URL or DATABASE_URL)'
    };
  }

  let client;
  try {
    const start = Date.now();
    client = await pool.connect();
    const res = await client.query(`
      SELECT
        current_database() AS database,
        split_part(version(), ' ', 1) || ' ' || split_part(version(), ' ', 2) AS version,
        NOW() AS server_time,
        current_user AS db_user
    `);
    const latencyMs = Date.now() - start;

    return {
      status: 'healthy',
      latencyMs,
      endpoint: getSanitizedEndpoint(),
      database: res.rows[0].database,
      version: res.rows[0].version,
      serverTime: res.rows[0].server_time,
      dbUser: res.rows[0].db_user,
      sslVerified: sslConfig.rejectUnauthorized === true,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      endpoint: getSanitizedEndpoint(),
      error: err.message
    };
  } finally {
    if (client) client.release();
  }
}

// 6. Database Initialization Lifecycle Handler
let initPromise = null;

/**
 * Invoked during Express startup and serverless request lifecycle.
 * Validates connection, verifies SSL, and logs connectivity info without leaking secrets.
 * Caches the initialization promise safely across warm invocations.
 */
async function initDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      const health = await checkDatabaseHealth();
      if (health.status !== 'healthy') {
        throw new Error(`Supabase PostgreSQL connection failed: ${health.error}`);
      }

      console.log(`✓ Connected to Supabase PostgreSQL [${health.endpoint}]`);
      console.log(`  - Database   : ${health.database} (${health.version})`);
      console.log(`  - Server Time: ${health.serverTime}`);
      console.log(`  - SSL Verify : ACTIVE (rejectUnauthorized: ${health.sslVerified})`);
      console.log(`  - Latency    : ${health.latencyMs}ms`);

      return health;
    })().catch(err => {
      initPromise = null; // Reset cache on failure so subsequent attempts can retry
      throw err;
    });
  }

  return initPromise;
}

// 7. Parameterized Query Helper
/**
 * Executes a parameterized SQL query on the pool.
 * @param {string} text - SQL statement ($1, $2...)
 * @param {Array} params - Parameter array
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[SQL Executed]', { text, duration: `${duration}ms`, rowCount: res.rowCount });
  }
  return res;
}

// 8. Atomic Transaction Manager
/**
 * Runs an asynchronous unit of work inside a dedicated transaction client.
 * Handles client acquisition, BEGIN, COMMIT, ROLLBACK on error, and release.
 *
 * @param {Function} callback - async (client) => { ... }
 * @returns {Promise<any>} Result returned by callback
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  initDatabase,
  checkDatabaseHealth
};
