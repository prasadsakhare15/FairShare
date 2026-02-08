import { getClient, query } from '../db/connection.js';

export const createGroup = async (name, description, createdBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: groupRows } = await client.query(
      'INSERT INTO user_groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
      [name, description, createdBy]
    );
    const groupId = groupRows[0].id;

    // Add creator as admin
    await client.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [groupId, createdBy, 'admin']
    );

    await client.query('COMMIT');
    return groupId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateGroup = async (groupId, name, description) => {
  const result = await query(
    'UPDATE user_groups SET name = $1, description = $2, updated_at = NOW() WHERE id = $3',
    [name, description, groupId]
  );
  return result.rowCount > 0;
};

export const deleteGroup = async (groupId) => {
  const result = await query('DELETE FROM user_groups WHERE id = $1', [groupId]);
  return result.rowCount > 0;
};

export const getAdminCount = async (groupId) => {
  const { rows } = await query(
    "SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND role = 'admin'",
    [groupId]
  );
  return parseInt(rows[0]?.count ?? 0, 10);
};

export const getGroupById = async (groupId) => {
  const { rows } = await query(
    `SELECT g.*, u.name as creator_name 
     FROM user_groups g 
     JOIN users u ON g.created_by = u.id 
     WHERE g.id = $1`,
    [groupId]
  );
  return rows[0];
};

export const getUserGroups = async (userId) => {
  const { rows } = await query(
    `SELECT g.*, gm.role, u.name as creator_name
     FROM user_groups g
     JOIN group_members gm ON g.id = gm.group_id
     JOIN users u ON g.created_by = u.id
     WHERE gm.user_id = $1
     ORDER BY g.updated_at DESC`,
    [userId]
  );
  return rows;
};

export const addGroupMember = async (groupId, userId, role = 'member') => {
  const { rows } = await query(
    'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) RETURNING id',
    [groupId, userId, role]
  );
  return rows[0]?.id;
};

export const removeGroupMember = async (groupId, userId) => {
  const result = await query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return result.rowCount > 0;
};

export const getGroupMembers = async (groupId) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, gm.role, gm.joined_at
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );
  return rows;
};

export const isGroupMember = async (groupId, userId) => {
  const { rows } = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return rows[0];
};

export const updateMemberRole = async (groupId, userId, role) => {
  const result = await query(
    'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3',
    [role, groupId, userId]
  );
  return result.rowCount > 0;
};
