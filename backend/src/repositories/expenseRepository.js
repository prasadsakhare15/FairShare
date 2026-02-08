import { getClient, query } from '../db/connection.js';

export const createExpense = async (groupId, title, amount, paidBy, splitType, createdBy, splits) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Insert expense
    const { rows: expenseRows } = await client.query(
      `INSERT INTO expenses (group_id, title, amount, paid_by, split_type, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [groupId, title, amount, paidBy, splitType, createdBy]
    );
    const expenseId = expenseRows[0].id;
    
    // Insert splits
    for (const split of splits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount, percentage) 
         VALUES ($1, $2, $3, $4)`,
        [expenseId, split.user_id, split.amount, split.percentage ?? null]
      );
    }
    
    // Update ledger balances
    for (const split of splits) {
      if (split.user_id !== paidBy) {
        // User owes the payer
        await updateLedgerBalance(
          client,
          groupId,
          split.user_id,
          paidBy,
          split.amount
        );
      }
    }
    
    await client.query('COMMIT');
    return expenseId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateLedgerBalance = async (client, groupId, fromUserId, toUserId, amount) => {
  // Check if reverse balance exists
  const { rows: reverseRows } = await client.query(
    `SELECT id, amount FROM ledger 
     WHERE group_id = $1 AND from_user_id = $2 AND to_user_id = $3`,
    [groupId, toUserId, fromUserId]
  );
  
  if (reverseRows.length > 0) {
    const reverseAmount = parseFloat(reverseRows[0].amount);
    const netAmount = amount - reverseAmount;
    
    if (Math.abs(netAmount) < 0.01) {
      // Cancel out, delete both entries
      await client.query(
        'DELETE FROM ledger WHERE id = $1',
        [reverseRows[0].id]
      );
    } else if (netAmount > 0) {
      // Update to new direction
      await client.query(
        'DELETE FROM ledger WHERE id = $1',
        [reverseRows[0].id]
      );
      await upsertLedger(client, groupId, fromUserId, toUserId, netAmount);
    } else {
      // Update reverse entry
      await client.query(
        'UPDATE ledger SET amount = $1, updated_at = NOW() WHERE id = $2',
        [Math.abs(netAmount), reverseRows[0].id]
      );
    }
  } else {
    // No reverse balance, insert or update
    await upsertLedger(client, groupId, fromUserId, toUserId, amount);
  }
};

const upsertLedger = async (client, groupId, fromUserId, toUserId, amount) => {
  await client.query(
    `INSERT INTO ledger (group_id, from_user_id, to_user_id, amount) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (group_id, from_user_id, to_user_id)
     DO UPDATE SET amount = ledger.amount + EXCLUDED.amount, updated_at = NOW()`,
    [groupId, fromUserId, toUserId, amount]
  );
};

export const getGroupExpenses = async (groupId) => {
  const { rows } = await query(
    `SELECT e.*, 
            u1.name as paid_by_name, 
            u2.name as created_by_name
     FROM expenses e
     JOIN users u1 ON e.paid_by = u1.id
     JOIN users u2 ON e.created_by = u2.id
     WHERE e.group_id = $1
     ORDER BY e.created_at DESC`,
    [groupId]
  );
  
  // Get splits for each expense
  for (const expense of rows) {
    const { rows: splits } = await query(
      `SELECT es.*, u.name as user_name
       FROM expense_splits es
       JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = $1`,
      [expense.id]
    );
    expense.splits = splits;
  }
  
  return rows;
};

const reverseLedgerBalance = async (client, groupId, paidBy, splits) => {
  for (const split of splits) {
    if (split.user_id !== paidBy) {
      await updateLedgerBalance(
        client,
        groupId,
        paidBy,
        split.user_id,
        parseFloat(split.amount)
      );
    }
  }
};

export const updateExpense = async (expenseId, groupId, title, amount, paidBy, splitType, splits) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await getExpenseByIdForUpdate(client, expenseId);
    if (!existing || existing.group_id !== parseInt(groupId)) {
      throw new Error('Expense not found');
    }

    await reverseLedgerBalance(client, existing.group_id, existing.paid_by, existing.splits);

    await client.query(
      `UPDATE expenses SET title = $1, amount = $2, paid_by = $3, split_type = $4, updated_at = NOW()
       WHERE id = $5`,
      [title, amount, paidBy, splitType, expenseId]
    );

    await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

    for (const split of splits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount, percentage) 
         VALUES ($1, $2, $3, $4)`,
        [expenseId, split.user_id, split.amount, split.percentage ?? null]
      );
    }

    for (const split of splits) {
      if (split.user_id !== paidBy) {
        await updateLedgerBalance(client, groupId, split.user_id, paidBy, parseFloat(split.amount));
      }
    }

    await client.query('COMMIT');
    return expenseId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteExpense = async (expenseId, groupId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await getExpenseByIdForUpdate(client, expenseId);
    if (!existing || existing.group_id !== parseInt(groupId)) {
      throw new Error('Expense not found');
    }

    await reverseLedgerBalance(client, existing.group_id, existing.paid_by, existing.splits);

    await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
    await client.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getExpenseByIdForUpdate = async (client, expenseId) => {
  const { rows: expenseRows } = await client.query(
    `SELECT * FROM expenses WHERE id = $1`,
    [expenseId]
  );
  if (expenseRows.length === 0) return null;

  const { rows: splits } = await client.query(
    `SELECT * FROM expense_splits WHERE expense_id = $1`,
    [expenseId]
  );
  return { ...expenseRows[0], splits };
};

export const getExpenseById = async (expenseId) => {
  const { rows } = await query(
    `SELECT e.*, 
            u1.name as paid_by_name, 
            u2.name as created_by_name
     FROM expenses e
     JOIN users u1 ON e.paid_by = u1.id
     JOIN users u2 ON e.created_by = u2.id
     WHERE e.id = $1`,
    [expenseId]
  );
  
  if (rows.length === 0) return null;
  
  const expense = rows[0];
  const { rows: splits } = await query(
    `SELECT es.*, u.name as user_name
     FROM expense_splits es
     JOIN users u ON es.user_id = u.id
     WHERE es.expense_id = $1`,
    [expenseId]
  );
  expense.splits = splits;
  
  return expense;
};
