import { getClient, query } from '../db/connection.js';

export const createRequest = async (groupId, fromUserId, toUserId, amount, initiatorId, paymentMethod, notes) => {
  const { rows } = await query(
    `INSERT INTO settlement_requests (group_id, from_user_id, to_user_id, amount, initiator_id, payment_method, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [groupId, fromUserId, toUserId, amount, initiatorId, paymentMethod || null, notes || null]
  );
  return rows[0]?.id;
};

export const getRequestById = async (requestId) => {
  const { rows } = await query(
    `SELECT sr.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name,
            u3.name as initiator_name
     FROM settlement_requests sr
     JOIN users u1 ON sr.from_user_id = u1.id
     JOIN users u2 ON sr.to_user_id = u2.id
     JOIN users u3 ON sr.initiator_id = u3.id
     WHERE sr.id = $1`,
    [requestId]
  );
  return rows[0];
};

export const getGroupRequests = async (groupId, currentUserId) => {
  const { rows } = await query(
    `SELECT sr.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name,
            u3.name as initiator_name
     FROM settlement_requests sr
     JOIN users u1 ON sr.from_user_id = u1.id
     JOIN users u2 ON sr.to_user_id = u2.id
     JOIN users u3 ON sr.initiator_id = u3.id
     WHERE sr.group_id = $1
       AND sr.status = 'pending'
       AND (
         (sr.initiator_id = $2 AND sr.from_user_id = $2) OR
         (sr.initiator_id = $2 AND sr.to_user_id = $2) OR
         (sr.initiator_id != $2 AND sr.from_user_id = $2) OR
         (sr.initiator_id != $2 AND sr.to_user_id = $2)
       )
     ORDER BY sr.created_at DESC`,
    [groupId, currentUserId]
  );
  return rows;
};

export const getPendingRequestsForApprover = async (groupId, approverId) => {
  const { rows } = await query(
    `SELECT sr.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name,
            u3.name as initiator_name
     FROM settlement_requests sr
     JOIN users u1 ON sr.from_user_id = u1.id
     JOIN users u2 ON sr.to_user_id = u2.id
     JOIN users u3 ON sr.initiator_id = u3.id
     WHERE sr.group_id = $1
       AND sr.status = 'pending'
       AND (
         (sr.initiator_id = sr.from_user_id AND sr.to_user_id = $2) OR
         (sr.initiator_id = sr.to_user_id AND sr.from_user_id = $2)
       )
     ORDER BY sr.created_at DESC`,
    [groupId, approverId]
  );
  return rows;
};

export const getRequestsInitiatedByUser = async (groupId, userId) => {
  const { rows } = await query(
    `SELECT sr.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name,
            u3.name as initiator_name
     FROM settlement_requests sr
     JOIN users u1 ON sr.from_user_id = u1.id
     JOIN users u2 ON sr.to_user_id = u2.id
     JOIN users u3 ON sr.initiator_id = u3.id
     WHERE sr.group_id = $1 AND sr.initiator_id = $2
     ORDER BY sr.created_at DESC`,
    [groupId, userId]
  );
  return rows;
};

export const updateRequestStatus = async (requestId, status) => {
  const result = await query(
    `UPDATE settlement_requests SET status = $1, responded_at = NOW() WHERE id = $2`,
    [status, requestId]
  );
  return result.rowCount > 0;
};
