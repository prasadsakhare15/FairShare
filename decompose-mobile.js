const fs = require('fs');
const path = require('path');

const mobileGroupDetailPath = path.join(__dirname, 'mobile/src/screens/GroupDetailScreen.js');
let content = fs.readFileSync(mobileGroupDetailPath, 'utf8');

// The mobile modals:
// function AddExpenseModal ...
// function SettleUpModal ...
// function AddMemberModal ...
// function EditGroupModal ...

function extractComponent(name, isLast = false) {
  const startStr = `function ${name}({`;
  const nextStr = isLast ? '// ─── Styles' : 'function ';
  
  const startIndex = content.indexOf(startStr);
  if (startIndex === -1) return null;
  
  const restStr = content.substring(startIndex + startStr.length);
  const nextIndex = isLast ? restStr.indexOf(nextStr) : restStr.indexOf('\nfunction ');
  
  if (nextIndex === -1) return null;
  
  const componentStr = content.substring(startIndex, startIndex + startStr.length + nextIndex);
  
  content = content.replace(componentStr, '');
  
  return componentStr;
}

const componentsDir = path.join(__dirname, 'mobile/src/components/modals');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

const importsCommon = `import React, { useState, useEffect } from 'react';\nimport { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';\nimport { colors, spacing, radius, typography } from '../../theme';\n`;

// 1. Extract AddExpenseModal
let addExpense = extractComponent('AddExpenseModal');
if (addExpense) {
  addExpense = importsCommon + `import { formatCurrency } from '../../utils/formatUtils';\n\nexport default ` + addExpense + `\n`;
  fs.writeFileSync(path.join(componentsDir, 'AddExpenseModal.js'), addExpense);
}

// 2. Extract SettleUpModal
let settleUp = extractComponent('SettleUpModal');
if (settleUp) {
  settleUp = importsCommon + `import { formatCurrency } from '../../utils/formatUtils';\n\nexport default ` + settleUp + `\n`;
  fs.writeFileSync(path.join(componentsDir, 'SettleUpModal.js'), settleUp);
}

// 3. Extract AddMemberModal
let addMember = extractComponent('AddMemberModal');
if (addMember) {
  addMember = importsCommon + `\nexport default ` + addMember + `\n`;
  fs.writeFileSync(path.join(componentsDir, 'AddMemberModal.js'), addMember);
}

// 4. Extract EditGroupModal
let editGroup = extractComponent('EditGroupModal', true);
if (editGroup) {
  editGroup = importsCommon + `\nexport default ` + editGroup + `\n`;
  fs.writeFileSync(path.join(componentsDir, 'EditGroupModal.js'), editGroup);
}

// Ensure the imports are added to the top of GroupDetailScreen.js
const importsStr = `
import AddExpenseModal from '../components/modals/AddExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import EditGroupModal from '../components/modals/EditGroupModal';
`;
content = content.replace("import { colors, spacing, radius, shadow, typography } from '../theme';", "import { colors, spacing, radius, shadow, typography } from '../theme';\n" + importsStr);

fs.writeFileSync(mobileGroupDetailPath, content);
console.log('Mobile Decomposition Complete!');
