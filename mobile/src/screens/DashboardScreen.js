import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getUserGroups, createGroup } from '../services/groupService';
import { getBalanceSummary } from '../services/userService';
import { formatCurrency } from '../utils/formatUtils';
import { useToast } from '../context/ToastContext';
import { colors, spacing, radius, shadow, typography } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('INR');
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();

  // Header + balance section slide-down
  const headerAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;

  const EASE = Easing.out(Easing.cubic);

  const runMountAnims = () => {
    headerAnim.setValue(0);
    balanceAnim.setValue(0);
    Animated.stagger(50, [
      Animated.timing(headerAnim, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: true }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 340, easing: EASE, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    loadGroups();
    runMountAnims();
  }, []);

  const loadGroups = async () => {
    try {
      const [groupsData, summaryData] = await Promise.all([
        getUserGroups(),
        getBalanceSummary(),
      ]);
      setGroups(groupsData);
      setBalanceSummary(summaryData);
      runMountAnims();
    } catch (error) {
      showToast('Failed to load your data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }
    setCreating(true);
    try {
      await createGroup(groupName.trim(), groupDescription.trim(), groupCurrency);
      setGroupName('');
      setGroupDescription('');
      setGroupCurrency('INR');
      setShowCreateModal(false);
      loadGroups();
      showToast('Group created successfully!', 'success');
    } catch (error) {
      showToast(error.userMessage || error.response?.data?.error || 'Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setGroupName('');
    setGroupDescription('');
    setGroupCurrency('INR');
  };

  const netBalance = balanceSummary
    ? parseFloat(balanceSummary.youAreOwed || 0) - parseFloat(balanceSummary.youOwe || 0)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your groups…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.appName}>FairShare</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileAvatarBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.profileAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance summary cards */}
            {balanceSummary && (
              <Animated.View style={[
                styles.balanceSection,
                {
                  opacity: balanceAnim,
                  transform: [{ translateY: balanceAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                },
              ]}>
                {/* Net balance pill */}
                <View style={[
                  styles.netBalanceCard,
                  netBalance >= 0 ? styles.netPositive : styles.netNegative,
                ]}>
                  <Text style={styles.netBalanceLabel}>
                    {netBalance >= 0 ? '💚 Overall you are owed' : '🔴 Overall you owe'}
                  </Text>
                  <Text style={[
                    styles.netBalanceAmount,
                    { color: netBalance >= 0 ? colors.owedGreen : colors.oweRed },
                  ]}>
                    {formatCurrency(Math.abs(netBalance))}
                  </Text>
                </View>

                <View style={styles.balanceRow}>
                  <View style={[styles.balanceCard, styles.cardOwe]}>
                    <Text style={styles.balanceEmoji}>💸</Text>
                    <Text style={styles.balanceLabel}>You owe</Text>
                    <Text style={[styles.balanceAmount, { color: colors.oweRed }]}>
                      {formatCurrency(balanceSummary.youOwe || 0)}
                    </Text>
                  </View>
                  <View style={[styles.balanceCard, styles.cardOwed]}>
                    <Text style={styles.balanceEmoji}>💰</Text>
                    <Text style={styles.balanceLabel}>You are owed</Text>
                    <Text style={[styles.balanceAmount, { color: colors.owedGreen }]}>
                      {formatCurrency(balanceSummary.youAreOwed || 0)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Groups header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Groups</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>+ New Group</Text>
              </TouchableOpacity>
            </View>

            {groups.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏠</Text>
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create a group and invite your friends, family, or colleagues to start splitting expenses.
                </Text>
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyCreateBtnText}>Create your first group</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <AnimatedGroupCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          />
        )}
      />

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalSheet}>
              {/* Drag handle */}
              <View style={styles.dragHandle} />

              <Text style={styles.modalTitle}>Create New Group</Text>
              <Text style={styles.modalSubtitle}>Give your group a name to get started</Text>

              <Text style={styles.fieldLabel}>Group name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Goa Trip 2025"
                placeholderTextColor={colors.textTertiary}
                value={groupName}
                onChangeText={setGroupName}
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="What's this group for?"
                placeholderTextColor={colors.textTertiary}
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Currency</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                {['INR', 'USD', 'EUR', 'GBP'].map(curr => (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => setGroupCurrency(curr)}
                    style={{
                      flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
                      borderRadius: radius.sm, borderWidth: 1,
                      borderColor: groupCurrency === curr ? colors.primary : colors.border,
                      backgroundColor: groupCurrency === curr ? colors.primaryLight : colors.background
                    }}
                  >
                    <Text style={{ 
                      fontSize: 14, fontWeight: '600', 
                      color: groupCurrency === curr ? colors.primary : colors.textSecondary 
                    }}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, creating && styles.btnDisabled]}
                  onPress={handleCreateGroup}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Group</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Animated Group Card ───────────────────────────────────────────────────────
function AnimatedGroupCard({ item, index, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const EASE = Easing.out(Easing.cubic);
  const delay = Math.min(index * 50, 300); // cap stagger at 300ms

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, easing: EASE, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, easing: EASE, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.97, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 300, friction: 20, useNativeDriver: true }).start();


  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={styles.groupCard}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.groupAvatar}>
          <Text style={styles.groupAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.groupInfo}>
          <View style={styles.groupNameRow}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <Text style={styles.groupMeta}>Created by {item.creator_name}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.sm,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  appName: {
    ...typography.h2,
    color: colors.primary,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingBottom: 32,
  },

  // Balance section
  balanceSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  netBalanceCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  netPositive: {
    backgroundColor: colors.owedGreenBg,
    borderColor: colors.owedGreenBorder,
  },
  netNegative: {
    backgroundColor: colors.oweRedBg,
    borderColor: colors.oweRedBorder,
  },
  netBalanceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  netBalanceAmount: {
    ...typography.h3,
    fontWeight: '800',
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  balanceCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.sm,
  },
  cardOwe: {
    backgroundColor: colors.oweRedBg,
    borderColor: colors.oweRedBorder,
  },
  cardOwed: {
    backgroundColor: colors.owedGreenBg,
    borderColor: colors.owedGreenBorder,
  },
  balanceEmoji: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    ...typography.h2,
    fontWeight: '800',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    ...shadow.sm,
  },
  createBtnText: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyCreateBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadow.md,
  },
  emptyCreateBtnText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Group card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  groupAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  groupName: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  adminBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  adminText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  groupDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  groupMeta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    minHeight: 50,
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow.md,
  },
  submitBtnText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  profileAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  profileAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
