import { getClient, query } from '../db/connection.js';

export const createSettlement = async (groupId, fromUserId, toUserId, amount, paymentMethod, notes, createdBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Check current balance
    const { rows: balanceRows } = await client.query(
      `SELECT amount FROM ledger 
       WHERE group_id = $1 AND from_user_id = $2 AND to_user_id = $3`,
      [groupId, fromUserId, toUserId]
    );
    
    const currentBalance = balanceRows.length > 0 ? parseFloat(balanceRows[0].amount) : 0;
    
    if (amount > currentBalance) {
      throw new Error('Settlement amount exceeds balance');
    }
    
    // Insert settlement record
    const { rows: settlementRows } = await client.query(
      `INSERT INTO settlements (group_id, from_user_id, to_user_id, amount, payment_method, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [groupId, fromUserId, toUserId, amount, paymentMethod, notes, createdBy]
    );
    
    // Update ledger
    const newBalance = currentBalance - amount;
    
    if (Math.abs(newBalance) < 0.01) {
      // Balance cleared, delete ledger entry
      await client.query(
        'DELETE FROM ledger WHERE group_id = $1 AND from_user_id = $2 AND to_user_id = $3',
        [groupId, fromUserId, toUserId]
      );
    } else {
      // Update ledger entry
      if (balanceRows.length > 0) {
        await client.query(
          'UPDATE ledger SET amount = $1, updated_at = NOW() WHERE group_id = $2 AND from_user_id = $3 AND to_user_id = $4',
          [newBalance, groupId, fromUserId, toUserId]
        );
      } else {
        // Check reverse direction
        const { rows: reverseRows } = await client.query(
          `SELECT id, amount FROM ledger 
           WHERE group_id = $1 AND from_user_id = $2 AND to_user_id = $3`,
          [groupId, toUserId, fromUserId]
        );
        
        if (reverseRows.length > 0) {
          const reverseAmount = parseFloat(reverseRows[0].amount);
          const netAmount = reverseAmount - amount;
          
          if (Math.abs(netAmount) < 0.01) {
            await client.query(
              'DELETE FROM ledger WHERE id = $1',
              [reverseRows[0].id]
            );
          } else if (netAmount > 0) {
            await client.query(
              'UPDATE ledger SET amount = $1, from_user_id = $2, to_user_id = $3, updated_at = NOW() WHERE id = $4',
              [netAmount, toUserId, fromUserId, reverseRows[0].id]
            );
          } else {
            await client.query(
              'UPDATE ledger SET amount = $1, updated_at = NOW() WHERE id = $2',
              [Math.abs(netAmount), reverseRows[0].id]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    return settlementRows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getGroupSettlements = async (groupId, { limit, offset } = {}) => {
  const paginate = limit !== undefined && offset !== undefined;

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM settlements WHERE group_id = $1`,
    [groupId]
  );
  const total = countRows[0].total;

  let sql = `SELECT s.*, 
            u1.name as from_user_name, 
            u2.name as to_user_name,
            u3.name as created_by_name
     FROM settlements s
     JOIN users u1 ON s.from_user_id = u1.id
     JOIN users u2 ON s.to_user_id = u2.id
     JOIN users u3 ON s.created_by = u3.id
     WHERE s.group_id = $1
     ORDER BY s.created_at DESC`;
  const params = [groupId];

  if (paginate) {
    sql += ` LIMIT $2 OFFSET $3`;
    params.push(limit, offset);
  }

  const { rows } = await query(sql, params);
  return { rows, total };
};
