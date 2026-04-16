const fs = require('fs');
const path = require('path');

const modalsDir = path.join(__dirname, 'mobile/src/components/modals');
const modals = ['AddExpenseModal.js', 'SettleUpModal.js', 'AddMemberModal.js', 'EditGroupModal.js'];

modals.forEach(file => {
  const filePath = path.join(modalsDir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace("import { colors, spacing, radius, typography } from '../../theme';", "import { colors, spacing, radius, typography } from '../../theme';\nimport { m } from './modalStyles';");
  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + file);
});

const groupDetailPath = path.join(__dirname, 'mobile/src/screens/GroupDetailScreen.js');
let detailContent = fs.readFileSync(groupDetailPath, 'utf8');
const startIndex = detailContent.indexOf('// Modal styles');
if (startIndex !== -1) {
  const endIndex = detailContent.indexOf('});\n', startIndex) + 4;
  detailContent = detailContent.substring(0, startIndex) + detailContent.substring(endIndex);
  fs.writeFileSync(groupDetailPath, detailContent);
  console.log('Cleaned up GroupDetailScreen.js');
}

