import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fairshare',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;
