const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace component usages of formatCurrency(...) with formatCurrency(..., group?.currency)
  // Dashboard might be different, so let's check
  // GroupDetail: `formatCurrency(expr)` -> `formatCurrency(expr, group?.currency)`
  if (filePath.includes('GroupDetail')) {
    // Replace all formatCurrency(xxx) except imports and defs
    content = content.replace(/formatCurrency\(([^)]+)\)/g, (match, p1) => {
      if (p1.includes('group?.currency')) return match;
      return `formatCurrency(${p1}, group?.currency)`;
    });
  } else if (filePath.includes('Dashboard')) {
    // In Dashboard we have balanceSummary, no specific group currency since it's an aggregate.
    // Dashboard aggregate probably uses INR default. Wait! Does Dashboard show groups?
    // Actually, dashboard aggregates from all groups. Default is fine for now, or maybe the user has a default currency.
    // Let's just leave Dashboard alone or replace with INR.
  }

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

replaceInFile(path.join(__dirname, 'frontend/src/pages/GroupDetail.jsx'));
replaceInFile(path.join(__dirname, 'mobile/src/screens/GroupDetailScreen.js'));
