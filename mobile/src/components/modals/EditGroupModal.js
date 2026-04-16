import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { m } from './modalStyles';

export default function EditGroupModal({ group, onClose, onSave, onDelete, showToast }) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [currency, setCurrency] = useState(group?.currency ?? 'INR');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try { await onSave({ name: name.trim(), description: description.trim(), currency }); }
    catch (e) { showToast(e.userMessage || 'Failed', 'error'); }
    finally { setSaving(false); }
  };
  return (
    <Modal visible transparent animationType="slide">
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>✏️ Edit Group</Text>
          <Text style={m.label}>Group name</Text>
          <TextInput style={m.input} value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor={colors.textTertiary} />
          <Text style={m.label}>Description</Text>
          <TextInput style={[m.input, m.textarea]} value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor={colors.textTertiary} multiline />
          
          <Text style={m.label}>Currency</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
            {['INR', 'USD', 'EUR', 'GBP'].map(curr => (
              <TouchableOpacity
                key={curr}
                onPress={() => setCurrency(curr)}
                style={{
                  flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
                  borderRadius: radius.sm, borderWidth: 1,
                  borderColor: currency === curr ? colors.primary : colors.border,
                  backgroundColor: currency === curr ? colors.primaryLight : colors.background
                }}
              >
                <Text style={{ 
                  fontSize: 14, fontWeight: '600', 
                  color: currency === curr ? colors.primary : colors.textSecondary 
                }}>
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={m.actions}>
            <TouchableOpacity style={m.deleteBtn} onPress={onDelete}>
              <Text style={m.deleteBtnText}>🗑 Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.submitBtn, saving && { opacity: 0.65 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


