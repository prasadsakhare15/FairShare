import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserGroups, createGroup } from '../services/groupService';
import { getBalanceSummary } from '../services/userService';
import { getUnreadCount } from '../services/notificationService';
import { formatCurrency } from '../utils/formatUtils';
import ThemeToggle from '../components/ThemeToggle';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('INR');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const [groupsData, summaryData, unreadData] = await Promise.all([
        getUserGroups(),
        getBalanceSummary(),
        getUnreadCount().catch(() => ({ unreadCount: 0 })),
      ]);
      setGroups(groupsData);
      setBalanceSummary(summaryData);
      setUnreadNotifications(unreadData.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createGroup(groupName, groupDescription, groupCurrency);
      setGroupName('');
      setGroupDescription('');
      setGroupCurrency('INR');
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <SkeletonLoader className="h-8 w-24" />
              <div className="flex gap-4">
                <SkeletonLoader className="h-6 w-32" />
                <SkeletonLoader className="h-6 w-16" />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <SkeletonLoader className="h-8 w-40" />
              <SkeletonLoader className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">FairShare</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              <button
                type="button"
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Notifications"
                onClick={() => alert('Notifications feature coming soon!')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                {user?.name || user?.email}
              </button>
              <button
                onClick={logout}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Balance Summary Cards */}
          {balanceSummary && (balanceSummary.youOwe > 0 || balanceSummary.youAreOwed > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card p-5">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You owe</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(balanceSummary.youOwe)}</p>
              </div>
              <div className="card p-5">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You are owed</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(balanceSummary.youAreOwed)}</p>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Groups</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any groups yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create your first group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {group.role === 'admin' ? (
                      <span className="badge badge-blue">Admin</span>
                    ) : (
                      <span className="badge badge-green">Member</span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      by {group.creator_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Weekend Trip"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="input-field resize-none"
                  rows="3"
                  placeholder="Add a description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={groupCurrency}
                  onChange={(e) => setGroupCurrency(e.target.value)}
                  className="input-field"
                >
                  <option value="INR">₹ INR - Indian Rupee</option>
                  <option value="USD">$ USD - US Dollar</option>
                  <option value="EUR">€ EUR - Euro</option>
                  <option value="GBP">£ GBP - British Pound</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setGroupName('');
                    setGroupDescription('');
                    setGroupCurrency('INR');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
