// server/algorithms/splitEngine.js
/**
 * ENTERPRISE-GRADE SPLIT ENGINE (Fintech Industry Standard)
 *
 * Implements:
 * 1. Safe Integer Paise Math (eliminates floating-point division bugs)
 * 2. Modulo Remainder Apportioning (allocates rounding pennies to highest spender/payer)
 * 3. Proportional Tax, Tip, & Fee Apportionment (Uber/Splitwise receipt split model)
 * 4. Micro-Unit validation loops
 */

/**
 * Calculate individual splits for group members
 *
 * @param {Object} params
 * @param {number} params.amount - Total bill amount
 * @param {string} params.splitType - 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized'
 * @param {Array} params.allMembers - [{userId}] - Fallback fallback list
 * @param {Array} params.participants - [{userId, amount, share, percentage}] - Individual configurations
 * @param {string} params.paidBy - User ID of the primary payer
 * @param {Object} [params.sharedCosts] - { tax, tip, serviceCharge, deliveryFee } - Optional items split metadata
 * @returns {Array} Array of splits: [{ user, amount, isPaid }]
 */
const calculateSplit = ({ amount, splitType, allMembers, participants, paidBy, sharedCosts = {} }) => {
  const totalAmount = parseFloat(amount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    throw new Error('Total amount must be a positive number');
  }

  // Convert total amount to integer paise to bypass IEEE 754 float inaccuracies
  const totalPaise = Math.round(totalAmount * 100);

  // 1. Resolve active participants list
  let activeUsers = [];
  if (participants && participants.length > 0) {
    activeUsers = participants.map(p => ({
      userId: (p.userId || p.user || p).toString(),
      amount: parseFloat(p.amount || 0),
      share: parseFloat(p.share || 0),
      percentage: parseFloat(p.percentage || 0)
    }));
  } else {
    activeUsers = allMembers.map(m => ({
      userId: (m.userId || m.user || m).toString(),
      amount: 0,
      share: 1, // Default equal share weights
      percentage: 0
    }));
  }

  if (activeUsers.length === 0) {
    throw new Error('No active participants identified for split');
  }

  let splitsInPaise = [];

  switch (splitType) {
    case 'equal':
    case 'selective':
    case 'subgroup': {
      const baseShare = Math.floor(totalPaise / activeUsers.length);
      let remainder = totalPaise % activeUsers.length;

      activeUsers.forEach((user) => {
        // Allocate 1 extra paisa of the remainder until remainder runs out
        const extraPaisa = remainder > 0 ? 1 : 0;
        if (extraPaisa > 0) remainder--;

        splitsInPaise.push({
          user: user.userId,
          amountPaise: baseShare + extraPaisa,
          isPaid: user.userId === paidBy.toString()
        });
      });
      break;
    }

    case 'exact': {
      let runningSum = 0;
      activeUsers.forEach((user) => {
        const userPaise = Math.round(user.amount * 100);
        runningSum += userPaise;
        splitsInPaise.push({
          user: user.userId,
          amountPaise: userPaise,
          isPaid: user.userId === paidBy.toString()
        });
      });

      // Float verification with 5-paise margin
      if (Math.abs(runningSum - totalPaise) > 5) {
        throw new Error(`Sum of exact amounts (₹${(runningSum / 100).toFixed(2)}) does not match the total expense (₹${totalAmount.toFixed(2)})`);
      }

      // Smooth minor rounding differences automatically by adjusting the payer
      if (runningSum !== totalPaise) {
        const diff = totalPaise - runningSum;
        const payerSplit = splitsInPaise.find(s => s.user === paidBy.toString()) || splitsInPaise[0];
        payerSplit.amountPaise += diff;
      }
      break;
    }

    case 'percentage': {
      let percentSum = 0;
      let distributedPaise = 0;

      activeUsers.forEach((user, idx) => {
        percentSum += user.percentage;
        // Integer calculation of percentage cut
        const calculatedPaise = Math.floor((user.percentage / 100) * totalPaise);
        distributedPaise += calculatedPaise;

        splitsInPaise.push({
          user: user.userId,
          amountPaise: calculatedPaise,
          isPaid: user.userId === paidBy.toString()
        });
      });

      if (Math.abs(percentSum - 100) > 0.01) {
        throw new Error(`Total percentage (${percentSum.toFixed(2)}%) must equal exactly 100%`);
      }

      // Allocate leftover rounding paise to the highest percentage holder
      let remainder = totalPaise - distributedPaise;
      if (remainder > 0) {
        // Find user with highest percentage to absorb minor remainder
        const sortedUsers = [...activeUsers].sort((a, b) => b.percentage - a.percentage);
        const topUserId = sortedUsers[0].userId;
        const topSplit = splitsInPaise.find(s => s.user === topUserId);
        if (topSplit) {
          topSplit.amountPaise += remainder;
        }
      }
      break;
    }

    case 'shares': {
      const totalShares = activeUsers.reduce((sum, u) => sum + u.share, 0);
      if (totalShares <= 0) {
        throw new Error('Total shares weight must be greater than zero');
      }

      let distributedPaise = 0;
      activeUsers.forEach((user) => {
        const calculatedPaise = Math.floor((user.share / totalShares) * totalPaise);
        distributedPaise += calculatedPaise;

        splitsInPaise.push({
          user: user.userId,
          amountPaise: calculatedPaise,
          isPaid: user.userId === paidBy.toString()
        });
      });

      // Distribute remainder paise sequentially based on share size
      let remainder = totalPaise - distributedPaise;
      const sortedUsers = [...activeUsers].sort((a, b) => b.share - a.share);
      let rIdx = 0;
      while (remainder > 0) {
        const targetUserId = sortedUsers[rIdx % sortedUsers.length].userId;
        const targetSplit = splitsInPaise.find(s => s.user === targetUserId);
        if (targetSplit) {
          targetSplit.amountPaise += 1;
          remainder--;
        }
        rIdx++;
      }
      break;
    }

    case 'item':
    case 'itemized': {
      // ── Proportional Tax, Tip & Delivery Fee Allocator ──
      // Total amount consists of (Subtotal of all ordered items) + (shared costs: tax, tips, delivery fees)
      const subtotalPaise = activeUsers.reduce((sum, u) => sum + Math.round(u.amount * 100), 0);
      if (subtotalPaise <= 0) {
        throw new Error('Itemized subtotal must be greater than zero');
      }

      // Calculate shared metadata block
      const sharedTaxPaise = Math.round(parseFloat(sharedCosts.tax || 0) * 100);
      const sharedTipPaise = Math.round(parseFloat(sharedCosts.tip || 0) * 100);
      const sharedFeePaise = Math.round(parseFloat((sharedCosts.serviceCharge || 0) + (sharedCosts.deliveryFee || 0)) * 100);
      const totalExtraPaise = sharedTaxPaise + sharedTipPaise + sharedFeePaise;

      let distributedPaise = 0;
      activeUsers.forEach((user) => {
        const personalItemSubtotal = Math.round(user.amount * 100);
        const userSpendRatio = personalItemSubtotal / subtotalPaise;

        // Proportional extra costs
        const proportionalExtra = Math.floor(userSpendRatio * totalExtraPaise);
        const userTotalPaise = personalItemSubtotal + proportionalExtra;

        distributedPaise += userTotalPaise;
        splitsInPaise.push({
          user: user.userId,
          amountPaise: userTotalPaise,
          isPaid: user.userId === paidBy.toString()
        });
      });

      // Compensate any rounding remainder to the highest individual spender
      let remainder = totalPaise - distributedPaise;
      if (remainder !== 0) {
        const sortedUsers = [...activeUsers].sort((a, b) => b.amount - a.amount);
        const topUserId = sortedUsers[0].userId;
        const topSplit = splitsInPaise.find(s => s.user === topUserId);
        if (topSplit) {
          topSplit.amountPaise += remainder;
        }
      }
      break;
    }

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }

  // Convert back to standard floats with locked 2-decimal precision for DB storage
  return splitsInPaise.map(s => ({
    user: s.user,
    amount: parseFloat((s.amountPaise / 100).toFixed(2)),
    isPaid: s.isPaid
  }));
};

/**
 * Validate that calculated splits match the final total amount precisely
 *
 * @param {Array} splits - [{amount}]
 * @param {number} totalAmount - Full expense cost
 * @returns {Array} verified splits
 */
const validateSplit = (splits, totalAmount) => {
  const sum = splits.reduce((s, item) => s + item.amount, 0);
  if (Math.abs(sum - totalAmount) > 0.011) {
    throw new Error(`Split verification failure: Sum (₹${sum.toFixed(2)}) deviates from total (₹${totalAmount.toFixed(2)})`);
  }
  return splits;
};

/**
 * Generates descriptive metadata summaries for splits
 */
const getSplitDescription = (splitType, participants, allMembers) => {
  const pCount = participants && participants.length > 0 ? participants.length : allMembers.length;
  const isSelective = participants && participants.length > 0 && participants.length < allMembers.length;

  let desc = '';
  switch (splitType) {
    case 'equal':
      desc = `Split equally among ${pCount} people`;
      break;
    case 'exact':
      desc = `Split with custom exact amounts for ${pCount} people`;
      break;
    case 'percentage':
      desc = `Split by percentages for ${pCount} people`;
      break;
    case 'shares':
      desc = `Split by custom weights/shares for ${pCount} people`;
      break;
    case 'item':
    case 'itemized':
      desc = `Proportional itemized split for ${pCount} people`;
      break;
    default:
      desc = `Split with ${splitType}`;
  }

  if (isSelective) {
    desc += ' (selective participants)';
  }
  return desc;
};

module.exports = { calculateSplit, validateSplit, getSplitDescription };
