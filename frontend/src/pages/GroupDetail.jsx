import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGroupDetails, addGroupMember, removeGroupMember, updateGroup, deleteGroup, leaveGroup } from '../services/groupService';
import ThemeToggle from '../components/ThemeToggle';
import { getGroupExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { getGroupBalances } from '../services/balanceService';
import { getGroupSettlements, createSettlementRequest, getSettlementRequests, approveSettlementRequest, rejectSettlementRequest, getOptimizedSettlements } from '../services/settlementService';
import { getGroupTimeline } from '../services/timelineService';
import { searchUsers } from '../services/userService';
import { formatCurrency } from '../utils/formatUtils';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';

const GroupDetail = () => {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [settlementRequests, setSettlementRequests] = useState({ pendingForApproval: [], myRequests: [] });
  const [optimizedSettlements, setOptimizedSettlements] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    try {
      const groupData = await getGroupDetails(id);
      setGroup(groupData);
      await Promise.all([
        loadExpenses(),
        loadBalances(),
        loadSettlements(),
        loadSettlementRequests(),
        loadTimeline()
      ]);
    } catch (error) {
      console.error('Failed to load group:', error);
      showToast('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await getGroupExpenses(id);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const loadBalances = async () => {
    try {
      const data = await getGroupBalances(id);
      setBalances(data);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const loadSettlements = async () => {
    try {
      const data = await getGroupSettlements(id);
      setSettlements(data);
    } catch (error) {
      console.error('Failed to load settlements:', error);
    }
  };

  const loadSettlementRequests = async () => {
    try {
      const data = await getSettlementRequests(id);
      setSettlementRequests(data);
    } catch (error) {
      console.error('Failed to load settlement requests:', error);
    }
  };

  const loadTimeline = async () => {
    try {
      const data = await getGroupTimeline(id);
      setTimeline(data);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
  };

  const loadOptimizedSettlements = async () => {
    try {
      const data = await getOptimizedSettlements(id);
      setOptimizedSettlements(data);
    } catch (error) {
      console.error('Failed to load optimized settlements:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchUsers(query);
      // Filter out existing members
      const memberIds = new Set(group?.members?.map(m => m.id) || []);
      setSearchResults(results.filter(u => !memberIds.has(u.id)));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <SkeletonLoader className="h-8 w-48" />
              <div className="flex gap-4">
                <SkeletonLoader className="h-6 w-24" />
                <SkeletonLoader className="h-6 w-16" />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6">
            <SkeletonLoader className="h-10 w-full mb-6" />
            <div className="space-y-4">
              <SkeletonLoader className="h-32 w-full rounded-lg" />
              <SkeletonLoader className="h-32 w-full rounded-lg" />
              <SkeletonLoader className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!group) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">Group not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{group.name}</h1>
              {group.userRole === 'admin' && (
                <>
                  <button
                    onClick={() => setShowEditGroup(true)}
                    className="text-sm bg-gray-600 dark:bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Edit Group
                  </button>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="text-sm bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700 dark:hover:bg-green-600"
                  >
                    + Add Member
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to leave this group?')) return;
                  try {
                    await leaveGroup(id);
                    navigate('/dashboard');
                  } catch (error) {
                    showToast(error.userMessage || error.response?.data?.error || 'Failed to leave group');
                  }
                }}
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                Leave Group
              </button>
              <span className="text-gray-700 dark:text-gray-300">{user?.name || user?.email}</span>
              <button onClick={logout} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['expenses', 'balances', 'settlements', 'timeline', 'members'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'settlements') {
                      loadOptimizedSettlements();
                      loadSettlementRequests();
                    }
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              group={group}
              onAddExpense={() => setShowAddExpense(true)}
              onEditExpense={(expense) => setExpenseToEdit(expense)}
              onDeleteExpense={async (expenseId) => {
                if (!window.confirm('Are you sure you want to delete this expense?')) return;
                await deleteExpense(id, expenseId);
                await loadExpenses();
                await loadBalances();
                await loadTimeline();
              }}
              onExpenseAdded={() => {
                loadExpenses();
                loadBalances();
                loadTimeline();
                setShowAddExpense(false);
              }}
              onExpenseUpdated={() => {
                loadExpenses();
                loadBalances();
                loadTimeline();
                setExpenseToEdit(null);
              }}
            />
          )}

          {activeTab === 'balances' && (
            <BalancesTab
              balances={balances}
              group={group}
              onSettleUp={() => setShowSettleUp(true)}
              onSettlementAdded={() => {
                loadBalances();
                loadSettlements();
                loadTimeline();
                setShowSettleUp(false);
              }}
            />
          )}

          {activeTab === 'settlements' && (
            <SettlementsTab
              settlements={settlements}
              settlementRequests={settlementRequests}
              optimizedSettlements={optimizedSettlements}
              onSettleUp={() => setShowSettleUp(true)}
              onApproveRequest={async (requestId) => {
                await approveSettlementRequest(id, requestId);
                await loadGroupData();
              }}
              onRejectRequest={async (requestId) => {
                await rejectSettlementRequest(id, requestId);
                await loadSettlementRequests();
              }}
            />
          )}

          {activeTab === 'timeline' && <TimelineTab timeline={timeline} group={group} />}

          {activeTab === 'members' && (
            <MembersTab
              group={group}
              currentUserId={user?.id ?? user?.userId}
              onAddMember={() => setShowAddMember(true)}
              onRemoveMember={async (userId) => {
                await removeGroupMember(id, userId);
                await loadGroupData();
              }}
            />
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showAddExpense && !expenseToEdit && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onSubmit={async (expenseData) => {
            await createExpense(id, expenseData);
            await loadExpenses();
            await loadBalances();
            await loadTimeline();
            setShowAddExpense(false);
          }}
        />
      )}
      {expenseToEdit && (
        <AddExpenseModal
          group={group}
          expense={expenseToEdit}
          onClose={() => setExpenseToEdit(null)}
          onSubmit={async (expenseData) => {
            await updateExpense(id, expenseToEdit.id, expenseData);
            await loadExpenses();
            await loadBalances();
            await loadTimeline();
            setExpenseToEdit(null);
          }}
        />
      )}

      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onSave={async (groupData) => {
            await updateGroup(id, groupData);
            await loadGroupData();
            setShowEditGroup(false);
          }}
          onDelete={async () => {
            if (!window.confirm('Are you sure? This will permanently delete the group and all its expenses. This cannot be undone.')) return;
            await deleteGroup(id);
            navigate('/dashboard');
          }}
        />
      )}

      {/* Settle Up Modal */}
      {showSettleUp && (
        <SettleUpModal
          balances={balances}
          group={group}
          onClose={() => setShowSettleUp(false)}
          onSubmit={async (requestData) => {
            await createSettlementRequest(id, requestData);
            await loadSettlementRequests();
            setShowSettleUp(false);
            showToast('Settlement request sent. The other party will need to approve it.');
          }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          group={group}
          searchResults={searchResults}
          onSearch={handleSearchUsers}
          onClose={() => {
            setShowAddMember(false);
            setMemberSearch('');
            setSearchResults([]);
          }}
          onMemberAdded={async () => {
            await loadGroupData();
            setShowAddMember(false);
            setMemberSearch('');
            setSearchResults([]);
          }}
        />
      )}
    </div>
  );
};

// Expenses Tab Component
const ExpensesTab = ({ expenses, group, onAddExpense, onEditExpense, onDeleteExpense, onExpenseAdded, onExpenseUpdated }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses</h2>
        <button
          onClick={onAddExpense}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Add Expense
        </button>
      </div>
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No expenses yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{expense.title}</h3>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditExpense(expense)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Paid by {expense.paid_by_name} • Split: {expense.split_type}
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split details:</p>
                <ul className="space-y-1">
                  {expense.splits?.map((split) => (
                    <li key={split.user_id} className="text-sm text-gray-600 dark:text-gray-400">
                      {split.user_name}: {formatCurrency(split.amount)}
                      {split.percentage && ` (${split.percentage}%)`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Balances Tab Component
const BalancesTab = ({ balances, group, onSettleUp, onSettlementAdded }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Balances</h2>
        <button
          onClick={onSettleUp}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Settle Up
        </button>
      </div>
      {balances.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">All settled up! No balances.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {balances.map((balance) => (
            <div key={balance.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6">
              <p className="text-lg text-gray-900 dark:text-white">
                <span className="font-semibold">{balance.from_user_name}</span> owes{' '}
                <span className="font-semibold">{balance.to_user_name}</span>
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(balance.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Settlements Tab Component
const SettlementsTab = ({ settlements, settlementRequests, optimizedSettlements, onSettleUp, onApproveRequest, onRejectRequest }) => {
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState(null);
  const { pendingForApproval = [], myRequests = [] } = settlementRequests || {};

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await onApproveRequest(requestId);
      showToast('Settlement approved and verified successfully');
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this settlement request?')) return;
    setProcessingId(requestId);
    try {
      await onRejectRequest(requestId);
      showToast('Settlement request rejected');
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settlements</h2>
        <button
          onClick={onSettleUp}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Settle Up
        </button>
      </div>

      {pendingForApproval.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Approval</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            These settlement requests need your approval:
          </p>
          <div className="space-y-4">
            {pendingForApproval.map((request) => (
              <div key={request.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-lg text-gray-900 dark:text-white">
                  <span className="font-semibold">{request.initiator_name}</span> requested:{' '}
                  <span className="font-semibold">{request.from_user_name}</span> paid{' '}
                  <span className="font-semibold">{request.to_user_name}</span>
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(request.amount)}
                </p>
                {request.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Notes: {request.notes}</p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                  >
                    {processingId === request.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
                  >
                    {processingId === request.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">My Settlement Requests</h2>
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 ${
                  request.status === 'pending'
                    ? 'border-amber-300 dark:border-amber-700'
                    : request.status === 'approved'
                    ? 'border-green-300 dark:border-green-700'
                    : 'border-red-300 dark:border-red-700'
                }`}
              >
                <p className="text-lg text-gray-900 dark:text-white">
                  <span className="font-semibold">{request.from_user_name}</span> paid{' '}
                  <span className="font-semibold">{request.to_user_name}</span>{' '}
                  {formatCurrency(request.amount)}
                </p>
                <p className="text-sm mt-2">
                  {request.status === 'pending' && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Waiting for approval from the other party
                    </span>
                  )}
                  {request.status === 'approved' && (
                    <span className="text-green-600 dark:text-green-400">Approved and verified</span>
                  )}
                  {request.status === 'rejected' && (
                    <span className="text-red-600 dark:text-red-400">Rejected</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Optimized Settlement Suggestions</h2>
        {optimizedSettlements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No settlement suggestions. All balances are settled.</p>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              These are optimized suggestions to minimize the number of transactions:
            </p>
            <div className="space-y-3">
              {optimizedSettlements.map((suggestion, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {suggestion.from_user_name} should pay {suggestion.to_user_name}
                  </p>
                  <p className="text-lg text-green-600 dark:text-green-400 font-bold">
                    {formatCurrency(suggestion.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Settlement History</h2>
        {settlements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No settlements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map((settlement) => (
              <div key={settlement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6">
                <p className="text-lg text-gray-900 dark:text-white">
                  <span className="font-semibold">{settlement.from_user_name}</span> paid{' '}
                  <span className="font-semibold">{settlement.to_user_name}</span>
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(settlement.amount)}
                </p>
                {settlement.payment_method && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Method: {settlement.payment_method}
                  </p>
                )}
                {settlement.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Notes: {settlement.notes}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Recorded by {settlement.created_by_name} on{' '}
                  {new Date(settlement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ timeline, group }) => {
  const groupByDate = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const groupedTimeline = groupByDate(timeline);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Activity Timeline</h2>
      {timeline.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTimeline).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{date}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-4 border-l-4 ${
                      item.type === 'expense'
                        ? 'border-blue-500 dark:border-blue-400'
                        : 'border-green-500 dark:border-green-400'
                    }`}
                  >
                    {item.type === 'expense' ? (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg text-gray-900 dark:text-white">{item.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Paid by {item.paid_by_name}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                        {item.splits && item.splits.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Split among: {item.splits.map(s => s.user_name).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-lg text-gray-900 dark:text-white">
                          {item.from_user_name} paid {item.to_user_name}
                        </p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(item.amount)}
                        </p>
                        {item.payment_method && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Method: {item.payment_method}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Members Tab Component
const MembersTab = ({ group, currentUserId, onAddMember, onRemoveMember }) => {
  const { showToast } = useToast();
  const [removing, setRemoving] = useState(null);

  const handleRemove = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setRemoving(memberId);
    try {
      await onRemoveMember(memberId);
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members</h2>
        {group?.userRole === 'admin' && (
          <button
            onClick={onAddMember}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add Member
          </button>
        )}
      </div>
      <div className="space-y-4">
        {group?.members?.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700 p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                  member.role === 'admin'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {member.role}
              </span>
            </div>
            {group?.userRole === 'admin' && member.id !== currentUserId && (
              <button
                onClick={() => handleRemove(member.id)}
                disabled={removing === member.id}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
              >
                {removing === member.id ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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
      showToast(`Split total (${formatCurrency(totalSplit)}) does not match expense amount`);
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
                      {formatCurrency(split.amount ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Total: {formatCurrency(splits.reduce((sum, s) => sum + s.amount, 0))} / {formatCurrency(amount || 0)}
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
                      {member?.name} ({formatCurrency(balance.amount)})
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

// Add Member Modal Component
const AddMemberModal = ({ group, searchResults, onSearch, onClose, onMemberAdded }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddMember = async (userId) => {
    setAdding(true);
    try {
      await addGroupMember(group.id, userId);
      await onMemberAdded();
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Member</h3>
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Search by name or email..."
          />
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => handleAddMember(user.id)}
                  disabled={adding}
                  className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Group Modal Component
const EditGroupModal = ({ group, onClose, onSave, onDelete }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(group?.name ?? '');
    setDescription(group?.description ?? '');
  }, [group?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, description });
    } catch (error) {
      alert(error.userMessage || error.response?.data?.error || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Group</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Weekend Trip"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Add a description..."
            />
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Group'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupDetail;
