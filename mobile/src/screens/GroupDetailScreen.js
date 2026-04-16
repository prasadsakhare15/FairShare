import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, RefreshControl,
  Animated, PanResponder, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getGroupDetails, addGroupMember, removeGroupMember,
  updateGroup, deleteGroup, leaveGroup,
} from '../services/groupService';
import {
  getGroupExpenses, createExpense, updateExpense, deleteExpense,
} from '../services/expenseService';
import { getGroupBalances } from '../services/balanceService';
import {
  getGroupSettlements, createSettlementRequest, getSettlementRequests,
  approveSettlementRequest, rejectSettlementRequest, getOptimizedSettlements,
} from '../services/settlementService';
import { getGroupTimeline } from '../services/timelineService';
import { searchUsers } from '../services/userService';
import { formatCurrency } from '../utils/formatUtils';
import { colors, spacing, radius, shadow, typography } from '../theme';

import AddExpenseModal from '../components/modals/AddExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import EditGroupModal from '../components/modals/EditGroupModal';


const TABS = [
  { key: 'expenses', label: 'Expenses', icon: '💳' },
  { key: 'balances', label: 'Balances', icon: '⚖️' },
  { key: 'settlements', label: 'Settlements', icon: '✅' },
  { key: 'timeline', label: 'Timeline', icon: '📋' },
  { key: 'members', label: 'Members', icon: '👥' },
];

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [settlementRequests, setSettlementRequests] = useState({ pendingForApproval: [], myRequests: [] });
  const [optimizedSettlements, setOptimizedSettlements] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // ─── Tab tape (all panels always mounted, single animated value) ──────────────
  const SW = Dimensions.get('window').width;
  const EASE = Easing.out(Easing.cubic);
  const DURATION = 240;

  // tapeX is the horizontal camera position.
  // At rest on tab i: tapeX = -i * SW
  // During drag leftward (going to i+1): tapeX < -i*SW
  const tapeX = useRef(new Animated.Value(0)).current;
  const activeIdxRef = useRef(0); // index into TAB_KEYS, in sync with activeTab

  const TAB_KEYS = TABS.map((t) => t.key);

  /** Animate to a new tab index. Refs update IMMEDIATELY so any interrupt still has correct base. */
  const goToIdx = useCallback((newIdx, newKey) => {
    // ⚡ Update synchronously — before the animation starts.
    // If this animation gets interrupted (stopAnimation in grant), activeIdxRef is still correct.
    activeIdxRef.current = newIdx;
    setActiveTab(newKey);

    Animated.timing(tapeX, {
      toValue: -newIdx * SW,
      duration: DURATION,
      easing: EASE,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only post-navigation side-effects here (data loading)
      if (finished && newKey === 'settlements') {
        loadOptimizedSettlements();
        loadSettlementRequests();
      }
    });
  }, [tapeX, SW]);

  /** Tab bar tap */
  const switchTab = useCallback((key) => {
    const newIdx = TAB_KEYS.indexOf(key);
    if (newIdx === activeIdxRef.current) return;
    goToIdx(newIdx, key);
  }, [goToIdx]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim only clearly horizontal gestures
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 2.5,

      onPanResponderGrant: () => {
        // Stop any in-progress snap animation
        tapeX.stopAnimation();
      },

      onPanResponderMove: (_, g) => {
        const cur = activeIdxRef.current;
        const base = -cur * SW;
        const atEnd = cur === TAB_KEYS.length - 1;
        const atStart = cur === 0;
        // Rubber-band at the edges (18% resistance)
        if ((g.dx < 0 && atEnd) || (g.dx > 0 && atStart)) {
          tapeX.setValue(base + g.dx * 0.18);
        } else {
          tapeX.setValue(base + g.dx);
        }
      },

      onPanResponderRelease: (_, g) => {
        const cur = activeIdxRef.current;
        const goNext = (g.dx < -50 || g.vx < -0.4) && cur < TAB_KEYS.length - 1;
        const goPrev = (g.dx > 50 || g.vx > 0.4) && cur > 0;

        if (goNext) {
          goToIdx(cur + 1, TAB_KEYS[cur + 1]);
        } else if (goPrev) {
          goToIdx(cur - 1, TAB_KEYS[cur - 1]);
        } else {
          // Snap back to current tab
          Animated.spring(tapeX, {
            toValue: -cur * SW,
            tension: 200,
            friction: 26,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        const cur = activeIdxRef.current;
        Animated.spring(tapeX, {
          toValue: -cur * SW,
          tension: 200,
          friction: 26,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const loadGroupData = async () => {
    try {
      const groupData = await getGroupDetails(groupId);
      setGroup(groupData);
      await Promise.all([
        loadExpenses(), loadBalances(), loadSettlements(),
        loadSettlementRequests(), loadTimeline(),
      ]);
    } catch {
      showToast('Failed to load group data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadExpenses = async () => {
    try { setExpenses(await getGroupExpenses(groupId)); } catch { }
  };
  const loadBalances = async () => {
    try { setBalances(await getGroupBalances(groupId)); } catch { }
  };
  const loadSettlements = async () => {
    try { setSettlements(await getGroupSettlements(groupId)); } catch { }
  };
  const loadSettlementRequests = async () => {
    try { setSettlementRequests(await getSettlementRequests(groupId)); } catch { }
  };
  const loadTimeline = async () => {
    try { setTimeline(await getGroupTimeline(groupId)); } catch { }
  };
  const loadOptimizedSettlements = async () => {
    try { setOptimizedSettlements(await getOptimizedSettlements(groupId)); } catch { }
  };

  useEffect(() => { loadGroupData(); }, [groupId]);

  const onRefresh = () => { setRefreshing(true); loadGroupData(); };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try { await leaveGroup(groupId); navigation.goBack(); }
          catch (e) { showToast(e.userMessage || 'Failed to leave group', 'error'); }
        }
      },
    ]);
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert('Delete Expense', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteExpense(groupId, expenseId);
            loadExpenses(); loadBalances(); loadTimeline();
            showToast('Expense deleted', 'success');
          } catch (e) { showToast(e.userMessage || 'Failed to delete', 'error'); }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadText}>Loading group…</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={s.loadText}>Group not found</Text>
      </SafeAreaView>
    );
  }

  const currentUserId = user?.id ?? user?.userId;
  const isAdmin = group.userRole === 'admin';

  return (
    <>
      <SafeAreaView style={s.safeArea}>
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={handleLeaveGroup} style={s.headerLeaveBtn}>
              <Text style={s.headerLeaveText}>Leave</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={s.headerBtn} onPress={() => setShowEditGroup(true)}>
                <Text style={s.headerBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Tab bar ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarInner}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => switchTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Content: tape layout — all tabs always mounted, single tapeX ── */}
        <View style={s.tabContentArea} {...panResponder.panHandlers}>
          {TABS.map((tab, i) => (
            <Animated.View
              key={tab.key}
              style={[s.tabPanel, { left: i * SW, transform: [{ translateX: tapeX }] }]}
            >
              <ScrollView
                style={s.content}
                contentContainerStyle={s.contentInner}
                showsVerticalScrollIndicator={false}
                scrollEnabled={activeTab === tab.key}
                refreshControl={
                  tab.key === 'expenses'
                    ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    : undefined
                }
              >
                {tab.key === 'expenses' && (
                  <ExpensesTab
                    expenses={expenses}
                    group={group}
                    onAdd={() => setShowAddExpense(true)}
                    onEdit={setExpenseToEdit}
                    onDelete={handleDeleteExpense}
                  />
                )}
                {tab.key === 'balances' && (
                  <BalancesTab balances={balances} onSettleUp={() => setShowSettleUp(true)} />
                )}
                {tab.key === 'settlements' && (
                  <SettlementsTab
                    settlements={settlements}
                    settlementRequests={settlementRequests}
                    optimizedSettlements={optimizedSettlements}
                    onSettleUp={() => setShowSettleUp(true)}
                    onApprove={async (id) => {
                      try { await approveSettlementRequest(groupId, id); loadGroupData(); showToast('Settlement approved! 🎉', 'success'); }
                      catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                    }}
                    onReject={async (id) => {
                      try { await rejectSettlementRequest(groupId, id); loadSettlementRequests(); showToast('Request rejected', 'error'); }
                      catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                    }}
                  />
                )}
                {tab.key === 'timeline' && <TimelineTab timeline={timeline} />}
                {tab.key === 'members' && (
                  <MembersTab
                    group={group}
                    currentUserId={currentUserId}
                    onAddMember={() => setShowAddMember(true)}
                    onRemoveMember={async (userId) => {
                      Alert.alert('Remove Member', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove', style: 'destructive', onPress: async () => {
                            try { await removeGroupMember(groupId, userId); loadGroupData(); showToast('Member removed', 'success'); }
                            catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                          }
                        },
                      ]);
                    }}
                    showToast={showToast}
                  />
                )}
              </ScrollView>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Modals ── */}
      {(showAddExpense && !expenseToEdit) && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onSubmit={async (data) => {
            await createExpense(groupId, data);
            loadExpenses(); loadBalances(); loadTimeline();
            setShowAddExpense(false);
            showToast('Expense added! 💳', 'success');
          }}
          showToast={showToast}
        />
      )}
      {expenseToEdit && (
        <AddExpenseModal
          group={group}
          expense={expenseToEdit}
          onClose={() => setExpenseToEdit(null)}
          onSubmit={async (data) => {
            await updateExpense(groupId, expenseToEdit.id, data);
            loadExpenses(); loadBalances(); loadTimeline();
            setExpenseToEdit(null);
            showToast('Expense updated!', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showSettleUp && (
        <SettleUpModal
          balances={balances}
          group={group}
          onClose={() => setShowSettleUp(false)}
          onSubmit={async (data) => {
            await createSettlementRequest(groupId, data);
            loadSettlementRequests();
            setShowSettleUp(false);
            showToast('Settlement request sent ✅', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          group={group}
          searchResults={searchResults}
          onSearch={async (q) => {
            if (q.length < 2) { setSearchResults([]); return; }
            const results = await searchUsers(q);
            const memberIds = new Set(group?.members?.map((m) => m.id) || []);
            setSearchResults(results.filter((u) => !memberIds.has(u.id)));
          }}
          onClose={() => { setShowAddMember(false); setSearchResults([]); }}
          onMemberAdded={async (userId) => {
            await addGroupMember(groupId, userId);
            loadGroupData();
            setShowAddMember(false);
            setSearchResults([]);
            showToast('Member added!', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onSave={async (data) => { await updateGroup(groupId, data); loadGroupData(); setShowEditGroup(false); showToast('Group updated!', 'success'); }}
          onDelete={async () => {
            Alert.alert('Delete Group', 'This will permanently delete the group and all its data. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Forever', style: 'destructive', onPress: async () => {
                  await deleteGroup(groupId); navigation.goBack();
                }
              },
            ]);
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

// ─── Tab Contents ─────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, group, onAdd, onEdit, onDelete }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Expenses</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onAdd} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <EmptyCard icon="💳" text="No expenses yet. Add one to get started!" />
      ) : expenses.map((exp) => (
        <View key={exp.id} style={s.card}>
          <View style={s.cardRow}>
            <View style={s.expenseIconBox}>
              <Text style={s.expenseIcon}>💳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{exp.title}</Text>
              <Text style={s.cardMeta}>Paid by {exp.paid_by_name} · {exp.split_type}</Text>
              {exp.splits?.length > 0 && (
                <Text style={s.splitsText} numberOfLines={2}>
                  {exp.splits.map((sp) => `${sp.user_name}: ${formatCurrency(sp.amount, group?.currency)}`).join(' · ')}
                </Text>
              )}
            </View>
            <Text style={s.cardAmount}>{formatCurrency(exp.amount, group?.currency)}</Text>
          </View>
          <View style={s.cardFooter}>
            <Text style={s.cardDate}>{new Date(exp.created_at).toLocaleDateString()}</Text>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => onEdit(exp)} style={s.actionBtn}>
                <Text style={s.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(exp.id)} style={s.actionBtn}>
                <Text style={s.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function BalancesTab({ balances, onSettleUp }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Balances</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onSettleUp} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Settle Up</Text>
        </TouchableOpacity>
      </View>
      {balances.length === 0 ? (
        <EmptyCard icon="🎉" text="All settled up! No outstanding balances." />
      ) : balances.map((b) => (
        <View key={b.id} style={[s.card, s.balanceCard]}>
          <View style={s.balanceRow}>
            <View style={s.avatarSmall}>
              <Text style={s.avatarSmallText}>{b.from_user_name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
              <Text style={s.cardTitle}>
                <Text style={{ color: colors.oweRed }}>{b.from_user_name}</Text>
                <Text style={{ color: colors.textSecondary }}> owes </Text>
                <Text style={{ color: colors.owedGreen }}>{b.to_user_name}</Text>
              </Text>
            </View>
            <View style={s.amountBadge}>
              <Text style={s.amountBadgeText}>{formatCurrency(b.amount, group?.currency)}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function SettlementsTab({ settlements, settlementRequests, optimizedSettlements, onSettleUp, onApprove, onReject }) {
  const { pendingForApproval = [], myRequests = [] } = settlementRequests;
  const [processingId, setProcessingId] = useState(null);

  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Settlements</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onSettleUp} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Settle Up</Text>
        </TouchableOpacity>
      </View>

      {pendingForApproval.length > 0 && (
        <View style={s.section}>
          <SectionLabel icon="⏳" label="Pending Your Approval" />
          {pendingForApproval.map((req) => (
            <View key={req.id} style={[s.card, s.pendingCard]}>
              <Text style={s.pendingInitiator}>Requested by {req.initiator_name}</Text>
              <Text style={s.cardTitle}>
                {req.from_user_name} → {req.to_user_name}
              </Text>
              <Text style={s.pendingAmount}>{formatCurrency(req.amount, group?.currency)}</Text>
              <View style={s.pendingActions}>
                <TouchableOpacity
                  style={[s.approveBtn, processingId === req.id && { opacity: 0.6 }]}
                  disabled={processingId === req.id}
                  onPress={async () => { setProcessingId(req.id); await onApprove(req.id); setProcessingId(null); }}
                >
                  <Text style={s.approveBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.rejectBtn, processingId === req.id && { opacity: 0.6 }]}
                  disabled={processingId === req.id}
                  onPress={async () => { setProcessingId(req.id); await onReject(req.id); setProcessingId(null); }}
                >
                  <Text style={s.rejectBtnText}>✗ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {myRequests.length > 0 && (
        <View style={s.section}>
          <SectionLabel icon="📤" label="My Requests" />
          {myRequests.map((req) => (
            <View key={req.id} style={s.card}>
              <Text style={s.cardTitle}>{req.from_user_name} → {req.to_user_name}</Text>
              <Text style={s.cardMeta}>{formatCurrency(req.amount, group?.currency)}</Text>
              <View style={[s.statusPill,
              req.status === 'approved' ? s.statusApproved :
                req.status === 'rejected' ? s.statusRejected : s.statusPending
              ]}>
                <Text style={[s.statusText,
                req.status === 'approved' ? { color: colors.owedGreen } :
                  req.status === 'rejected' ? { color: colors.oweRed } : { color: colors.warning }
                ]}>
                  {req.status === 'approved' ? '✓ Approved' : req.status === 'rejected' ? '✗ Rejected' : '⏳ Awaiting approval'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.section}>
        <SectionLabel icon="💡" label="Optimized Suggestions" />
        {optimizedSettlements.length === 0 ? (
          <EmptyCard icon="✨" text="No suggestions — everything is balanced!" />
        ) : optimizedSettlements.map((opt, i) => (
          <View key={i} style={[s.card, s.optCard]}>
            <Text style={s.cardTitle}>{opt.from_user_name} should pay {opt.to_user_name}</Text>
            <Text style={[s.cardAmount, { color: colors.owedGreen }]}>{formatCurrency(opt.amount, group?.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <SectionLabel icon="📜" label="Settlement History" />
        {settlements.length === 0 ? (
          <EmptyCard icon="📋" text="No completed settlements yet." />
        ) : settlements.map((sett) => (
          <View key={sett.id} style={s.card}>
            <View style={s.cardRow}>
              <View style={s.settleIconBox}>
                <Text style={s.settleIcon}>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{sett.from_user_name} paid {sett.to_user_name}</Text>
                <Text style={s.cardMeta}>Recorded by {sett.created_by_name} · {new Date(sett.created_at).toLocaleDateString()}</Text>
                {sett.payment_method ? <Text style={s.cardMeta}>via {sett.payment_method}</Text> : null}
              </View>
              <Text style={[s.cardAmount, { color: colors.owedGreen }]}>{formatCurrency(sett.amount, group?.currency)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimelineTab({ timeline }) {
  const grouped = {};
  timeline.forEach((item) => {
    const d = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  return (
    <View>
      <Text style={[s.tabTitle, { marginBottom: spacing.lg }]}>Activity Timeline</Text>
      {timeline.length === 0 ? (
        <EmptyCard icon="📋" text="No activity yet." />
      ) : Object.entries(grouped).map(([date, items]) => (
        <View key={date} style={s.section}>
          <Text style={s.dateHeader}>{date}</Text>
          {items.map((item) => (
            <View
              key={`${item.type}-${item.id}`}
              style={[s.card, { borderLeftWidth: 3, borderLeftColor: item.type === 'expense' ? colors.primary : colors.success }]}
            >
              <View style={s.cardRow}>
                <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
                  {item.type === 'expense' ? '💳' : '✅'}
                </Text>
                <View style={{ flex: 1 }}>
                  {item.type === 'expense' ? (
                    <>
                      <Text style={s.cardTitle}>{item.title}</Text>
                      <Text style={s.cardMeta}>Paid by {item.paid_by_name}</Text>
                    </>
                  ) : (
                    <Text style={s.cardTitle}>{item.from_user_name} paid {item.to_user_name}</Text>
                  )}
                  <Text style={s.timeText}>{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[s.cardAmount, item.type === 'settlement' && { color: colors.owedGreen }]}>
                  {formatCurrency(item.amount, group?.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MembersTab({ group, currentUserId, onAddMember, onRemoveMember, showToast }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Members</Text>
        {group?.userRole === 'admin' && (
          <TouchableOpacity style={s.primaryBtn} onPress={onAddMember} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {group?.members?.map((m) => (
        <View key={m.id} style={[s.card, s.memberCard]}>
          <View style={s.memberAvatar}>
            <Text style={s.memberAvatarText}>{m.name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{m.name}</Text>
            <Text style={s.cardMeta}>{m.email}</Text>
            <View style={[s.roleBadge, m.role === 'admin' && s.roleBadgeAdmin]}>
              <Text style={[s.roleBadgeText, m.role === 'admin' && s.roleBadgeTextAdmin]}>
                {m.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </Text>
            </View>
          </View>
          {group.userRole === 'admin' && m.id !== currentUserId && (
            <TouchableOpacity onPress={() => onRemoveMember(m.id)} style={s.removeBtn}>
              <Text style={s.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function EmptyCard({ icon, text }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

function SectionLabel({ icon, label }) {
  return (
    <View style={s.sectionLabelRow}>
      <Text style={s.sectionLabelIcon}>{icon}</Text>
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────




// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadSafe: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadText: { ...typography.body, color: colors.textSecondary },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm, minHeight: 48 },
  backBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  backIcon: { fontSize: 22, color: colors.primary, fontWeight: '600', marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  headerBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  headerBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  headerLeaveBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  headerLeaveText: { ...typography.caption, color: colors.warning, fontWeight: '600' },

  tabBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 40 },
  tabBarInner: { paddingHorizontal: spacing.sm, paddingVertical: 0, alignItems: 'center' },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', height: 40, justifyContent: 'center' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  // Tape layout — all tab panels always mounted
  tabContentArea: { flex: 1, overflow: 'hidden' },
  tabPanel: { position: 'absolute', top: 0, bottom: 0, width: Dimensions.get('window').width },

  content: { flex: 1, backgroundColor: colors.background },
  contentInner: { padding: spacing.lg, paddingBottom: 40 },

  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  tabTitle: { ...typography.h2, color: colors.textPrimary },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, ...shadow.sm },
  primaryBtnText: { ...typography.bodySmall, color: colors.textOnPrimary, fontWeight: '700' },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 2 },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardAmount: { ...typography.h3, color: colors.primary, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  cardDate: { ...typography.caption, color: colors.textTertiary },
  cardActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  actionEdit: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  actionDelete: { ...typography.caption, color: colors.error, fontWeight: '600' },
  splitsText: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },

  expenseIconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  expenseIcon: { fontSize: 20 },

  balanceCard: { padding: spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  amountBadge: { backgroundColor: colors.oweRedBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.oweRedBorder },
  amountBadgeText: { ...typography.bodySmall, color: colors.oweRed, fontWeight: '700' },

  section: { marginBottom: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  sectionLabelIcon: { fontSize: 14 },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },

  pendingCard: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  pendingInitiator: { ...typography.caption, color: colors.warning, fontWeight: '600', marginBottom: spacing.xs },
  pendingAmount: { ...typography.h2, color: colors.textPrimary, fontWeight: '800', marginVertical: spacing.sm },
  pendingActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  approveBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.success, alignItems: 'center' },
  approveBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.error, alignItems: 'center' },
  rejectBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },

  statusPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, marginTop: spacing.sm, borderWidth: 1 },
  statusApproved: { backgroundColor: colors.owedGreenBg, borderColor: colors.owedGreenBorder },
  statusRejected: { backgroundColor: colors.oweRedBg, borderColor: colors.oweRedBorder },
  statusPending: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  statusText: { ...typography.caption, fontWeight: '600' },

  optCard: { borderLeftWidth: 3, borderLeftColor: colors.success },
  settleIconBox: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.owedGreenBg, justifyContent: 'center', alignItems: 'center' },
  settleIcon: { fontSize: 18 },

  dateHeader: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, marginBottom: spacing.sm },
  timeText: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },

  memberCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberAvatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  roleBadge: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.background },
  roleBadgeAdmin: { backgroundColor: colors.primaryLight },
  roleBadgeText: { ...typography.caption, color: colors.textSecondary },
  roleBadgeTextAdmin: { color: colors.primary, fontWeight: '600' },
  removeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.errorBorder },
  removeBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },

  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 32, marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

ort React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, RefreshControl,
  Animated, PanResponder, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getGroupDetails, addGroupMember, removeGroupMember,
  updateGroup, deleteGroup, leaveGroup,
} from '../services/groupService';
import {
  getGroupExpenses, createExpense, updateExpense, deleteExpense,
} from '../services/expenseService';
import { getGroupBalances } from '../services/balanceService';
import {
  getGroupSettlements, createSettlementRequest, getSettlementRequests,
  approveSettlementRequest, rejectSettlementRequest, getOptimizedSettlements,
} from '../services/settlementService';
import { getGroupTimeline } from '../services/timelineService';
import { searchUsers } from '../services/userService';
import { formatCurrency } from '../utils/formatUtils';
import { colors, spacing, radius, shadow, typography } from '../theme';

import AddExpenseModal from '../components/modals/AddExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import EditGroupModal from '../components/modals/EditGroupModal';


const TABS = [
  { key: 'expenses', label: 'Expenses', icon: '💳' },
  { key: 'balances', label: 'Balances', icon: '⚖️' },
  { key: 'settlements', label: 'Settlements', icon: '✅' },
  { key: 'timeline', label: 'Timeline', icon: '📋' },
  { key: 'members', label: 'Members', icon: '👥' },
];

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [settlementRequests, setSettlementRequests] = useState({ pendingForApproval: [], myRequests: [] });
  const [optimizedSettlements, setOptimizedSettlements] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // ─── Tab tape (all panels always mounted, single animated value) ──────────────
  const SW = Dimensions.get('window').width;
  const EASE = Easing.out(Easing.cubic);
  const DURATION = 240;

  // tapeX is the horizontal camera position.
  // At rest on tab i: tapeX = -i * SW
  // During drag leftward (going to i+1): tapeX < -i*SW
  const tapeX = useRef(new Animated.Value(0)).current;
  const activeIdxRef = useRef(0); // index into TAB_KEYS, in sync with activeTab

  const TAB_KEYS = TABS.map((t) => t.key);

  /** Animate to a new tab index. Refs update IMMEDIATELY so any interrupt still has correct base. */
  const goToIdx = useCallback((newIdx, newKey) => {
    // ⚡ Update synchronously — before the animation starts.
    // If this animation gets interrupted (stopAnimation in grant), activeIdxRef is still correct.
    activeIdxRef.current = newIdx;
    setActiveTab(newKey);

    Animated.timing(tapeX, {
      toValue: -newIdx * SW,
      duration: DURATION,
      easing: EASE,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only post-navigation side-effects here (data loading)
      if (finished && newKey === 'settlements') {
        loadOptimizedSettlements();
        loadSettlementRequests();
      }
    });
  }, [tapeX, SW]);

  /** Tab bar tap */
  const switchTab = useCallback((key) => {
    const newIdx = TAB_KEYS.indexOf(key);
    if (newIdx === activeIdxRef.current) return;
    goToIdx(newIdx, key);
  }, [goToIdx]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim only clearly horizontal gestures
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 2.5,

      onPanResponderGrant: () => {
        // Stop any in-progress snap animation
        tapeX.stopAnimation();
      },

      onPanResponderMove: (_, g) => {
        const cur = activeIdxRef.current;
        const base = -cur * SW;
        const atEnd = cur === TAB_KEYS.length - 1;
        const atStart = cur === 0;
        // Rubber-band at the edges (18% resistance)
        if ((g.dx < 0 && atEnd) || (g.dx > 0 && atStart)) {
          tapeX.setValue(base + g.dx * 0.18);
        } else {
          tapeX.setValue(base + g.dx);
        }
      },

      onPanResponderRelease: (_, g) => {
        const cur = activeIdxRef.current;
        const goNext = (g.dx < -50 || g.vx < -0.4) && cur < TAB_KEYS.length - 1;
        const goPrev = (g.dx > 50 || g.vx > 0.4) && cur > 0;

        if (goNext) {
          goToIdx(cur + 1, TAB_KEYS[cur + 1]);
        } else if (goPrev) {
          goToIdx(cur - 1, TAB_KEYS[cur - 1]);
        } else {
          // Snap back to current tab
          Animated.spring(tapeX, {
            toValue: -cur * SW,
            tension: 200,
            friction: 26,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        const cur = activeIdxRef.current;
        Animated.spring(tapeX, {
          toValue: -cur * SW,
          tension: 200,
          friction: 26,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const loadGroupData = async () => {
    try {
      const groupData = await getGroupDetails(groupId);
      setGroup(groupData);
      await Promise.all([
        loadExpenses(), loadBalances(), loadSettlements(),
        loadSettlementRequests(), loadTimeline(),
      ]);
    } catch {
      showToast('Failed to load group data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadExpenses = async () => {
    try { setExpenses(await getGroupExpenses(groupId)); } catch { }
  };
  const loadBalances = async () => {
    try { setBalances(await getGroupBalances(groupId)); } catch { }
  };
  const loadSettlements = async () => {
    try { setSettlements(await getGroupSettlements(groupId)); } catch { }
  };
  const loadSettlementRequests = async () => {
    try { setSettlementRequests(await getSettlementRequests(groupId)); } catch { }
  };
  const loadTimeline = async () => {
    try { setTimeline(await getGroupTimeline(groupId)); } catch { }
  };
  const loadOptimizedSettlements = async () => {
    try { setOptimizedSettlements(await getOptimizedSettlements(groupId)); } catch { }
  };

  useEffect(() => { loadGroupData(); }, [groupId]);

  const onRefresh = () => { setRefreshing(true); loadGroupData(); };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try { await leaveGroup(groupId); navigation.goBack(); }
          catch (e) { showToast(e.userMessage || 'Failed to leave group', 'error'); }
        }
      },
    ]);
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert('Delete Expense', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteExpense(groupId, expenseId);
            loadExpenses(); loadBalances(); loadTimeline();
            showToast('Expense deleted', 'success');
          } catch (e) { showToast(e.userMessage || 'Failed to delete', 'error'); }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadText}>Loading group…</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={s.loadText}>Group not found</Text>
      </SafeAreaView>
    );
  }

  const currentUserId = user?.id ?? user?.userId;
  const isAdmin = group.userRole === 'admin';

  return (
    <>
      <SafeAreaView style={s.safeArea}>
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={handleLeaveGroup} style={s.headerLeaveBtn}>
              <Text style={s.headerLeaveText}>Leave</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={s.headerBtn} onPress={() => setShowEditGroup(true)}>
                <Text style={s.headerBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Tab bar ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarInner}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => switchTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Content: tape layout — all tabs always mounted, single tapeX ── */}
        <View style={s.tabContentArea} {...panResponder.panHandlers}>
          {TABS.map((tab, i) => (
            <Animated.View
              key={tab.key}
              style={[s.tabPanel, { left: i * SW, transform: [{ translateX: tapeX }] }]}
            >
              <ScrollView
                style={s.content}
                contentContainerStyle={s.contentInner}
                showsVerticalScrollIndicator={false}
                scrollEnabled={activeTab === tab.key}
                refreshControl={
                  tab.key === 'expenses'
                    ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    : undefined
                }
              >
                {tab.key === 'expenses' && (
                  <ExpensesTab
                    expenses={expenses}
                    group={group}
                    onAdd={() => setShowAddExpense(true)}
                    onEdit={setExpenseToEdit}
                    onDelete={handleDeleteExpense}
                  />
                )}
                {tab.key === 'balances' && (
                  <BalancesTab balances={balances} onSettleUp={() => setShowSettleUp(true)} />
                )}
                {tab.key === 'settlements' && (
                  <SettlementsTab
                    settlements={settlements}
                    settlementRequests={settlementRequests}
                    optimizedSettlements={optimizedSettlements}
                    onSettleUp={() => setShowSettleUp(true)}
                    onApprove={async (id) => {
                      try { await approveSettlementRequest(groupId, id); loadGroupData(); showToast('Settlement approved! 🎉', 'success'); }
                      catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                    }}
                    onReject={async (id) => {
                      try { await rejectSettlementRequest(groupId, id); loadSettlementRequests(); showToast('Request rejected', 'error'); }
                      catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                    }}
                  />
                )}
                {tab.key === 'timeline' && <TimelineTab timeline={timeline} />}
                {tab.key === 'members' && (
                  <MembersTab
                    group={group}
                    currentUserId={currentUserId}
                    onAddMember={() => setShowAddMember(true)}
                    onRemoveMember={async (userId) => {
                      Alert.alert('Remove Member', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove', style: 'destructive', onPress: async () => {
                            try { await removeGroupMember(groupId, userId); loadGroupData(); showToast('Member removed', 'success'); }
                            catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
                          }
                        },
                      ]);
                    }}
                    showToast={showToast}
                  />
                )}
              </ScrollView>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Modals ── */}
      {(showAddExpense && !expenseToEdit) && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onSubmit={async (data) => {
            await createExpense(groupId, data);
            loadExpenses(); loadBalances(); loadTimeline();
            setShowAddExpense(false);
            showToast('Expense added! 💳', 'success');
          }}
          showToast={showToast}
        />
      )}
      {expenseToEdit && (
        <AddExpenseModal
          group={group}
          expense={expenseToEdit}
          onClose={() => setExpenseToEdit(null)}
          onSubmit={async (data) => {
            await updateExpense(groupId, expenseToEdit.id, data);
            loadExpenses(); loadBalances(); loadTimeline();
            setExpenseToEdit(null);
            showToast('Expense updated!', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showSettleUp && (
        <SettleUpModal
          balances={balances}
          group={group}
          onClose={() => setShowSettleUp(false)}
          onSubmit={async (data) => {
            await createSettlementRequest(groupId, data);
            loadSettlementRequests();
            setShowSettleUp(false);
            showToast('Settlement request sent ✅', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          group={group}
          searchResults={searchResults}
          onSearch={async (q) => {
            if (q.length < 2) { setSearchResults([]); return; }
            const results = await searchUsers(q);
            const memberIds = new Set(group?.members?.map((m) => m.id) || []);
            setSearchResults(results.filter((u) => !memberIds.has(u.id)));
          }}
          onClose={() => { setShowAddMember(false); setSearchResults([]); }}
          onMemberAdded={async (userId) => {
            await addGroupMember(groupId, userId);
            loadGroupData();
            setShowAddMember(false);
            setSearchResults([]);
            showToast('Member added!', 'success');
          }}
          showToast={showToast}
        />
      )}
      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onSave={async (data) => { await updateGroup(groupId, data); loadGroupData(); setShowEditGroup(false); showToast('Group updated!', 'success'); }}
          onDelete={async () => {
            Alert.alert('Delete Group', 'This will permanently delete the group and all its data. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Forever', style: 'destructive', onPress: async () => {
                  await deleteGroup(groupId); navigation.goBack();
                }
              },
            ]);
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

// ─── Tab Contents ─────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, group, onAdd, onEdit, onDelete }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Expenses</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onAdd} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <EmptyCard icon="💳" text="No expenses yet. Add one to get started!" />
      ) : expenses.map((exp) => (
        <View key={exp.id} style={s.card}>
          <View style={s.cardRow}>
            <View style={s.expenseIconBox}>
              <Text style={s.expenseIcon}>💳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{exp.title}</Text>
              <Text style={s.cardMeta}>Paid by {exp.paid_by_name} · {exp.split_type}</Text>
              {exp.splits?.length > 0 && (
                <Text style={s.splitsText} numberOfLines={2}>
                  {exp.splits.map((sp) => `${sp.user_name}: ${formatCurrency(sp.amount, group?.currency)}`).join(' · ')}
                </Text>
              )}
            </View>
            <Text style={s.cardAmount}>{formatCurrency(exp.amount, group?.currency)}</Text>
          </View>
          <View style={s.cardFooter}>
            <Text style={s.cardDate}>{new Date(exp.created_at).toLocaleDateString()}</Text>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => onEdit(exp)} style={s.actionBtn}>
                <Text style={s.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(exp.id)} style={s.actionBtn}>
                <Text style={s.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function BalancesTab({ balances, onSettleUp }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Balances</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onSettleUp} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Settle Up</Text>
        </TouchableOpacity>
      </View>
      {balances.length === 0 ? (
        <EmptyCard icon="🎉" text="All settled up! No outstanding balances." />
      ) : balances.map((b) => (
        <View key={b.id} style={[s.card, s.balanceCard]}>
          <View style={s.balanceRow}>
            <View style={s.avatarSmall}>
              <Text style={s.avatarSmallText}>{b.from_user_name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
              <Text style={s.cardTitle}>
                <Text style={{ color: colors.oweRed }}>{b.from_user_name}</Text>
                <Text style={{ color: colors.textSecondary }}> owes </Text>
                <Text style={{ color: colors.owedGreen }}>{b.to_user_name}</Text>
              </Text>
            </View>
            <View style={s.amountBadge}>
              <Text style={s.amountBadgeText}>{formatCurrency(b.amount, group?.currency)}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function SettlementsTab({ settlements, settlementRequests, optimizedSettlements, onSettleUp, onApprove, onReject }) {
  const { pendingForApproval = [], myRequests = [] } = settlementRequests;
  const [processingId, setProcessingId] = useState(null);

  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Settlements</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onSettleUp} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Settle Up</Text>
        </TouchableOpacity>
      </View>

      {pendingForApproval.length > 0 && (
        <View style={s.section}>
          <SectionLabel icon="⏳" label="Pending Your Approval" />
          {pendingForApproval.map((req) => (
            <View key={req.id} style={[s.card, s.pendingCard]}>
              <Text style={s.pendingInitiator}>Requested by {req.initiator_name}</Text>
              <Text style={s.cardTitle}>
                {req.from_user_name} → {req.to_user_name}
              </Text>
              <Text style={s.pendingAmount}>{formatCurrency(req.amount, group?.currency)}</Text>
              <View style={s.pendingActions}>
                <TouchableOpacity
                  style={[s.approveBtn, processingId === req.id && { opacity: 0.6 }]}
                  disabled={processingId === req.id}
                  onPress={async () => { setProcessingId(req.id); await onApprove(req.id); setProcessingId(null); }}
                >
                  <Text style={s.approveBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.rejectBtn, processingId === req.id && { opacity: 0.6 }]}
                  disabled={processingId === req.id}
                  onPress={async () => { setProcessingId(req.id); await onReject(req.id); setProcessingId(null); }}
                >
                  <Text style={s.rejectBtnText}>✗ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {myRequests.length > 0 && (
        <View style={s.section}>
          <SectionLabel icon="📤" label="My Requests" />
          {myRequests.map((req) => (
            <View key={req.id} style={s.card}>
              <Text style={s.cardTitle}>{req.from_user_name} → {req.to_user_name}</Text>
              <Text style={s.cardMeta}>{formatCurrency(req.amount, group?.currency)}</Text>
              <View style={[s.statusPill,
              req.status === 'approved' ? s.statusApproved :
                req.status === 'rejected' ? s.statusRejected : s.statusPending
              ]}>
                <Text style={[s.statusText,
                req.status === 'approved' ? { color: colors.owedGreen } :
                  req.status === 'rejected' ? { color: colors.oweRed } : { color: colors.warning }
                ]}>
                  {req.status === 'approved' ? '✓ Approved' : req.status === 'rejected' ? '✗ Rejected' : '⏳ Awaiting approval'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.section}>
        <SectionLabel icon="💡" label="Optimized Suggestions" />
        {optimizedSettlements.length === 0 ? (
          <EmptyCard icon="✨" text="No suggestions — everything is balanced!" />
        ) : optimizedSettlements.map((opt, i) => (
          <View key={i} style={[s.card, s.optCard]}>
            <Text style={s.cardTitle}>{opt.from_user_name} should pay {opt.to_user_name}</Text>
            <Text style={[s.cardAmount, { color: colors.owedGreen }]}>{formatCurrency(opt.amount, group?.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <SectionLabel icon="📜" label="Settlement History" />
        {settlements.length === 0 ? (
          <EmptyCard icon="📋" text="No completed settlements yet." />
        ) : settlements.map((sett) => (
          <View key={sett.id} style={s.card}>
            <View style={s.cardRow}>
              <View style={s.settleIconBox}>
                <Text style={s.settleIcon}>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{sett.from_user_name} paid {sett.to_user_name}</Text>
                <Text style={s.cardMeta}>Recorded by {sett.created_by_name} · {new Date(sett.created_at).toLocaleDateString()}</Text>
                {sett.payment_method ? <Text style={s.cardMeta}>via {sett.payment_method}</Text> : null}
              </View>
              <Text style={[s.cardAmount, { color: colors.owedGreen }]}>{formatCurrency(sett.amount, group?.currency)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimelineTab({ timeline }) {
  const grouped = {};
  timeline.forEach((item) => {
    const d = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  return (
    <View>
      <Text style={[s.tabTitle, { marginBottom: spacing.lg }]}>Activity Timeline</Text>
      {timeline.length === 0 ? (
        <EmptyCard icon="📋" text="No activity yet." />
      ) : Object.entries(grouped).map(([date, items]) => (
        <View key={date} style={s.section}>
          <Text style={s.dateHeader}>{date}</Text>
          {items.map((item) => (
            <View
              key={`${item.type}-${item.id}`}
              style={[s.card, { borderLeftWidth: 3, borderLeftColor: item.type === 'expense' ? colors.primary : colors.success }]}
            >
              <View style={s.cardRow}>
                <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
                  {item.type === 'expense' ? '💳' : '✅'}
                </Text>
                <View style={{ flex: 1 }}>
                  {item.type === 'expense' ? (
                    <>
                      <Text style={s.cardTitle}>{item.title}</Text>
                      <Text style={s.cardMeta}>Paid by {item.paid_by_name}</Text>
                    </>
                  ) : (
                    <Text style={s.cardTitle}>{item.from_user_name} paid {item.to_user_name}</Text>
                  )}
                  <Text style={s.timeText}>{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[s.cardAmount, item.type === 'settlement' && { color: colors.owedGreen }]}>
                  {formatCurrency(item.amount, group?.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MembersTab({ group, currentUserId, onAddMember, onRemoveMember, showToast }) {
  return (
    <View>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>Members</Text>
        {group?.userRole === 'admin' && (
          <TouchableOpacity style={s.primaryBtn} onPress={onAddMember} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {group?.members?.map((m) => (
        <View key={m.id} style={[s.card, s.memberCard]}>
          <View style={s.memberAvatar}>
            <Text style={s.memberAvatarText}>{m.name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{m.name}</Text>
            <Text style={s.cardMeta}>{m.email}</Text>
            <View style={[s.roleBadge, m.role === 'admin' && s.roleBadgeAdmin]}>
              <Text style={[s.roleBadgeText, m.role === 'admin' && s.roleBadgeTextAdmin]}>
                {m.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </Text>
            </View>
          </View>
          {group.userRole === 'admin' && m.id !== currentUserId && (
            <TouchableOpacity onPress={() => onRemoveMember(m.id)} style={s.removeBtn}>
              <Text style={s.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function EmptyCard({ icon, text }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

function SectionLabel({ icon, label }) {
  return (
    <View style={s.sectionLabelRow}>
      <Text style={s.sectionLabelIcon}>{icon}</Text>
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────




// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadSafe: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadText: { ...typography.body, color: colors.textSecondary },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm, minHeight: 48 },
  backBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  backIcon: { fontSize: 22, color: colors.primary, fontWeight: '600', marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  headerBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  headerBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  headerLeaveBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  headerLeaveText: { ...typography.caption, color: colors.warning, fontWeight: '600' },

  tabBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 40 },
  tabBarInner: { paddingHorizontal: spacing.sm, paddingVertical: 0, alignItems: 'center' },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent', height: 40, justifyContent: 'center' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  // Tape layout — all tab panels always mounted
  tabContentArea: { flex: 1, overflow: 'hidden' },
  tabPanel: { position: 'absolute', top: 0, bottom: 0, width: Dimensions.get('window').width },

  content: { flex: 1, backgroundColor: colors.background },
  contentInner: { padding: spacing.lg, paddingBottom: 40 },

  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  tabTitle: { ...typography.h2, color: colors.textPrimary },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, ...shadow.sm },
  primaryBtnText: { ...typography.bodySmall, color: colors.textOnPrimary, fontWeight: '700' },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 2 },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardAmount: { ...typography.h3, color: colors.primary, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  cardDate: { ...typography.caption, color: colors.textTertiary },
  cardActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  actionEdit: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  actionDelete: { ...typography.caption, color: colors.error, fontWeight: '600' },
  splitsText: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },

  expenseIconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  expenseIcon: { fontSize: 20 },

  balanceCard: { padding: spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  amountBadge: { backgroundColor: colors.oweRedBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.oweRedBorder },
  amountBadgeText: { ...typography.bodySmall, color: colors.oweRed, fontWeight: '700' },

  section: { marginBottom: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  sectionLabelIcon: { fontSize: 14 },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },

  pendingCard: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  pendingInitiator: { ...typography.caption, color: colors.warning, fontWeight: '600', marginBottom: spacing.xs },
  pendingAmount: { ...typography.h2, color: colors.textPrimary, fontWeight: '800', marginVertical: spacing.sm },
  pendingActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  approveBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.success, alignItems: 'center' },
  approveBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.error, alignItems: 'center' },
  rejectBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },

  statusPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, marginTop: spacing.sm, borderWidth: 1 },
  statusApproved: { backgroundColor: colors.owedGreenBg, borderColor: colors.owedGreenBorder },
  statusRejected: { backgroundColor: colors.oweRedBg, borderColor: colors.oweRedBorder },
  statusPending: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  statusText: { ...typography.caption, fontWeight: '600' },

  optCard: { borderLeftWidth: 3, borderLeftColor: colors.success },
  settleIconBox: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.owedGreenBg, justifyContent: 'center', alignItems: 'center' },
  settleIcon: { fontSize: 18 },

  dateHeader: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, marginBottom: spacing.sm },
  timeText: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },

  memberCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberAvatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  roleBadge: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.background },
  roleBadgeAdmin: { backgroundColor: colors.primaryLight },
  roleBadgeText: { ...typography.caption, color: colors.textSecondary },
  roleBadgeTextAdmin: { color: colors.primary, fontWeight: '600' },
  removeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.errorBorder },
  removeBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },

  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 32, marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

// Modal styles
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xxl, paddingBottom: 36, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xl },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.lg, minHeight: 50 },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  splitName: { width: 90, ...typography.bodySmall, color: colors.textPrimary, fontWeight: '500' },
  splitInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.textPrimary, minHeight: 40 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', minWidth: 80 },
  cancelText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', minWidth: 100, ...shadow.sm },
  submitText: { ...typography.body, color: '#fff', fontWeight: '700' },
  deleteBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.errorBorder, alignItems: 'center' },
  deleteBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  memberRowAvatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  memberRowAvatarText: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  memberRowName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  memberRowEmail: { ...typography.caption, color: colors.textSecondary },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.primary },
  addBtnText: { ...typography.caption, color: '#fff', fontWeight: '700' },
});
