import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProfile, updateProfile, changePassword } from '../services/userService';
import { colors, spacing, radius, shadow, typography } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setName(data?.name || '');
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    setSavingName(true);
    try {
      const updated = await updateProfile({ name: name.trim() });
      setProfile(prev => ({ ...prev, ...updated }));
      setEditingName(false);
      showToast('Name updated!', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Please fill all fields', 'error'); return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error'); return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      showToast('Password changed! ✅', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadText}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Banner */}
          <View style={s.banner}>
            <View style={s.avatarLarge}>
              <Text style={s.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={s.bannerName}>{profile?.name}</Text>
            <Text style={s.bannerEmail}>{profile?.email}</Text>
          </View>

          {/* Name Section */}
          <View style={s.card}>
            <Text style={s.cardLabel}>DISPLAY NAME</Text>
            {editingName ? (
              <View>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={s.row}>
                  <TouchableOpacity style={s.btnPrimary} onPress={handleSaveName} disabled={savingName}>
                    <Text style={s.btnPrimaryText}>{savingName ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.btnSecondary}
                    onPress={() => { setEditingName(false); setName(profile?.name || ''); }}
                  >
                    <Text style={s.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.inlineRow}>
                <Text style={s.fieldValue}>{profile?.name}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Text style={s.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Email Section */}
          <View style={s.card}>
            <Text style={s.cardLabel}>EMAIL ADDRESS</Text>
            <Text style={s.fieldValue}>{profile?.email}</Text>
          </View>

          {/* Member Since */}
          <View style={s.card}>
            <Text style={s.cardLabel}>MEMBER SINCE</Text>
            <Text style={s.fieldValue}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>

          {/* Password Section */}
          <View style={s.card}>
            <View style={s.inlineRow}>
              <Text style={s.cardLabel}>PASSWORD</Text>
              {!showPasswordForm && (
                <TouchableOpacity onPress={() => setShowPasswordForm(true)}>
                  <Text style={s.editLink}>Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {showPasswordForm && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={s.inputLabel}>Current Password</Text>
                <TextInput
                  style={s.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholderTextColor={colors.textTertiary}
                  placeholder="Enter current password"
                />

                <Text style={s.inputLabel}>New Password</Text>
                <TextInput
                  style={s.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholderTextColor={colors.textTertiary}
                  placeholder="At least 6 characters"
                />

                <Text style={s.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={s.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor={colors.textTertiary}
                  placeholder="Re-enter new password"
                />

                <View style={s.row}>
                  <TouchableOpacity style={s.btnPrimary} onPress={handleChangePassword} disabled={savingPassword}>
                    <Text style={s.btnPrimaryText}>{savingPassword ? 'Changing…' : 'Change Password'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.btnSecondary}
                    onPress={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={s.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadSafe: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadText: { ...typography.body, color: colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.background },
  backIcon: { fontSize: 28, color: colors.textPrimary, marginTop: -2 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },

  scrollContent: { paddingBottom: 40 },

  // Avatar banner
  banner: {
    backgroundColor: colors.primary, paddingVertical: spacing.xxl + 8, paddingHorizontal: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  bannerName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  // Cards
  card: {
    backgroundColor: colors.surface, marginHorizontal: spacing.xl, marginBottom: spacing.md,
    borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  cardLabel: {
    ...typography.caption, color: colors.textTertiary, fontWeight: '700', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  fieldValue: { ...typography.body, color: colors.textPrimary, fontSize: 16 },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  // Inputs
  input: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, color: colors.textPrimary,
    marginBottom: spacing.md, minHeight: 48,
  },
  inputLabel: {
    ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs,
  },

  // Buttons
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  btnPrimary: {
    flex: 2, backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', ...shadow.md,
  },
  btnPrimaryText: { ...typography.body, color: colors.textOnPrimary, fontWeight: '700' },
  btnSecondary: {
    flex: 1, backgroundColor: colors.background, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  btnSecondaryText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },

  // Logout
  logoutBtn: {
    marginHorizontal: spacing.xl, marginTop: spacing.lg, paddingVertical: spacing.lg,
    borderRadius: radius.lg, backgroundColor: colors.errorLight, borderWidth: 1,
    borderColor: colors.errorBorder, alignItems: 'center',
  },
  logoutText: { ...typography.body, color: colors.error, fontWeight: '700' },
});
