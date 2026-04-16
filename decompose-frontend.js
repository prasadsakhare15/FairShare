const fs = require('fs');
const path = require('path');

const frontendGroupDetailPath = path.join(__dirname, 'frontend/src/pages/GroupDetail.jsx');
let content = fs.readFileSync(frontendGroupDetailPath, 'utf8');

// The modals are basically defined as:
// const AddExpenseModal = ...
// const SettleUpModal = ...
// const AddMemberModal = ...
// const EditGroupModal = ...

function extractComponent(name, isLast = false) {
  const startStr = `// ${name.replace(/([A-Z])/g, ' $1').trim()} Component`;
  const nextStr = isLast ? 'export default GroupDetail;' : '// ';
  
  const startIndex = content.indexOf(startStr);
  if (startIndex === -1) return null;
  
  const restStr = content.substring(startIndex + startStr.length);
  const nextIndex = isLast ? restStr.lastIndexOf('export default GroupDetail;') : restStr.indexOf('\n// ');
  
  if (nextIndex === -1) return null;
  
  const componentStr = content.substring(startIndex, startIndex + startStr.length + nextIndex);
  
  content = content.replace(componentStr, '');
  
  return componentStr;
}

const componentsDir = path.join(__dirname, 'frontend/src/components/modals');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. Extract AddExpenseModal
let addExpense = extractComponent('AddExpenseModal');
if (addExpense) {
  addExpense = `import { useState, useEffect } from 'react';\nimport { formatCurrency } from '../../utils/formatUtils';\nimport { useToast } from '../../context/ToastContext';\n\n` + addExpense + `\nexport default AddExpenseModal;\n`;
  fs.writeFileSync(path.join(componentsDir, 'AddExpenseModal.jsx'), addExpense);
}

// 2. Extract SettleUpModal
let settleUp = extractComponent('SettleUpModal');
if (settleUp) {
  settleUp = `import { useState, useEffect } from 'react';\nimport { formatCurrency } from '../../utils/formatUtils';\nimport { useToast } from '../../context/ToastContext';\n\n` + settleUp + `\nexport default SettleUpModal;\n`;
  fs.writeFileSync(path.join(componentsDir, 'SettleUpModal.jsx'), settleUp);
}

// 3. Extract AddMemberModal
let addMember = extractComponent('AddMemberModal');
if (addMember) {
  addMember = `import { useState } from 'react';\nimport { addGroupMember } from '../../services/groupService';\nimport { useToast } from '../../context/ToastContext';\n\n` + addMember + `\nexport default AddMemberModal;\n`;
  fs.writeFileSync(path.join(componentsDir, 'AddMemberModal.jsx'), addMember);
}

// 4. Extract EditGroupModal
let editGroup = extractComponent('EditGroupModal', true);
if (editGroup) {
  editGroup = `import { useState, useEffect } from 'react';\nimport { useToast } from '../../context/ToastContext';\n\n` + editGroup + `\nexport default EditGroupModal;\n`;
  fs.writeFileSync(path.join(componentsDir, 'EditGroupModal.jsx'), editGroup);
}

// Ensure the imports are added to the top of GroupDetail.jsx
const importsStr = `
import AddExpenseModal from '../components/modals/AddExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import EditGroupModal from '../components/modals/EditGroupModal';
`;

content = content.replace("import SkeletonLoader from '../components/SkeletonLoader';", "import SkeletonLoader from '../components/SkeletonLoader';\n" + importsStr);

fs.writeFileSync(frontendGroupDetailPath, content);
console.log('Frontend Decomposition Complete!');
