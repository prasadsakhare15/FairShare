import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { m } from './modalStyles';
import { formatCurrency } from '../../utils/formatUtils';

export default function SettleUpModal({ balances, group, onClose, onSubmit, showToast }) {
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const available = balances.filter((b) => b.from_user_id === parseInt(fromUserId));

  useEffect(() => {
    if (fromUserId && toUserId) {
      const b = balances.find((x) => x.from_user_id === parseInt(fromUserId) && x.to_user_id === parseInt(toUserId));
      if (b) setAmount(String(parseFloat(b.amount)));
    }
  }, [fromUserId, toUserId, balances]);

  const handleSubmit = async () => {
    if (!fromUserId || !toUserId || !amount) { showToast('Please fill all fields', 'error'); return; }
    setSubmitting(true);
    try {
      await onSubmit({ from_user_id: parseInt(fromUserId), to_user_id: parseInt(toUserId), amount: parseFloat(amount), payment_method: paymentMethod || null, notes: notes || null });
    } catch (e) {
      showToast(e.userMessage || 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={m.title}>💸 Settle Up</Text>
            <Text style={m.label}>Who is paying?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              {group?.members?.map((mem) => (
                <TouchableOpacity key={mem.id} style={[m.chip, fromUserId === String(mem.id) && m.chipActive]}
                  onPress={() => { setFromUserId(String(mem.id)); setToUserId(''); setAmount(''); }}>
                  <Text style={[m.chipText, fromUserId === String(mem.id) && m.chipTextActive]}>{mem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {fromUserId && (
              <>
                <Text style={m.label}>Paying to</Text>
                {available.length === 0 ? (
                  <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>No outstanding balances for this person.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                    {available.map((b) => {
                      const mem = group?.members?.find((x) => x.id === b.to_user_id);
                      if (!mem) return null;
                      return (
                        <TouchableOpacity key={b.to_user_id} style={[m.chip, toUserId === String(b.to_user_id) && m.chipActive]}
                          onPress={() => { setToUserId(String(b.to_user_id)); setAmount(String(parseFloat(b.amount))); }}>
                          <Text style={[m.chipText, toUserId === String(b.to_user_id) && m.chipTextActive]}>
                            {mem.name} ({formatCurrency(b.amount, group?.currency)})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            <Text style={m.label}>Amount (₹)</Text>
            <TextInput style={m.input} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={m.label}>Payment method (optional)</Text>
            <TextInput style={m.input} placeholder="UPI, Cash, Bank Transfer…" placeholderTextColor={colors.textTertiary} value={paymentMethod} onChangeText={setPaymentMethod} />
            <Text style={m.label}>Notes (optional)</Text>
            <TextInput style={[m.input, m.textarea]} placeholder="Any notes…" placeholderTextColor={colors.textTertiary} value={notes} onChangeText={setNotes} multiline />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={onClose}><Text style={m.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[m.submitBtn, submitting && { opacity: 0.65 }]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

