import { query } from '../db/connection.js';

export const createNotification = async (userId, title, message, metadata = null) => {
  const { rows } = await query(
    'INSERT INTO notifications (user_id, title, message, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, title, message, metadata]
  );
  return rows[0];
};

export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  const { rows } = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  
  const countResult = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
    [userId]
  );
  
  return {
    rows,
    totalCount: parseInt(countResult.rows[0].count, 10)
  };
};

export const getUnreadCount = async (userId) => {
  const { rows } = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(rows[0].count, 10);
};

export const markAsRead = async (notificationId, userId) => {
  const { rows } = await query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  return rows[0];
};

export const markAllAsRead = async (userId) => {
  const { rowCount } = await query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return rowCount;
};
