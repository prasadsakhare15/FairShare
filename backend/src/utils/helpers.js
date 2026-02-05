export const normalizeBalances = (balances) => {
  // Normalize: if A owes B $10 and B owes A $5, result should be A owes B $5
  const normalized = {};
  
  for (const [key, amount] of Object.entries(balances)) {
    const [from, to] = key.split('->');
    const reverseKey = `${to}->${from}`;
    
    if (amount > 0) {
      if (normalized[key] === undefined) normalized[key] = 0;
      if (normalized[reverseKey] === undefined) normalized[reverseKey] = 0;
      
      const net = amount - (normalized[reverseKey] || 0);
      if (net > 0) {
        normalized[key] = net;
        normalized[reverseKey] = 0;
      } else if (net < 0) {
        normalized[key] = 0;
        normalized[reverseKey] = Math.abs(net);
      } else {
        normalized[key] = 0;
        normalized[reverseKey] = 0;
      }
    }
  }
  
  return normalized;
};

export const minimizeSettlements = (balances) => {
  // Convert balances to a map: user_id -> { owes: Map, owed: Map }
  const userBalances = new Map();
  
  // Initialize all users
  const allUsers = new Set();
  for (const key of Object.keys(balances)) {
    const [from, to] = key.split('->');
    allUsers.add(parseInt(from));
    allUsers.add(parseInt(to));
  }
  
  allUsers.forEach(userId => {
    userBalances.set(userId, { owes: new Map(), owed: new Map() });
  });
  
  // Populate balances
  for (const [key, amount] of Object.entries(balances)) {
    if (amount > 0) {
      const [from, to] = key.split('->').map(Number);
      const fromData = userBalances.get(from);
      const toData = userBalances.get(to);
      
      fromData.owes.set(to, amount);
      toData.owed.set(from, amount);
    }
  }
  
  // Calculate net balances
  const netBalances = new Map();
  userBalances.forEach((data, userId) => {
    let net = 0;
    data.owed.forEach(amount => net += amount);
    data.owes.forEach(amount => net -= amount);
    if (net !== 0) {
      netBalances.set(userId, net);
    }
  });
  
  // Greedy algorithm to minimize transactions
  const settlements = [];
  const sortedCreditors = Array.from(netBalances.entries())
    .filter(([_, net]) => net > 0)
    .sort((a, b) => b[1] - a[1]);
  
  const sortedDebtors = Array.from(netBalances.entries())
    .filter(([_, net]) => net < 0)
    .sort((a, b) => a[1] - b[1]);
  
  let creditorIdx = 0;
  let debtorIdx = 0;
  
  while (creditorIdx < sortedCreditors.length && debtorIdx < sortedDebtors.length) {
    const [creditorId, creditAmount] = sortedCreditors[creditorIdx];
    const [debtorId, debtAmount] = sortedDebtors[debtorIdx];
    
    const settlementAmount = Math.min(creditAmount, Math.abs(debtAmount));
    
    settlements.push({
      from_user_id: debtorId,
      to_user_id: creditorId,
      amount: parseFloat(settlementAmount.toFixed(2))
    });
    
    const remainingCredit = creditAmount - settlementAmount;
    const remainingDebt = debtAmount + settlementAmount;
    
    if (Math.abs(remainingCredit) < 0.01) {
      creditorIdx++;
    } else {
      sortedCreditors[creditorIdx][1] = remainingCredit;
    }
    
    if (Math.abs(remainingDebt) < 0.01) {
      debtorIdx++;
    } else {
      sortedDebtors[debtorIdx][1] = remainingDebt;
    }
  }
  
  return settlements;
};
