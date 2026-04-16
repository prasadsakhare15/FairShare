import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatUtils';
import { useToast } from '../../context/ToastContext';

// Settle Up Modal Component
const SettleUpModal = ({ balances, group, onClose, onSubmit }) => {
  const { showToast } = useToast();
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableBalances = balances.filter((b) => b.from_user_id === parseInt(fromUserId));

  useEffect(() => {
    if (fromUserId && toUserId) {
      const balance = balances.find(
        (b) => b.from_user_id === parseInt(fromUserId) && b.to_user_id === parseInt(toUserId)
      );
      if (balance) {
        setAmount(parseFloat(balance.amount).toFixed(2));
      }
    }
  }, [fromUserId, toUserId, balances]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromUserId || !toUserId || !amount) {
      showToast('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        from_user_id: parseInt(fromUserId),
        to_user_id: parseInt(toUserId),
        amount: parseFloat(amount),
        payment_method: paymentMethod || null,
        notes: notes || null,
      });
      setFromUserId('');
      setToUserId('');
      setAmount('');
      setPaymentMethod('');
      setNotes('');
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to create settlement request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Settle Up</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who is paying?
            </label>
            <select
              required
              value={fromUserId}
              onChange={(e) => {
                setFromUserId(e.target.value);
                setToUserId('');
                setAmount('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select payer</option>
              {group?.members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {fromUserId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Paying to
              </label>
              <select
                required
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select receiver</option>
                {availableBalances.map((balance) => {
                  const member = group?.members?.find((m) => m.id === balance.to_user_id);
                  return (
                    <option key={balance.to_user_id} value={balance.to_user_id}>
                      {member?.name} ({formatCurrency(balance.amount, group?.currency)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

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
              Payment Method (optional)
            </label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="e.g., Cash, Venmo, Bank Transfer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows="3"
              placeholder="Add any notes..."
            />
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
              {submitting ? 'Recording...' : 'Record Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleUpModal;
