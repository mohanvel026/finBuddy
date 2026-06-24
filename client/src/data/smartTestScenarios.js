export const FRAUD_SHIELD_SCENARIOS = [
  { label: 'Fake KYC SMS', text: 'Dear Customer, your SBI account has been blocked due to pending KYC document. Please update within 24 hours at http://sbi-verify-kyc.net/in' },
  { label: 'UPI Reward Alert', text: 'Congratulations! You have won a cashback reward of ₹4,999 on GPay. Click here to claim your reward instantly: upi://pay?pa=rewards99@paytm&am=4999' },
  { label: 'Part-Time Job Offer', text: 'Earn ₹3000-5000 per day by just liking YouTube videos. Work from home, no experience needed. Msg us on Telegram: https://t.me/parttime_earn_hr' },
  { label: 'Electricity Bill Scam', text: 'Dear consumer, your electricity connection will be disconnected tonight at 9:30 PM because your last month bill is updated. Please contact officer immediately at 98765-XXXXX.' }
];

export const NEWS_CANCELER_SCENARIOS = [
  { label: 'Stock Market Crash', headline: 'SENSEX CRASHES 2000 POINTS: Global bank runs trigger historic selloff in emerging markets!' },
  { label: 'Margin Contraction', headline: 'HDFC Bank shares plunge 8% as margins contract; brokerages slash target price in panic.' },
  { label: 'Rate Hike Shock', headline: 'BREAKING: RBI keeps repo rates high in shock policy move; home loan EMIs set to soar.' },
  { label: 'Inflation Panic', headline: 'US Fed hints at three more interest rate hikes this year to tackle sticky inflation.' }
];

export const BILL_NEGOTIATOR_SCENARIOS = [
  { label: 'Airtel Broadband', data: { billType: 'Broadband / Wi-Fi', currentPlan: 'Airtel Xstream 100 Mbps Plan', monthlyAmount: '999', provider: 'Airtel' } },
  { label: 'Jio Mobile', data: { billType: 'Mobile Postpaid', currentPlan: 'Jio Family Postpaid Plus', monthlyAmount: '599', provider: 'Jio' } },
  { label: 'Tata Play DTH', data: { billType: 'Cable / DTH TV', currentPlan: 'Premium Sports HD Pack', monthlyAmount: '450', provider: 'Tata Play' } }
];

export const EMI_TRAP_SCENARIOS = [
  { label: 'Zero-Cost Macbook EMI', text: 'Buy Apple Macbook today at zero downpayment and 0% interest EMI! Monthly payments of only ₹9,990 for 12 months. Mandatory file processing charges apply of ₹2,999 + tax.', data: { principal: '120000', emiAmount: '9990', months: '12', processingFee: '2999', extraPayment: '0' } },
  { label: 'Easy Loan SMS Ad', text: 'Pre-approved loan of ₹1,00,000 processed in 5 mins! Pay EMI of ₹9,500/month for 12 months. Verification charges of ₹4,999 deducted upfront.', data: { principal: '100000', emiAmount: '9500', months: '12', processingFee: '4999', extraPayment: '0' } },
  { label: 'No-Cost Smartphone', text: 'Get iPhone 15 at zero interest. Just pay ₹4,999/month for 16 months. Initial downpayment: ₹9,999. Processing charges of ₹1,500.', data: { principal: '80000', emiAmount: '4999', months: '16', processingFee: '1500', extraPayment: '0' } }
];

export const COST_RADAR_SCENARIOS = [
  { label: 'Bangalore vs Mumbai', data: { city1: 'Bengaluru', city2: 'Mumbai', salary: '150000' } },
  { label: 'Delhi vs Pune', data: { city1: 'Delhi', city2: 'Pune', salary: '90000' } },
  { label: 'Hyderabad vs Chennai', data: { city1: 'Hyderabad', city2: 'Chennai', salary: '120000' } }
];

export const ROUTE_PLANNER_SCENARIOS = [
  { label: 'Airport to Tech Park', data: { origin: 'Bengaluru Airport (BLR)', destination: 'Manyata Tech Park, Bengaluru', waypoint: 'Hebbal Flyover', avoidPolice: false } },
  { label: 'Office to Home (stealth)', data: { origin: 'Indiranagar, Bengaluru', destination: 'Whitefield, Bengaluru', waypoint: 'HAL Road', avoidPolice: true } }
];

export const PURCHASE_ORACLE_SCENARIOS = [
  { label: 'Apple iPhone 16 Pro', data: { product: 'iPhone 16 Pro', currentPrice: '120000' } },
  { label: 'Winter Leather Jacket', data: { product: 'Leather Jacket', currentPrice: '8500' } },
  { label: 'Air Conditioner', data: { product: '1.5 Ton Split AC', currentPrice: '38000' } }
];

export const IMPULSE_THERAPIST_SCENARIOS = [
  { label: 'Watch on Credit Card', data: { item: 'Apple Watch Ultra', price: '120000', reason: 'Flash sale 10% discount on credit card right now!', monthlyIncome: '75000' } },
  { label: 'Impulsive Sneaker Purchase', data: { item: 'Limited Edition Jordans', price: '18000', reason: 'They sell out fast and I want to look cool in front of friends.', monthlyIncome: '50000' } },
  { label: '85-inch 4K TV Upgrade', data: { item: 'OLED 85-inch 4K TV', price: '250000', reason: 'My current 55-inch is fine, but this has a huge screen discount.', monthlyIncome: '120000' } }
];
