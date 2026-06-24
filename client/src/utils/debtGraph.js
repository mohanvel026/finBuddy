// client/src/utils/debtGraph.js
// Client-side version of debt minimization for preview before API call

export const minimizeDebts = (expenses, members) => {
  const balances = {};
  members.forEach(m => { balances[m._id || m] = 0; });

  expenses.forEach(expense => {
    if (!expense.paidBy) return;
    const payer = expense.paidBy._id || expense.paidBy;
    balances[payer] = (balances[payer] || 0) + expense.amount;
    expense.splits?.forEach(split => {
      if (split.isPaid) return;
      const debtor = split.user?._id || split.user;
      balances[debtor] = (balances[debtor] || 0) - split.amount;
    });
  });

  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([id, bal]) => {
    if (bal > 0.01) creditors.push({ id, amount: bal });
    else if (bal < -0.01) debtors.push({ id, amount: Math.abs(bal) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settle = Math.min(creditors[i].amount, debtors[j].amount);
    if (settle > 0.01) {
      transactions.push({
        from: debtors[j].id,
        to: creditors[i].id,
        amount: Math.round(settle * 100) / 100
      });
    }
    creditors[i].amount -= settle;
    debtors[j].amount -= settle;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return transactions;
};

export const getMyBalance = (expenses, userId) => {
  let balance = 0;
  expenses.forEach(exp => {
    const payer = exp.paidBy?._id || exp.paidBy;
    if (payer?.toString() === userId?.toString()) {
      exp.splits?.forEach(s => {
        const splitter = s.user?._id || s.user;
        if (splitter?.toString() !== userId?.toString() && !s.isPaid) {
          balance += s.amount;
        }
      });
    } else {
      const mySplit = exp.splits?.find(s => {
        const splitter = s.user?._id || s.user;
        return splitter?.toString() === userId?.toString() && !s.isPaid;
      });
      if (mySplit) balance -= mySplit.amount;
    }
  });
  return Math.round(balance * 100) / 100;
};
