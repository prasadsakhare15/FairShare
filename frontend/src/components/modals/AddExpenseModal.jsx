import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatUtils';
import { useToast } from '../../context/ToastContext';

// Add Expense Modal Component
const AddExpenseModal = ({ group, expense, onClose, onSubmit }) => {
  const { showToast } = useToast();
  const isEdit = !!expense;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expense && group?.members) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setPaidBy(String(expense.paid_by));
      setSplitType(expense.split_type);
      const existingMap = new Map((expense.splits ?? []).map((s) => [s.user_id, s]));
      setSplits(
        group.members.map((member) => {
          const existing = existingMap.get(member.id);
          return existing
            ? { user_id: member.id, amount: parseFloat(existing.amount), percentage: existing.percentage ? parseFloat(existing.percentage) : null }
            : { user_id: member.id, amount: 0, percentage: null };
        })
      );
    }
  }, [expense?.id, group?.members]);

  useEffect(() => {
    if (group?.members && !expense) {
      if (splitType === 'equal' && group.members.length > 0) {
        const equalAmount = amount ? (parseFloat(amount) / group.members.length).toFixed(2) : 0;
        setSplits(
          group.members.map((member) => ({
            user_id: member.id,
            amount: parseFloat(equalAmount),
            percentage: null,
          }))
        );
      } else if (splitType === 'exact' && splits.length === 0) {
        setSplits(
          group.members.map((member) => ({
            user_id: member.id,
            amount: 0,
            percentage: null,
          }))
        );
      } else if (splitType === 'percentage' && splits.length === 0) {
        setSplits(
          group.members.map((member) => ({
            user_id: member.id,
            amount: 0,
            percentage: 0,
          }))
        );
      }
    }
  }, [splitType, amount, group?.members]);

  useEffect(() => {
    if (splitType === 'percentage' && amount) {
      const totalAmount = parseFloat(amount);
      setSplits((prev) =>
        prev.map((split) => ({
          ...split,
          amount: (totalAmount * (split.percentage || 0)) / 100,
        }))
      );
    }
  }, [splitType, amount]);

  const handleSplitChange = (userId, field, value) => {
    setSplits((prev) =>
      prev.map((split) => {
        if (split.user_id === userId) {
          if (field === 'percentage') {
            const percentage = parseFloat(value) || 0;
            const newAmount = amount ? (parseFloat(amount) * percentage) / 100 : 0;
            return { ...split, percentage, amount: newAmount };
          } else {
            return { ...split, amount: parseFloat(value) || 0 };
          }
        }
        return split;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paidBy) {
      showToast('Please select who paid');
      return;
    }

    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
      showToast(`Split total (${formatCurrency(totalSplit, group?.currency)}) does not match expense amount`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        amount: parseFloat(amount),
        paid_by: parseInt(paidBy),
        split_type: splitType,
        splits: splits.filter((s) => s.amount > 0),
      });
      setTitle('');
      setAmount('');
      setPaidBy('');
      setSplitType('equal');
      setSplits([]);
    } catch (error) {
      const data = error.response?.data;
      const message = error.userMessage
        || (data?.errors?.length ? data.errors.map((e) => e.msg || e.message).join(', ') : null)
        || data?.error
        || 'Failed to create expense';
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paid By
            </label>
            <select
              required
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a member</option>
              {group?.members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Split Type
            </label>
            <select
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="equal">Equal</option>
              <option value="exact">Exact Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Split Details
            </label>
            <div className="space-y-2">
              {splits.map((split) => {
                const member = group?.members?.find((m) => m.id === split.user_id);
                return (
                  <div key={split.user_id} className="flex items-center space-x-2">
                    <span className="w-32 text-sm text-gray-900 dark:text-white">{member?.name}:</span>
                    {splitType === 'percentage' ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={split.percentage || 0}
                        onChange={(e) =>
                          handleSplitChange(split.user_id, 'percentage', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="%"
                      />
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount || 0}
                        onChange={(e) =>
                          handleSplitChange(split.user_id, 'amount', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0.00"
                      />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                      {formatCurrency(split.amount ?? 0, group?.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Total: {formatCurrency(splits.reduce((sum, s) => sum + s.amount, 0), group?.currency)} / {formatCurrency(amount || 0, group?.currency)}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
