import { query } from '../db/connection.js';

export const createUser = async (name, email, passwordHash) => {
  const { rows } = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, passwordHash]
  );
  return rows[0]?.id;
};

export const getUserByEmail = async (email) => {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
};

export const getUserById = async (id) => {
  const { rows } = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

export const searchUsers = async (search, excludeUserId) => {
  const searchTerm = `%${search}%`;
  const { rows } = await query(
    `SELECT id, name, email FROM users 
     WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2
     LIMIT 20`,
    [searchTerm, excludeUserId]
  );
  return rows;
};
