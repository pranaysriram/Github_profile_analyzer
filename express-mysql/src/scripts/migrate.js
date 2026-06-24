/**
 * Runs schema.sql against the configured MySQL instance.
 * Usage: node src/scripts/migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'schema.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  await conn.query(sql);
  console.log('Migration complete.');
  await conn.end();
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
