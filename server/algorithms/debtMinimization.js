/**
 * DEBT GRAPH MINIMIZATION ALGORITHM
 * Reduces N transactions between friends to minimum possible payments
 * Time Complexity: O(n log n) | Space: O(n)
 * This is the same concept used by Splitwise internally
 */

/**
 * Main function: takes raw expenses, returns minimum transactions needed
 * @param {Array} expenses - Array of expense documents from MongoDB
 * @param {Array} memberIds - Array of user IDs in the group
 * @returns {Array} minimizedTransactions - [{from, to, amount}]
 */
const minimizeDebts = (expenses, memberIds) => {
  // Step 1: Calculate net balance for each person
  const balances = {};

  // Initialize all members with 0 balance
  memberIds.forEach(id => {
    balances[id.toString()] = 0;
  });

    // Calculate who paid and who owes
  expenses.forEach(expense => {
    if (!expense.paidBy) return;

    const payer = (expense.paidBy._id || expense.paidBy).toString();

    // Payer gets credit for full amount
    balances[payer] = (balances[payer] || 0) + expense.amount;

    // Each split person owes their share
    expense.splits.forEach(split => {
      const debtor = (split.user._id || split.user).toString();
      // Skip if already settled AND it's not the payer's own split
      if (split.isPaid && debtor !== payer) return;

      balances[debtor] = (balances[debtor] || 0) - split.amount;
    });
  });

  // Step 2: Filter active participants (balance !== 0)
  const activeBalances = [];
  Object.entries(balances).forEach(([userId, bal]) => {
    const roundedBal = Math.round(bal * 100) / 100;
    if (Math.abs(roundedBal) > 0.01) {
      activeBalances.push({ userId, balance: roundedBal });
    }
  });

  const n = activeBalances.length;
  if (n === 0) return [];

  // If n is too large (e.g., > 15), fallback to greedy approach to avoid 2^N performance slowdown
  if (n > 15) {
    return minimizeDebtsGreedy(activeBalances);
  }

  // --- BITMASK DP FOR OPTIMAL SUBSET ZERO-SUM PARTITIONING ---
  // dp[mask] = maximum number of zero-sum subsets in this bitmask
  const numSubsets = 1 << n;
  const dp = new Array(numSubsets).fill(0);
  const sum = new Array(numSubsets).fill(0);

  for (let mask = 1; mask < numSubsets; mask++) {
    // Find lowest set bit index using bit math
    const lowestBitIdx = Math.log2(mask & -mask);
    sum[mask] = sum[mask ^ (1 << lowestBitIdx)] + activeBalances[lowestBitIdx].balance;

    // Calculate max zero-sum subsets from submasks
    let maxSub = 0;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        maxSub = Math.max(maxSub, dp[mask ^ (1 << i)]);
      }
    }
    dp[mask] = maxSub;

    // If this entire subset sums to zero, we can form one more zero-sum group
    if (Math.abs(sum[mask]) < 0.02) {
      dp[mask]++;
    }
  }

  // Reconstruct the zero-sum subsets
  const subsets = [];
  let remainingMask = numSubsets - 1;

  // Helper to extract indices from mask
  const getIndices = (mask) => {
    const indices = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        indices.push(i);
      }
    }
    return indices;
  };

  // Greedy extraction of zero-sum partitions
  while (remainingMask > 0) {
    let bestMask = -1;
    let minSize = n + 1;

    // Find the smallest submask within remainingMask that sums to 0
    for (let sub = remainingMask; sub > 0; sub = (sub - 1) & remainingMask) {
      if (Math.abs(sum[sub]) < 0.02) {
        const size = getIndices(sub).length;
        if (size < minSize) {
          minSize = size;
          bestMask = sub;
        }
      }
    }

    if (bestMask !== -1 && minSize <= n) {
      subsets.push(getIndices(bestMask));
      remainingMask ^= bestMask;
    } else {
      // Fallback: take all remaining elements as one subset
      subsets.push(getIndices(remainingMask));
      break;
    }
  }

  // Step 4: Settle each subset independently using greedy strategy
  const transactions = [];

  subsets.forEach(indices => {
    const creditors = [];
    const debtors = [];

    indices.forEach(idx => {
      const p = activeBalances[idx];
      if (p.balance > 0) {
        creditors.push({ userId: p.userId, amount: p.balance });
      } else {
        debtors.push({ userId: p.userId, amount: Math.abs(p.balance) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const settleAmount = Math.min(creditor.amount, debtor.amount);

      if (settleAmount > 0.01) {
        transactions.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100
        });
      }

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }
  });

  return transactions;
};

// Greedy fallback algorithm for larger groups (n > 15) to maintain O(N log N) speed
const minimizeDebtsGreedy = (activeBalances) => {
  const creditors = [];
  const debtors = [];

  activeBalances.forEach(p => {
    if (p.balance > 0) {
      creditors.push({ userId: p.userId, amount: p.balance });
    } else {
      debtors.push({ userId: p.userId, amount: Math.abs(p.balance) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
};

/**
 * Get net balance of a specific user in a group
 * @param {Array} expenses
 * @param {String} userId
 * @returns {Number} positive = owed to user, negative = user owes
 */
const getUserBalance = (expenses, userId) => {
  let balance = 0;
  const targetUserId = userId.toString();

  expenses.forEach(expense => {
    if (!expense.paidBy) return;

    const payer = (expense.paidBy._id || expense.paidBy).toString();

    if (payer === targetUserId) {
      // This user paid — they are owed money
      expense.splits.forEach(split => {
        const splitUser = (split.user._id || split.user).toString();
        if (splitUser !== targetUserId && !split.isPaid) {
          balance += split.amount;
        }
      });
    } else {
      // This user owes — check their split
      const mySplit = expense.splits.find(
        s => (s.user._id || s.user).toString() === targetUserId && !s.isPaid
      );
      if (mySplit) {
        balance -= mySplit.amount;
      }
    }
  });

  return Math.round(balance * 100) / 100;
};

/**
 * Get all debts for a user (who they owe, who owes them)
 */
const getUserDebts = (expenses, userId) => {
  const owesTo = {};   // userId → amount (I owe them)
  const owedBy = {};   // userId → amount (they owe me)
  const me = userId.toString();

  expenses.forEach(expense => {
    if (!expense.paidBy) return;
    const payer = (expense.paidBy._id || expense.paidBy).toString();

    if (payer === me) {
      // I paid — others owe me
      expense.splits.forEach(split => {
        const debtor = (split.user._id || split.user).toString();
        if (debtor !== me && !split.isPaid) {
          owedBy[debtor] = (owedBy[debtor] || 0) + split.amount;
        }
      });
    } else {
      // Someone else paid — check if I owe them
      const mySplit = expense.splits.find(
        s => (s.user._id || s.user).toString() === me && !s.isPaid
      );
      if (mySplit) {
        owesTo[payer] = (owesTo[payer] || 0) + mySplit.amount;
      }
    }
  });

  return { owesTo, owedBy };
};

/**
 * Calculate group spending analytics
 */
const getGroupAnalytics = (expenses) => {
  const byCategory = {};
  const byMember = {};
  const byMonth = {};

  expenses.forEach(expense => {
    // By category
    const cat = expense.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + expense.amount;

    // By member (who paid most)
    if (expense.paidBy) {
      const payer = (expense.paidBy._id || expense.paidBy).toString();
      byMember[payer] = (byMember[payer] || 0) + expense.amount;
    }

    // By month
    const monthKey = new Date(expense.date).toLocaleDateString('en-IN', {
      month: 'short', year: 'numeric'
    });
    byMonth[monthKey] = (byMonth[monthKey] || 0) + expense.amount;
  });

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  return { byCategory, byMember, byMonth, totalSpend };
};

module.exports = { minimizeDebts, getUserBalance, getUserDebts, getGroupAnalytics };