import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { m } from './modalStyles';
import { formatCurrency } from '../../utils/formatUtils';

export default function AddExpenseModal({ group, expense, onClose, onSubmit, showToast }) {
  const isEdit = !!expense;
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [paidBy, setPaidBy] = useState(expense ? String(expense.paid_by) : '');
  const [splitType, setSplitType] = useState(expense?.split_type ?? 'equal');
  const [splits, setSplits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!group?.members) return;
    if (expense) {
      const map = new Map((expense.splits ?? []).map((sp) => [sp.user_id, sp]));
      setSplits(group.members.map((m) => {
        const ex = map.get(m.id);
        return ex
          ? { user_id: m.id, amount: parseFloat(ex.amount), percentage: ex.percentage }
          : { user_id: m.id, amount: 0, percentage: 0 };
      }));
    } else if (splits.length === 0) {
      const amt = parseFloat(amount) || 0;
      setSplits(group.members.map((m) => ({
        user_id: m.id,
        amount: splitType === 'equal' && amt > 0 ? amt / group.members.length : 0,
        percentage: 0,
      })));
    }
  }, [group?.members, expense?.id]);

  useEffect(() => {
    if (splitType === 'equal' && amount && group?.members && !expense) {
      const amt = parseFloat(amount) / group.members.length;
      setSplits((prev) => prev.map((sp) => ({ ...sp, amount: amt })));
    }
  }, [splitType, amount]);

  const handleSubmit = async () => {
    if (!paidBy || !amount) { showToast('Please fill required fields', 'error'); return; }
    const amt = parseFloat(amount);
    let finalSplits = splits;
    if (splitType === 'equal' && group?.members) {
      finalSplits = group.members.map((m) => ({ user_id: m.id, amount: amt / group.members.length, percentage: null }));
    }
    const total = finalSplits.reduce((sum, sp) => sum + sp.amount, 0);
    if (Math.abs(total - amt) > 0.01) { showToast('Split total does not match amount', 'error'); return; }
    setSubmitting(true);
    try {
      await onSubmit({ title, amount: amt, paid_by: parseInt(paidBy), split_type: splitType, splits: finalSplits.filter((sp) => sp.amount > 0) });
    } catch (e) {
      showToast(e.userMessage || 'Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={m.title}>{isEdit ? '✏️ Edit Expense' : '💳 Add Expense'}</Text>

            <Text style={m.label}>Title</Text>
            <TextInput style={m.input} placeholder="e.g. Dinner, Hotel…" placeholderTextColor={colors.textTertiary} value={title} onChangeText={setTitle} />

            <Text style={m.label}>Amount (₹)</Text>
            <TextInput style={m.input} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

            <Text style={m.label}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              {group?.members?.map((mem) => (
                <TouchableOpacity
                  key={mem.id}
                  style={[m.chip, paidBy === String(mem.id) && m.chipActive]}
                  onPress={() => setPaidBy(String(mem.id))}
                >
                  <Text style={[m.chipText, paidBy === String(mem.id) && m.chipTextActive]}>{mem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={m.label}>Split type</Text>
            <View style={m.chipRow}>
              {['equal', 'exact', 'percentage'].map((t) => (
                <TouchableOpacity key={t} style={[m.chip, splitType === t && m.chipActive]} onPress={() => setSplitType(t)}>
                  <Text style={[m.chipText, splitType === t && m.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(splitType === 'exact' || splitType === 'percentage') && group?.members && (
              <View style={{ marginBottom: spacing.md }}>
                {group.members.map((mem) => {
                  const sp = splits.find((x) => x.user_id === mem.id);
                  return (
                    <View key={mem.id} style={m.splitRow}>
                      <Text style={m.splitName} numberOfLines={1}>{mem.name}</Text>
                      <TextInput
                        style={m.splitInput}
                        placeholder={splitType === 'percentage' ? '%' : '0.00'}
                        placeholderTextColor={colors.textTertiary}
                        value={sp ? String(splitType === 'percentage' ? (sp.percentage ?? 0) : sp.amount) : ''}
                        onChangeText={(v) => {
                          const n = parseFloat(v) || 0;
                          setSplits((prev) => prev.map((x) => x.user_id === mem.id
                            ? splitType === 'percentage'
                              ? { ...x, percentage: n, amount: (parseFloat(amount) || 0) * n / 100 }
                              : { ...x, amount: n }
                            : x
                          ));
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  );
                })}
              </View>
            )}

            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.submitBtn, submitting && { opacity: 0.65 }]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

