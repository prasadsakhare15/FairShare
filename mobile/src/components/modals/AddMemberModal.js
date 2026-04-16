import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { m } from './modalStyles';

export default function AddMemberModal({ group, searchResults, onSearch, onClose, onMemberAdded, showToast }) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  return (
    <Modal visible transparent animationType="slide">
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>👥 Add Member</Text>
          <TextInput style={m.input} placeholder="Search by name or email…" placeholderTextColor={colors.textTertiary} value={query}
            onChangeText={(q) => { setQuery(q); onSearch(q); }} />
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {searchResults.map((item) => (
              <View key={item.id} style={m.memberRow}>
                <View style={m.memberRowAvatar}>
                  <Text style={m.memberRowAvatarText}>{item.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.memberRowName}>{item.name}</Text>
                  <Text style={m.memberRowEmail}>{item.email}</Text>
                </View>
                <TouchableOpacity style={[m.addBtn, adding && { opacity: 0.6 }]} disabled={adding}
                  onPress={async () => { setAdding(true); try { await onMemberAdded(item.id); } catch (e) { showToast(e.userMessage || 'Failed', 'error'); } setAdding(false); }}>
                  <Text style={m.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            ))}
            {query.length >= 2 && searchResults.length === 0 && (
              <Text style={{ ...typography.body, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.xl }}>No users found</Text>
            )}
          </ScrollView>
          <TouchableOpacity style={[m.cancelBtn, { marginTop: spacing.md }]} onPress={onClose}>
            <Text style={m.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

