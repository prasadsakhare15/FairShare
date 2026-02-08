import { query } from '../db/connection.js';

export const getGroupBalances = async (groupId) => {
  const { rows } = await query(
    `SELECT l.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name
     FROM ledger l
     JOIN users u1 ON l.from_user_id = u1.id
     JOIN users u2 ON l.to_user_id = u2.id
     WHERE l.group_id = $1 AND l.amount > 0
     ORDER BY l.updated_at DESC`,
    [groupId]
  );
  return rows;
};

export const getUserBalanceSummary = async (userId) => {
  const { rows } = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN l.from_user_id = $1 THEN l.amount ELSE 0 END), 0) as you_owe,
       COALESCE(SUM(CASE WHEN l.to_user_id = $1 THEN l.amount ELSE 0 END), 0) as you_are_owed
     FROM ledger l
     JOIN group_members gm ON l.group_id = gm.group_id
     WHERE gm.user_id = $1`,
    [userId]
  );
  return rows[0];
};

export const getUserBalanceInGroup = async (groupId, userId) => {
  const { rows } = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END), 0) as total_owes,
       COALESCE(SUM(CASE WHEN to_user_id = $1 THEN amount ELSE 0 END), 0) as total_owed
     FROM ledger
     WHERE group_id = $2`,
    [userId, groupId]
  );
  return rows[0];
};
