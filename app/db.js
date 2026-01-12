const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let pool;

async function connectWithRetry(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
      });
      await pool.query("SELECT 1");
      return pool;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error("Database not initialized. Call connectWithRetry first.");
  }
  return pool;
}

module.exports = {
  connectWithRetry,
  getPool,
};
