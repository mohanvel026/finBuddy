// server/algorithms/spendingPersonality.js

/**
 * Analyzes a user's expense history and assigns a spending personality
 * Types: Foodie, Traveller, Saver, Impulsive, Balanced
 */

const analyzeSpendingPersonality = (expenses) => {
  if (!expenses || expenses.length < 3) return null;

  // Count by category
  const categoryTotals = {};
  let totalAmount = 0;

  expenses.forEach(exp => {
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    totalAmount += exp.amount;
  });

  if (totalAmount === 0) return null;

  // Calculate percentages
  const percentages = {};
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    percentages[cat] = (amt / totalAmount) * 100;
  });

  // Scoring rules
  let scores = {
    Foodie: 0,
    Traveller: 0,
    Saver: 0,
    Impulsive: 0,
    Balanced: 0
  };

  // Foodie: >40% on food
  if ((percentages.food || 0) > 40) scores.Foodie += 3;
  if ((percentages.food || 0) > 55) scores.Foodie += 2;

  // Traveller: >30% on transport/accommodation
  const travelPct = (percentages.transport || 0) + (percentages.accommodation || 0);
  if (travelPct > 30) scores.Traveller += 3;
  if (travelPct > 50) scores.Traveller += 2;

  // Impulsive: >35% on entertainment/shopping
  const impulsePct = (percentages.entertainment || 0) + (percentages.shopping || 0);
  if (impulsePct > 35) scores.Impulsive += 3;
  if (impulsePct > 50) scores.Impulsive += 2;

  // Saver: very few expenses, low total amounts
  if (expenses.length < 5 && totalAmount < 2000) scores.Saver += 3;
  if (expenses.length < 10 && totalAmount < 5000) scores.Saver += 1;

  // Balanced: no single category > 35%
  const maxPct = Math.max(...Object.values(percentages));
  if (maxPct < 35) scores.Balanced += 4;
  if (maxPct < 45) scores.Balanced += 1;

  // Find winner
  const personality = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  const descriptions = {
    Foodie: 'You live to eat! Most of your spending goes to food and dining experiences.',
    Traveller: 'Adventure is your middle name. Transport and stays take up most of your budget.',
    Saver: 'You are careful with money and spend only when necessary. Great habit!',
    Impulsive: 'Entertainment and shopping call your name. You enjoy the moment!',
    Balanced: 'You have a healthy mix of spending across categories. Well balanced!'
  };

  const emojis = {
    Foodie: '🍕',
    Traveller: '✈️',
    Saver: '💰',
    Impulsive: '🛍️',
    Balanced: '⚖️'
  };

  return {
    personality,
    emoji: emojis[personality],
    description: descriptions[personality],
    percentages,
    categoryTotals,
    totalAmount
  };
};

module.exports = { analyzeSpendingPersonality };