// server/algorithms/emiEngine.js
const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / (12 * 100);

  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return { emi: Math.round(emi), totalPayment: principal, totalInterest: 0, schedule: [] };
  }

  const emi = principal * monthlyRate *
    Math.pow(1 + monthlyRate, tenureMonths) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= Math.min(tenureMonths, 12); month++) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = emi - interestPaid;
    balance -= principalPaid;
    schedule.push({
      month,
      emi: Math.round(emi),
      principalPaid: Math.round(principalPaid),
      interestPaid: Math.round(interestPaid),
      balance: Math.max(0, Math.round(balance))
    });
  }

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    schedule
  };
};

const extraPaymentSavings = (principal, annualRate, tenureMonths, extraMonthly) => {
  const normal = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / (1200);
  let balance = principal;
  let month = 0;
  let totalPaid = 0;

  while (balance > 0 && month < tenureMonths * 2) {
    const interest = balance * monthlyRate;
    const principalPaid = (normal.emi + extraMonthly) - interest;
    balance = Math.max(0, balance - principalPaid);
    totalPaid += normal.emi + extraMonthly;
    month++;
  }

  return {
    monthsSaved: tenureMonths - month,
    interestSaved: Math.round(normal.totalInterest - (totalPaid - principal))
  };
};

module.exports = { calculateEMI, extraPaymentSavings };