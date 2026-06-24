// server/controllers/smart.controller.js — Smart Features 6.0
const axios = require('axios');
const { getAICompletion } = require('../utils/aiService');
const Expense = require('../models/Expense');
const { analyzeSpendingPersonality } = require('../algorithms/spendingPersonality');
const { calculateEMI, extraPaymentSavings } = require('../algorithms/emiEngine');

// ─── In-Memory Cache ───────────────────────────────────────
const cache = new Map();
const getCached = (key) => { const i = cache.get(key); if (i && i.expiry > Date.now()) return i.data; cache.delete(key); return null; };
const setCached = (key, data, ttlMins = 60) => cache.set(key, { data, expiry: Date.now() + ttlMins * 60000 });

// ─── AI Helper (Groq → Gemini fallback) ───────────────────
const getLocalAIResponse = (messages) => {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.find(m => m.role === 'user')?.content || '';

  // 1. SPENDING DNA PROFILER
  if (systemMsg.includes('behavioral finance psychologist') || systemMsg.includes('spending personality')) {
    const isStatus = userMsg.toLowerCase().includes('luxury') || userMsg.toLowerCase().includes('status') || userMsg.toLowerCase().includes('brand') || userMsg.toLowerCase().includes('expensive');
    const isSafety = userMsg.toLowerCase().includes('save') || userMsg.toLowerCase().includes('safety') || userMsg.toLowerCase().includes('scared') || userMsg.toLowerCase().includes('anxious') || userMsg.toLowerCase().includes('hoard');
    const isFOMO = userMsg.toLowerCase().includes('fomo') || userMsg.toLowerCase().includes('trend') || userMsg.toLowerCase().includes('friend') || userMsg.toLowerCase().includes('social');
    const isImpulse = userMsg.toLowerCase().includes('impulse') || userMsg.toLowerCase().includes('instant') || userMsg.toLowerCase().includes('buy now') || userMsg.toLowerCase().includes('sale');
    const isGuilt = userMsg.toLowerCase().includes('guilt') || userMsg.toLowerCase().includes('stress') || userMsg.toLowerCase().includes('sad') || userMsg.toLowerCase().includes('coping');

    let type = "The Balanced Strategist";
    let emoji = "🎯";
    let tagline = "Optimizing every rupee for long-term freedom without compromising current joy.";
    let traits = ["Analytical mindset", "Goal-oriented budgeting", "Value-driven spending"];
    let trigger = "None major, handles impulses well via buffer funds";
    let risk = "Low";
    let debias = [
      { step: "Optimize Surplus", action: "Automate investments on salary day", science: "Choice architecture reduces friction of saving." }
    ];
    let strengths = ["Consistent saving rate", "High financial resilience"];
    let watchOuts = ["Over-analysis paralysis", "Occasional frugality guilt"];
    let compatible = ["The Safety Hoarder"];
    let impact = "₹1,500 - ₹3,000 in minor inefficiencies";

    if (isStatus) {
      type = "The Status Chaser";
      emoji = "💎";
      tagline = "Aligning purchases with external validation and premium experiences.";
      traits = ["Trend-aware", "Brand-loyal", "Experience-driven"];
      trigger = "Social comparison and the urge to look successful";
      risk = "High";
      debias = [
        { step: "The 48-Hour Cart Hold", action: "Keep items in online cart for 48 hours before buying", science: "Allows dopamine spike to subside before financial commitment." },
        { step: "Separating Value from cost", action: "Audit purchases on utility, not status", science: "Shifts focus from extrinsic rewards to intrinsic satisfaction." }
      ];
      strengths = ["Excellent networking driver", "Values high-quality assets"];
      watchOuts = ["High lifestyle inflation risk", "Credit card debt accumulation"];
      compatible = ["The Balanced Strategist"];
      impact = "₹15,000 - ₹25,000 monthly premium overflow";
    } else if (isSafety) {
      type = "The Safety Hoarder";
      emoji = "🛡️";
      tagline = "Treating every expense as a potential threat to future survival.";
      traits = ["Risk-averse", "Frugal", "High cash buffers"];
      trigger = "Anxiety about future emergencies and market volatility";
      risk = "Low";
      debias = [
        { step: "Joy Allocation Fund", action: "Create a non-negotiable monthly budget meant ONLY to be spent on guilt-free fun", science: "Desensitizes the emotional pain of paying." }
      ];
      strengths = ["Extremely high savings rate", "Bulletproof emergency safety net"];
      watchOuts = ["Missed investment returns due to excessive cash holding", "Severe self-deprivation"];
      compatible = ["The Balanced Strategist"];
      impact = "₹8,000 - ₹12,000 in lost opportunity cost from idle cash";
    } else if (isFOMO) {
      type = "The FOMO Spender";
      emoji = "🚀";
      tagline = "Buying into social trends, meme stocks, and group plans to avoid being left behind.";
      traits = ["Peer-driven", "Spontaneous", "Highly digital"];
      trigger = "Fear of missing out on shared social memories or quick financial gains";
      risk = "High";
      debias = [
        { step: "Social Outing Budgets", action: "Pre-fund group activities in a separate pocket wallet", science: "Mental accounting sets hard visual boundaries on peer-pressured spend." }
      ];
      strengths = ["Early adopter of tech and investment trends", "Rich social network"];
      watchOuts = ["Extreme portfolio volatility from hype investing", "Dwindling savings"];
      compatible = ["The Balanced Strategist"];
      impact = "₹10,000 - ₹18,000 in trend-induced leakage";
    } else if (isImpulse) {
      type = "The Impulse Architect";
      emoji = "⚡";
      tagline = "Executing rapid purchases for immediate gratification and mood enhancement.";
      traits = ["Spontaneous", "Dopamine-driven", "Convenience-focused"];
      trigger = "One-click checkouts and targeted social media ads";
      risk = "High";
      debias = [
        { step: "Friction Injection", action: "Remove saved cards from online shopping sites", science: "Extra steps break the automated, unconscious buy loop." }
      ];
      strengths = ["Decisive", "Unbound by rigid budgeting rules"],
      watchOuts = ["Buyer remorse", "Unused subscriptions and products"],
      compatible = ["The Safety Hoarder"];
      impact = "₹12,000 - ₹20,000 in instant-buy leakage";
    } else if (isGuilt) {
      type = "The Guilt Spender";
      emoji = "😔";
      tagline = "Spending money to cope with emotional distress, followed by immediate regret.";
      traits = ["Emotion-driven", "Compulsive shopping", "Post-buy anxiety"];
      trigger = "High stress, exhaustion, or arguments";
      risk = "Medium";
      debias = [
        { step: "Mood-to-Spend Audit", action: "Log emotional state before completing any purchase", science: "Promotes self-awareness, decoupling emotion from action." }
      ];
      strengths = ["Deep empathy", "High self-reflection potential"],
      watchOuts = ["Cycles of stress-spend-guilt", "Hoarding clutter"],
      compatible = ["The Balanced Strategist"];
      impact = "₹5,000 - ₹10,000 in emotional compensation";
    }

    return JSON.stringify({
      personalityType: type,
      personalityEmoji: emoji,
      tagline: tagline,
      traits: traits,
      coreTrigger: trigger,
      riskLevel: risk,
      debiasSteps: debias,
      compatibleTypes: compatible,
      financialImpactEstimate: impact,
      strengths: strengths,
      watchOuts: watchOuts
    });
  }

  // 2. UPI FRAUD & SCAM SHIELD
  if (systemMsg.includes('forensic analyst specializing in UPI fraud') || systemMsg.includes('scamArchetype')) {
    const text = userMsg.replace("Analyze this:", "").trim().toLowerCase();
    let prob = 10;
    let verdict = "SAFE";
    let emoji = "✅";
    let archetype = "Safe";
    let tactics = ["None"];
    let flags = [];
    let estLoss = "₹0";
    let checklist = [{ priority: "MEDIUM", action: "No special actions needed. Verify normal transaction habits." }];
    let safeguard = "Always verify the receiver's identity before making any transaction.";

    if (text.includes("part-time") || text.includes("job") || text.includes("telegram") || text.includes("like") || text.includes("earn") || text.includes("youtube")) {
      prob = 95;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "Job Scam";
      tactics = ["Greed", "Urgency", "Easy Money"];
      flags = [
        { flag: "Prepaid tasks to earn higher commissions", explanation: "Scammers pay small amounts first to build trust, then lock larger deposits." },
        { flag: "Communication shifted to Telegram/WhatsApp", explanation: "Legitimate businesses do not hire or coordinate via unregulated chat groups." }
      ];
      estLoss = "₹50,000 - ₹5,00,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Do NOT transfer any money or provide bank details." },
        { priority: "HIGH", action: "Block the recruiter on WhatsApp/Telegram immediately." },
        { priority: "HIGH", action: "Report the phone numbers/group links on Cybercrime portal." }
      ];
      safeguard = "No legitimate company requests payment or deposit to process part-time work or likes tasks.";
    } else if (text.includes("electricity") || text.includes("bill") || text.includes("disconnect") || text.includes("power")) {
      prob = 98;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "Utility Bill Scam";
      tactics = ["Fear", "Urgency", "Authority"];
      flags = [
        { flag: "Threat of immediate disconnection within hours", explanation: "Electricity boards never disconnect services instantly without official written notice." },
        { flag: "Call this specific mobile number to update status", explanation: "Official customer service numbers are never personal mobile phones." }
      ];
      estLoss = "₹10,000 - ₹1,50,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Do NOT call the mobile number listed in the SMS." },
        { priority: "HIGH", action: "Check your billing status directly on the official power company utility portal/app." },
        { priority: "MEDIUM", action: "Warn family members of this message format." }
      ];
      safeguard = "Always check utility bill status on the official electricity supplier portal. Never call numbers from SMS warning messages.";
    } else if (text.includes("kyc") || text.includes("pan") || text.includes("aadhar") || text.includes("suspend") || text.includes("block")) {
      prob = 92;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "Fake KYC";
      tactics = ["Fear", "Urgency", "Authority"];
      flags = [
        { flag: "Account will block within 24 hours", explanation: "Banks do not send SMS threats demanding immediate KYC updates via unverified links." },
        { flag: "HTTP/unsecured links in SMS", explanation: "Banks utilize official secure HTTPS domains (e.g. netbanking.bankname.com) rather than short-links." }
      ];
      estLoss = "₹25,000 - ₹3,00,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Do NOT click the link provided in the message." },
        { priority: "HIGH", action: "Verify KYC status directly by logging into your official bank application." },
        { priority: "MEDIUM", action: "Contact your bank manager if you are still concerned." }
      ];
      safeguard = "Banks never ask for sensitive credentials, PINs, or KYC updates through text message links.";
    } else if (text.includes("otp") || text.includes("verification code") || text.includes("send code")) {
      prob = 90;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "OTP Harvesting";
      tactics = ["Fear", "Authority"];
      flags = [
        { flag: "Demanding OTP to verify transactions or prevent blocks", explanation: "OTP is a password signature. Sharing it gives scammers full authorization." }
      ];
      estLoss = "₹5,000 - ₹50,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Never share OTP, PIN, or password with anyone calling on behalf of bank/telecom." },
        { priority: "HIGH", action: "Change bank login passwords immediately if you feel compromised." }
      ];
      safeguard = "Treat OTPs as your ATM PIN. No legitimate agent will ever request it.";
    } else if (text.includes("courier") || text.includes("customs") || text.includes("drug") || text.includes("fedex") || text.includes("police") || text.includes("arrest") || text.includes("illegal")) {
      prob = 99;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "Phishing";
      tactics = ["Fear", "Authority", "Urgency"];
      flags = [
        { flag: "Claims of illegal drugs found in courier under your Aadhar", explanation: "Law enforcement does not perform investigation/interrogation on Skype/WhatsApp video calls." },
        { flag: "Demanding money to clear custom duty or verify funds", explanation: "Government entities never demand transfer to personal bank accounts for 'fund verification'." }
      ];
      estLoss = "₹1,00,000 - ₹25,00,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Disconnect the call/ignore instructions immediately. Do NOT pay anything." },
        { priority: "HIGH", action: "File an immediate complaint on national cybercrime portal (cybercrime.gov.in)." },
        { priority: "HIGH", action: "Inform your local police station if threats continue." }
      ];
      safeguard = "Police and customs officials do not lock people under 'digital house arrest' or demand private funds transfer over video chats.";
    } else if (text.includes("investment") || text.includes("crypto") || text.includes("profit") || text.includes("guaranteed") || text.includes("double")) {
      prob = 85;
      verdict = "DANGER";
      emoji = "🚨";
      archetype = "Investment Fraud";
      tactics = ["Greed", "Authority"];
      flags = [
        { flag: "Guaranteed high returns (e.g. 5-10% daily/weekly)", explanation: "No legal asset class provides guaranteed high returns without corresponding extreme risk or fraud." },
        { flag: "Unregistered investment group or platform", explanation: "SEBI regulations prohibit unregistered entities from offering advisory services or investment pools." }
      ];
      estLoss = "₹50,000 - ₹10,00,000";
      checklist = [
        { priority: "IMMEDIATE", action: "Do NOT transfer money. Avoid any unregistered platforms." },
        { priority: "HIGH", action: "Check the advisor's SEBI registration number on the official SEBI directory." }
      ];
      safeguard = "Always check SEBI registration before investing. Avoid groups promising guaranteed risk-free profits.";
    } else {
      if (text.length > 15) {
        prob = 45;
        verdict = "SUSPICIOUS";
        emoji = "⚠️";
        archetype = "Other";
        tactics = ["Curiosity"];
        flags = [
          { flag: "Unusual offer or unsolicited message format", explanation: "Unexpected messages urging actions or containing links represent potential entry vectors." }
        ];
        estLoss = "₹500 - ₹5,000";
        checklist = [
          { priority: "HIGH", action: "Verify the sender's identity through alternative trusted channels." },
          { priority: "MEDIUM", action: "Do not tap on unexpected web links." }
        ];
        safeguard = "Remain vigilant when receiving text requests from unknown senders.";
      }
    }

    return JSON.stringify({
      fraudProbability: prob,
      verdict: verdict,
      verdictEmoji: emoji,
      scamArchetype: archetype,
      psychologicalTactics: tactics,
      redFlags: flags,
      estimatedVictimLoss: estLoss,
      actionChecklist: checklist,
      reportingLinks: ["https://cybercrime.gov.in"],
      safeguardTip: safeguard
    });
  }

  // 3. COST OF LIVING RADAR
  if (systemMsg.includes('Indian urban economist') || systemMsg.includes('livabilityScore')) {
    let city1 = "City A";
    let city2 = "City B";
    let salary = 80000;

    const m = userMsg.match(/Compare\s+([^v]+)\s+vs\s+([^.]+)/i);
    if (m) {
      city1 = m[1].trim();
      city2 = m[2].trim();
    }
    const salMatch = userMsg.match(/salary:\s*₹?\s*(\d+)/i);
    if (salMatch) {
      salary = parseInt(salMatch[1]);
    }

    const cityStats = {
      mumbai: { name: "Mumbai", rent1: 28000, rent2: 48000, grocery: 7000, transport: 4500, dining: 800, internet: 750, safety: 85, aqi: "Poor", commute: 55, livability: 78 },
      bangalore: { name: "Bangalore", rent1: 18000, rent2: 32000, grocery: 6500, transport: 4000, dining: 600, internet: 700, safety: 78, aqi: "Moderate", commute: 50, livability: 82 },
      delhi: { name: "Delhi", rent1: 16000, rent2: 28000, grocery: 6000, transport: 3500, dining: 600, internet: 650, safety: 65, aqi: "Hazardous", commute: 45, livability: 70 },
      gurgaon: { name: "Gurgaon", rent1: 22000, rent2: 38000, grocery: 7000, transport: 4000, dining: 750, internet: 700, safety: 70, aqi: "Poor", commute: 40, livability: 75 },
      pune: { name: "Pune", rent1: 13000, rent2: 23000, grocery: 5500, transport: 3000, dining: 500, internet: 650, safety: 82, aqi: "Moderate", commute: 35, livability: 80 },
      hyderabad: { name: "Hyderabad", rent1: 12000, rent2: 22000, grocery: 5500, transport: 3000, dining: 500, internet: 650, safety: 80, aqi: "Moderate", commute: 35, livability: 81 },
      chennai: { name: "Chennai", rent1: 11000, rent2: 20000, grocery: 5800, transport: 2800, dining: 450, internet: 600, safety: 85, aqi: "Good", commute: 35, livability: 79 },
      kolkata: { name: "Kolkata", rent1: 8000, rent2: 15000, grocery: 5000, transport: 2200, dining: 400, internet: 600, safety: 82, aqi: "Moderate", commute: 40, livability: 72 }
    };

    const getStats = (name) => {
      const k = name.toLowerCase().trim();
      for (const key in cityStats) {
        if (k.includes(key) || key.includes(k)) return cityStats[key];
      }
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const level = hash % 3;
      if (level === 0) {
        return { name: name, rent1: 9000, rent2: 16000, grocery: 5000, transport: 2000, dining: 400, internet: 600, safety: 80, aqi: "Good", commute: 30, livability: 72 };
      } else if (level === 1) {
        return { name: name, rent1: 14000, rent2: 24000, grocery: 5800, transport: 3200, dining: 550, internet: 650, safety: 75, aqi: "Moderate", commute: 38, livability: 78 };
      } else {
        return { name: name, rent1: 20000, rent2: 35000, grocery: 6800, transport: 4200, dining: 700, internet: 700, safety: 72, aqi: "Poor", commute: 48, livability: 76 };
      }
    };

    const stats1 = getStats(city1);
    const stats2 = getStats(city2);

    const rent1 = stats1.rent2;
    const rent2 = stats2.rent2;
    const food1 = stats1.grocery * 1.5 || 9000;
    const food2 = stats2.grocery * 1.5 || 9000;
    const t1 = stats1.transport * 2 || 6000;
    const t2 = stats2.transport * 2 || 6000;
    const o1 = stats1.internet || 700;
    const o2 = stats2.internet || 700;

    const total1 = rent1 + food1 + t1 + o1 + 5000;
    const total2 = rent2 + food2 + t2 + o2 + 5000;

    const cheaperCity = total1 < total2 ? stats1.name : stats2.name;
    const monthlySavings = Math.abs(total1 - total2);
    const annualSavings = monthlySavings * 12;

    const ratio = total2 / total1;
    const equivalent = Math.round(salary * ratio);

    const recommendation = `Relocating from ${stats1.name} to ${stats2.name} represents a ${ratio > 1 ? 'higher cost structure' : 'net saving potential'}. Rent arbitrage and daily transport commute profiles will represent the biggest swing variables in your net monthly disposable surplus.`;
    const idealFor = total1 < total2 ? `${stats1.name} is ideal for budget-conscious wealth acceleration, while ${stats2.name} suits fast-paced career advancement.` : `${stats2.name} is ideal for saving-focused wealth building, while ${stats1.name} suits lifestyle upgrades.`;

    return JSON.stringify({
      city1: {
        name: stats1.name,
        avgRent1BHK: stats1.rent1,
        avgRent2BHK: stats1.rent2,
        groceryMonthly: stats1.grocery,
        transportMonthly: stats1.transport,
        diningOutOnce: stats1.dining,
        internetMonthly: stats1.internet,
        livabilityScore: stats1.livability,
        safetyScore: stats1.safety,
        airQualityIndex: stats1.aqi,
        avgCommuteMinutes: stats1.commute,
        totalMonthlyCost: total1
      },
      city2: {
        name: stats2.name,
        avgRent1BHK: stats2.rent1,
        avgRent2BHK: stats2.rent2,
        groceryMonthly: stats2.grocery,
        transportMonthly: stats2.transport,
        diningOutOnce: stats2.dining,
        internetMonthly: stats2.internet,
        livabilityScore: stats2.livability,
        safetyScore: stats2.safety,
        airQualityIndex: stats2.aqi,
        avgCommuteMinutes: stats2.commute,
        totalMonthlyCost: total2
      },
      verdict: {
        cheaperCity: cheaperCity,
        monthlySavings: monthlySavings,
        annualSavings: annualSavings,
        salaryEquivalent: `Your ₹${salary.toLocaleString('en-IN')} salary in ${stats1.name} matches purchasing power of ₹${equivalent.toLocaleString('en-IN')} in ${stats2.name}`,
        recommendation: recommendation,
        idealFor: idealFor
      },
      categories: [
        { name: "Rent (2BHK)", city1Value: rent1, city2Value: rent2 },
        { name: "Groceries", city1Value: food1, city2Value: food2 },
        { name: "Commute", city1Value: t1, city2Value: t2 },
        { name: "Utilities", city1Value: o1, city2Value: o2 }
      ]
    });
  }

  // 4. SMART BILL NEGOTIATOR
  if (systemMsg.includes('master negotiator') || userMsg.includes('Bill Type:')) {
    let type = "Broadband";
    let provider = "Airtel";
    let plan = "100 Mbps Plan";
    let cost = "999";

    const typeMatch = userMsg.match(/Bill Type:\s*([^,]+)/i);
    const provMatch = userMsg.match(/Provider:\s*([^,]+)/i);
    const planMatch = userMsg.match(/Current Plan:\s*([^,]+)/i);
    const costMatch = userMsg.match(/Monthly Cost:\s*₹?\s*(\d+)/i);

    if (typeMatch) type = typeMatch[1].trim();
    if (provMatch) provider = provMatch[1].trim();
    if (planMatch) plan = planMatch[1].trim();
    if (costMatch) cost = costMatch[1].trim();

    const targetCost = Math.round(parseFloat(cost) * 0.75);

    return `### 📊 Market Rate Check
You are currently paying **₹${cost}** to **${provider}** for your **${type}** (${plan}).
- **National Average Benchmark**: ₹${Math.round(cost * 0.82)} for equivalent services.
- **Overpayment Delta**: You are paying approximately **18%-25%** above optimal market rates.

---

### 📞 Word-for-Word Negotiation Call Script
*Call ${provider} customer support (press options to reach "Cancellation/Retention" directly):*

> **You:** "Hello, I am calling because I am reviewing my monthly expenses and notice my ${type} bill is ₹${cost}/month. I've been with you for a long time, but competitor plans are now significantly cheaper for the same speed/benefits. I'd like to check if you have any retention offers, or if I should raise a cancellation request to switch."
>
> **Agent:** *"Let me check what plans we have. I can offer you a ₹50 discount."*
>
> **You:** "Thank you, but that still leaves it much higher than competitor offerings. Competitors are offering equivalent connections for around ₹${targetCost}/month with zero installation fee. If we can adjust my monthly rental to **₹${targetCost}** or upgrade my speeds/benefits at the current price, I will stay. Otherwise, please register my cancellation request and transfer me to the disconnect executive."

---

### 🔍 Best Competitor Alternatives
1. **Premium Telecom Fiber**: ₹699/month for 100 Mbps, free router.
2. **Local Broadband Operator**: ₹749/month with unlimited data and regional streaming benefits.
3. **Regional Cable Utility**: ₹599/month for high-speed backup connection.

---

### 🚧 Escalation Tactics (If first support tier rejects)
- **Demand cancellation ticket**: Do not back down. Retention teams only step in once an actual cancellation request is queued in the system.
- **Check email box**: Within 24-48 hours of cancellation scheduling, you will receive a VIP retention call offering up to 30% discount or 3 months free.
- **Utilize bill cycle timing**: Initiate this 5 days before your current billing cycle expires.

---

### 📈 Probability of Success: **85%**
*(Retention teams have pre-approved authority to issue 15-30% loyalty discounts to long-term paying users who mention active cancellation and competitor benchmarks)*`;
  }

  // 5. PURCHASE TIMING ORACLE
  if (systemMsg.includes('consumer market intelligence expert') || systemMsg.includes('currentHeat')) {
    let product = "Smartphone";
    let price = "50000";

    const pMatch = userMsg.match(/Product:\s*([^.]+)/i);
    const prMatch = userMsg.match(/Current Price:\s*₹?\s*(\d+)/i);

    if (pMatch) product = pMatch[1].trim();
    if (prMatch) price = prMatch[1].trim();

    const currentPriceNum = parseFloat(price);
    const saleDiscount = Math.round(currentPriceNum * 0.18);
    const salePrice = currentPriceNum - saleDiscount;

    return JSON.stringify({
      currentHeat: "Fair",
      heatScore: 55,
      heatColor: "yellow",
      verdict: "Wait",
      verdictReason: `Prices for ${product} are stable right now but a major retail discount cycle is approaching in less than 30 days. Waiting will unlock significant credit card cashbacks and instant discounts.`,
      bestMonthToBuy: "October",
      bestSaleEvent: "Diwali Fest / Big Billion Days",
      estimatedDiscount: "15% - 22% off",
      daysToWait: 21,
      priceHistory: [
        { event: "Diwali Sale", discount: "20% off", month: "Oct" },
        { event: "Republic Day Sale", discount: "12% off", month: "Jan" },
        { event: "Summer Fest", discount: "8% off", month: "May" }
      ],
      alternativeProducts: [
        { name: `${product} (Previous Gen)`, price: `₹${Math.round(currentPriceNum * 0.75).toLocaleString('en-IN')}`, reason: "Delivers 95% of performance at a 25% discount margin" },
        { name: "Competitor Equivalent Model", price: `₹${Math.round(currentPriceNum * 0.85).toLocaleString('en-IN')}`, reason: "Better battery capacity and faster standard charging bundle" }
      ],
      pricePrediction: `Prices are projected to fall by ~12% within the next month as distributors clear inventory for new quarterly releases.`,
      confidenceLevel: "High"
    });
  }

  // 6. EMI & LOAN TRAP DETECTOR
  if (systemMsg.includes('forensic financial auditor') || systemMsg.includes('trueAPR')) {
    let apr = "18.5%";
    let principal = 50000;
    let emi = 4800;
    let months = 12;

    const aprMatch = userMsg.match(/Calculated APR:\s*([\d.]+)%/i);
    const pMatch = userMsg.match(/Principal:\s*₹?\s*(\d+)/i);
    const eMatch = userMsg.match(/EMI:\s*₹?\s*(\d+)/i);
    const mMatch = userMsg.match(/Months:\s*(\d+)/i);

    if (aprMatch) apr = `${aprMatch[1]}%`;
    if (pMatch) principal = parseFloat(pMatch[1]);
    if (eMatch) emi = parseFloat(eMatch[1]);
    if (mMatch) months = parseInt(mMatch[1]);

    const totalPaid = emi * months;
    const extra = totalPaid - principal;
    const pfee = Math.round(principal * 0.02);
    const extraCostText = `₹${extra.toLocaleString('en-IN')} above cash price`;

    let level = "Moderate Trap";
    let score = 55;
    let verdict = "A standard finance offer where frontloaded processing fees and interest inflate the effective rate.";
    if (parseFloat(apr) > 24) {
      level = "Severe Trap";
      score = 88;
      verdict = "WARNING: Highly predatory interest rates. Effective cost is extremely high due to fee capitalization.";
    } else if (parseFloat(apr) < 13) {
      level = "Safe";
      score = 15;
      verdict = "Fair offer. The APR matches baseline bank lending rates without major hidden markups.";
    }

    return JSON.stringify({
      trueAPR: apr,
      advertisedRate: "11% Flat Interest",
      isZeroEMIActuallyFree: false,
      hiddenCosts: [
        { name: "Processing Fees", amount: `₹${pfee}`, impact: "Adds ~2.1% to effective interest rate" },
        { name: "GST on Fee & Interest", amount: `₹${Math.round(pfee * 0.18)}`, impact: "State tax addition on servicing charges" }
      ],
      totalExtraCost: extraCostText,
      trapLevel: level,
      trapScore: score,
      verdict: verdict,
      betterAlternatives: [
        { option: "Upfront Cash Discount", saving: `₹${Math.round(principal * 0.05)}`, pros: "Many retailers offer 5% off for full immediate payment" },
        { option: "Credit Card EMI", rate: "13.5% APR", saving: "Lower processing charges and transparent amortizations" }
      ],
      shouldAccept: score < 40,
      redFlagTerms: ["Prepayment penalty clause", "Ad-hoc documentation processing fees"],
      keyAdvice: "Request a complete written breakdown showing the total net outflow before submitting OTP approval."
    });
  }

  // 7. IMPULSE BUY THERAPIST
  if (systemMsg.includes('CBT-trained behavioral finance therapist') || systemMsg.includes('emotionalTrigger')) {
    let item = "Gadget";
    let price = "15000";
    let reason = "To make work easier";
    let income = "75000";

    const itemMatch = userMsg.match(/Item:\s*([^,]+)/i);
    const prMatch = userMsg.match(/Price:\s*₹?\s*(\d+)/i);
    const rMatch = userMsg.match(/Reason given:\s*"([^"]+)"/i);
    const iMatch = userMsg.match(/Monthly Income:\s*₹?\s*(\d+)/i);

    if (itemMatch) item = itemMatch[1].trim();
    if (prMatch) price = prMatch[1].trim();
    if (rMatch) reason = rMatch[1].trim();
    if (iMatch) income = iMatch[1].trim();

    const priceNum = parseFloat(price);
    const incomeNum = parseFloat(income) || 60000;
    const ratio = Math.round((priceNum / incomeNum) * 100);

    const sip5Y = Math.round(priceNum * Math.pow(1.12, 5));

    return JSON.stringify({
      emotionalTrigger: "Reward Seeking",
      triggerExplanation: `You are justifying this ₹${priceNum} purchase as a 'productivity helper' to reward yourself, but the core driver is the immediate dopamine rush of unboxing new tech.`,
      needVsWant: "Want",
      needScore: 35,
      "72HourRule": `Wait 72 hours. If the urge is still at the same intensity, you can proceed. Usually, the desire declines by 60% once the initial impulse cycle clears.`,
      cbtAnalysis: "This purchase represents compensation. When work/life stress is high, we purchase items representing 'control' or 'optimization' to offset mental exhaustion.",
      affordabilityVerdict: `This single item consumes ${ratio}% of your net monthly take-home salary.`,
      prosAndCons: {
        pros: ["Increases convenience", "Brief motivational boost"],
        cons: ["Reduces disposable surplus this month", "Does not solve underlying fatigue/boredom"]
      },
      finalVerdict: "WAIT 72 HOURS",
      verdictEmoji: "⏳",
      verdictReason: "Delaying this will save you from post-purchase remorse. Re-evaluate on day 3 with a clear mind.",
      alternativeAction: "Watch a high-quality review or borrow a similar tool to see if the utility matches your expectations.",
      willingToWait: true,
      coinsEarned: 50,
      savingsOpportunity: `If invested in an equity SIP instead, this ₹${priceNum.toLocaleString('en-IN')} grows to ₹${sip5Y.toLocaleString('en-IN')} in 5 years (at 12% CAGR)`
    });
  }

  // 8. FINANCIAL NEWS NOISE CANCELER
  if (systemMsg.includes('calm, rational financial expert') || systemMsg.includes('panicScore')) {
    let headline = "MARKETS CRASH 2000 POINTS";
    let portfolio = "Long-term SIP investor";

    const hMatch = userMsg.match(/Headline:\s*"([^"]+)"/i);
    const pMatch = userMsg.match(/portfolio type:\s*([^\n]+)/i);

    if (hMatch) headline = hMatch[1].trim();
    if (pMatch) portfolio = pMatch[1].trim();

    const hUpper = headline.toUpperCase();
    let panic = 5;
    let verdict = "MONITOR";
    let move = "Nifty down 1.2%";
    let exaggeration = "Predicting total economic collapse based on normal global liquidity adjustments";

    if (hUpper.includes("CRASH") || hUpper.includes("SELLOFF") || hUpper.includes("SLIDE") || hUpper.includes("MARGIN") || hUpper.includes("CONTRACTION")) {
      panic = 8;
      verdict = "IGNORE";
      move = "Nifty corrected ~1.8% from peak";
      exaggeration = "Sensationalizing a healthy market correction as a 'crash' to trigger retail panic selling.";
    } else if (hUpper.includes("WAR") || hUpper.includes("GEOPOLITICAL") || hUpper.includes("ATTACK") || hUpper.includes("CRUDE")) {
      panic = 9;
      verdict = "MONITOR";
      move = "Crude futures up 3.5%, gold up 1.5%";
      exaggeration = "Extrapolating localized geopolitical friction into a global trade freeze scenario.";
    } else if (hUpper.includes("INFLATION") || hUpper.includes("FED") || hUpper.includes("HIKE") || hUpper.includes("RATE")) {
      panic = 6;
      verdict = "IGNORE";
      move = "Bond yields fluctuated by 12 basis points";
      exaggeration = "Stating minor central bank rate commentary as an imminent interest rate disaster.";
    }

    return `{"panicScore": ${panic}, "verdict": "${verdict}", "actualMove": "${move}", "mediaExaggeration": "${exaggeration}"}

### What Actually Happened (Data-Driven Assessment)
The media headlines are highlighting dramatic numbers to capture attention. In reality, the market index experienced a standard institutional profit-booking cycle, typical for this point in the fiscal quarter. Domestic institutional net purchases remain highly supportive, and corporate earnings yield ratios indicate robust structural health across major sectors.

### Historical Context & Similar Events
Similar panic headlines were printed during market consolidations in 2021 and 2023. Historically, the Indian market has fully recovered from correction dips of 3% to 7% within an average span of 25 to 45 trading sessions. Long-term historical data proves that buying the dip or maintaining systemic investments during these headlines has consistently outperformed cash holding.

### Recommended Action for a ${portfolio}
As a **${portfolio}**, your optimal response is **complete inaction**. The market noise is designed to trigger emotional selling, which locks in temporary paper losses. Keep your systematic investment plans (SIPs) running; lower prices allow your recurring investment to buy more mutual fund units (rupee cost averaging). Maintain your equity allocation without ad-hoc manual adjustments.`;
  }

  // 9. FINANCIAL AUTOPSY
  if (systemMsg.includes('cognitive psychologist and behavioral finance auditor') || systemMsg.includes('cognitiveBias')) {
    let bias = "Disposition Effect";
    let diagnosis = "You are holding onto a declining asset hoping to break even, which represents classic loss aversion.";
    let debias = "Establish a pre-written stop-loss limit for every stock purchase and automate exits.";

    if (userMsg.toLowerCase().includes("gold") || userMsg.toLowerCase().includes("fd")) {
      bias = "Loss Aversion";
      diagnosis = "Your preference for gold or fixed deposit despite missing out on long-term equity growth highlights high safety bias.";
      debias = "Allocate a minor percentage (e.g. 15%) to index mutual funds to learn to tolerate small price swings.";
    } else if (userMsg.toLowerCase().includes("hype") || userMsg.toLowerCase().includes("friend") || userMsg.toLowerCase().includes("crypto")) {
      bias = "Herd Mentality";
      diagnosis = "Entering high-volatility products purely based on social proof and FOMO signals lack of asset-level conviction.";
      debias = "Never buy an asset unless you can explain its core business model and cash flow generator in three sentences.";
    }

    return JSON.stringify({
      cognitiveBias: bias,
      emotionalTrigger: "Regret Minimization and Fear of realizing a loss.",
      diagnosis: diagnosis,
      debiasAction: debias,
      lossAversionScore: 75,
      fomoScore: 45,
      statusQuoScore: 60,
      recencyScore: 50
    });
  }

  // 10. MACRO SHOCK SIMULATION
  if (systemMsg.includes('global macro investment strategist') || systemMsg.includes('macroeconomic shifts')) {
    return `### Global and Domestic Equity/Bond Ripple Effects
The simulated interest rate shifts are driving capital reallocation across markets. Higher interest rates typically attract capital into government debt securities, increasing bond yields and applying pressure on equity market valuations. Emerging markets (like India) may experience short-term foreign institutional investor (FII) outflows as global funds flow back to higher-yielding US treasuries.

### Commodities and inflation Purchasing Power
Elevated oil prices directly impact consumer price indices in importing nations, increasing transport and raw material costs. Corporate operating margins are likely to compress, prompting companies to pass cost increases to consumers, which creates sticky inflation. Purchasing power faces headwind pressures, making budget defense vital.

### Tactical Asset Allocation Positioning
1. **Equity to Debt Shift**: Accumulate short-to-medium duration debt mutual funds to lock in elevated yields while equities undergo consolidation.
2. **Gold Hedge**: Maintain a 10%-15% exposure in Sovereign Gold Bonds (SGBs) or Gold ETFs as a hedge against geopolitical volatility and currency depreciation.
3. **Focus on Large-caps**: Prefer high-quality, cash-rich large-cap equities with pricing power that can withstand inflationary headwinds.`;
  }

  // 11. DEBT REFINANCE ANALYSIS
  if (systemMsg.includes('credit auditor specializing in personal debt management') || systemMsg.includes('consolidation target personal loan')) {
    return `### Debt Consolidation Audit & Analysis
Your current debt profile shows interest rate dispersion and repayment complexity. Consolidating high-cost credit card debts and high-interest personal loans into a single personal loan structure makes high economic sense to stop interest leakage.

Consolidation will streamline your cash flow into a single monthly EMI, reducing administrative oversight and lowering your aggregate debt-servicing ratio. This step will prevent credit score degradation caused by accidental missed payments across multiple cards.

However, check for prepay and foreclosure penalty clauses on your existing loans. Ensure that the total processing fee and stamp duty on the new consolidated loan does not exceed 2% of the principal, as higher setup costs would erode the interest savings arbitrage.`;
  }

  // 12. SWP TAX ADVICE
  if (systemMsg.includes('certified financial planner and tax expert') || systemMsg.includes('tax harvesting layout')) {
    return `### 🌾 Equity LTCG Tax Harvesting Layout
- **Exemption Optimization**: Under Section 112A, the first ₹1.25 Lakh of long-term capital gains (assets held > 12 months) from equity shares or equity-oriented mutual funds is completely tax-free every financial year.
- **Action Plan**: Redeem mutual fund units annually up to the limit of ₹1.25L in capital gains, and immediately reinvest the principal. This resets your buy cost basis higher, permanently escaping LTCG tax on that growth slab.

### 🛡️ Debt SWP Slab Rate Management
- **Slab Drag Defense**: Gains from debt mutual funds purchased after April 1, 2023, are taxed at your marginal slab rate. To mitigate this tax drag, schedule withdrawals during low-income years or retirement when your overall slab bracket drops.
- **Arbitrage Plan**: Utilize arbitrage funds or hybrid equity funds (which enjoy equity tax status) if your withdrawal horizon is 1 to 3 years. This keeps your tax liability capped at 15% (STCG) or 12.5% (LTCG) instead of high marginal slabs.

### 🚨 Stress & Crash Guardrails
- **Sequence of Returns Risk (SRR)**: During a Year 1 market crash, avoid withdrawing from equity holdings, as this depletes units at market bottoms. Keep 12 to 18 months of SWP payouts in liquid debt funds or arbitrage funds to draw from, letting your equity recover.
- **Guyton-Klinger Rules**: If your portfolio value declines below a threshold, suspend the annual withdrawal step-up or reduce the monthly withdrawal rate by 10% to preserve capital runway.`;
  }

  return "All AI systems are busy. Please try again in a few moments.";
};

const getAI = async (messages, maxTokens = 2000, jsonMode = true) => {
  try {
    const format = jsonMode ? { type: 'json_object' } : null;
    return await getAICompletion(messages, maxTokens, format);
  } catch (err) {
    console.warn("All cloud AI providers failed. Using local heuristic fallback engine...");
    return getLocalAIResponse(messages);
  }
};

const parseJSON = (text) => {
  try { const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : null; } catch { return null; }
};

// ─── SSE Streaming Helper ──────────────────────────────────
const streamAI = async (res, systemPrompt, userPrompt) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  try {
    const text = await getAI([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], 2000, false);
    const words = text.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 18));
    }
    res.write('data: [DONE]\n\n');
  } catch (e) { res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`); }
  res.end();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. SPENDING DNA PROFILER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const spendingDNA = async (req, res) => {
  try {
    const { answers } = req.body;
    // answers: array of { question, answer } from 7 behavioral questions
    const answerText = answers.map((a, i) => `Q${i+1}: ${a.question}\nAnswer: ${a.answer}`).join('\n\n');

    let localHistoryInfo = "";
    try {
      const expenses = await Expense.find({
        $or: [
          { paidBy: req.user._id },
          { 'splits.user': req.user._id }
        ]
      });
      const localAnalysis = analyzeSpendingPersonality(expenses);
      if (localAnalysis) {
        localHistoryInfo = `
Real-world expense transaction records for this user (combine this with their quiz answers for accurate profiling):
- Auto-calculated Personality: ${localAnalysis.personality}
- Total Expenditure tracked on this app: ₹${localAnalysis.totalAmount}
- Category distribution percentages: ${JSON.stringify(localAnalysis.percentages)}
`;
      }
    } catch (err) {
      console.error("Local spending personality calculation failed:", err);
    }

    const system = `You are a behavioral finance psychologist. Based on 7 behavioral answers and their real-world expense data, classify the user's spending personality.
Return ONLY JSON:
{
  "personalityType": "The Impulse Architect|The Safety Hoarder|The Status Chaser|The Balanced Strategist|The FOMO Spender|The Guilt Spender",
  "personalityEmoji": "🎯",
  "tagline": "one punchy line",
  "traits": ["trait1","trait2","trait3"],
  "coreTrigger": "The #1 psychological reason they overspend",
  "riskLevel": "Low|Medium|High",
  "debiasSteps": [{"step": "Step title", "action": "Concrete action", "science": "Behavioral science backing"}],
  "compatibleTypes": ["type1"],
  "financialImpactEstimate": "Estimated monthly over-spend due to this personality",
  "strengths": ["strength1","strength2"],
  "watchOuts": ["watchout1","watchout2"]
}`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: `${answerText}\n\n${localHistoryInfo}` }], 1500);
    const result = parseJSON(raw);
    if (!result) throw new Error('AI parse failed');
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. UPI FRAUD & SCAM SHIELD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const fraudShield = async (req, res) => {
  try {
    const { message } = req.body;
    const system = `You are India's top cybercrime forensic analyst specializing in UPI fraud and digital scams.
Analyze the message and return ONLY JSON:
{
  "fraudProbability": 0-100,
  "verdict": "SAFE|SUSPICIOUS|DANGER",
  "verdictEmoji": "✅|⚠️|🚨",
  "scamArchetype": "Pig Butchering|OTP Harvesting|Fake KYC|Investment Fraud|Prize Scam|Phishing|Job Scam|Loan Shark|Safe|Other",
  "psychologicalTactics": ["Urgency","Authority","Fear","Greed"],
  "redFlags": [{"flag": "specific red flag text from message", "explanation": "why this is dangerous"}],
  "estimatedVictimLoss": "typical loss range for this scam type",
  "actionChecklist": [{"priority": "IMMEDIATE|HIGH|MEDIUM", "action": "exact step to take"}],
  "reportingLinks": ["https://cybercrime.gov.in"],
  "safeguardTip": "one key tip to prevent this scam category"
}`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: `Analyze this: "${message}"` }], 1200);
    const result = parseJSON(raw);
    if (!result) throw new Error('Parse failed');
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. COST OF LIVING RADAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const costOfLivingRadar = async (req, res) => {
  try {
    const { city1, city2, salary } = req.body;
    const system = `You are an Indian urban economist with deep knowledge of city-level costs.
Compare two cities and return ONLY JSON:
{
  "city1": {
    "name": "City Name",
    "avgRent1BHK": 15000,
    "avgRent2BHK": 25000,
    "groceryMonthly": 6000,
    "transportMonthly": 3000,
    "diningOutOnce": 500,
    "internetMonthly": 700,
    "livabilityScore": 72,
    "safetyScore": 80,
    "airQualityIndex": "Moderate",
    "avgCommuteMinutes": 45,
    "totalMonthlyCost": 45000
  },
  "city2": { /* same structure */ },
  "verdict": {
    "cheaperCity": "City Name",
    "monthlySavings": 8000,
    "annualSavings": 96000,
    "salaryEquivalent": "Your ₹X salary in City1 equals ₹Y in City2",
    "recommendation": "2-sentence AI recommendation",
    "idealFor": "Best suited for which lifestyle"
  },
  "categories": [
    {"name": "Rent", "city1Value": 15000, "city2Value": 22000},
    {"name": "Groceries", "city1Value": 6000, "city2Value": 7000},
    {"name": "Transport", "city1Value": 3000, "city2Value": 4500},
    {"name": "Dining", "city1Value": 3000, "city2Value": 5000},
    {"name": "Internet", "city1Value": 700, "city2Value": 800}
  ]
}`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: `Compare ${city1} vs ${city2}. User salary: ₹${salary || 'unknown'}/month` }], 1500);
    const result = parseJSON(raw);
    if (!result) throw new Error('Parse failed');
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. SMART BILL NEGOTIATOR (SSE Streaming)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const billNegotiator = async (req, res) => {
  const { billType, currentPlan, monthlyAmount, provider } = req.body;
  const system = `You are a master negotiator who has saved Indian consumers crores. Write a complete negotiation strategy.`;
  const user = `Bill Type: ${billType}, Provider: ${provider || 'Unknown'}, Current Plan: ${currentPlan}, Monthly Cost: ₹${monthlyAmount}.
  
Give a step-by-step guide in clean markdown with:
1. Market Rate Check (am I overpaying?)
2. Word-for-word call script / email template
3. 3 best competitor alternatives with prices
4. Escalation tactics if first attempt fails
5. Success probability estimate`;

  await streamAI(res, system, user);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. SMART ROUTE PLANNER (OSRM + Fuel + Stealth)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const getSmartRoute = async (req, res) => {
  try {
    const { origin, destination, waypoint, avoidPolice, vehicleType = 'car', fuelPrice = 106, originCoords, destCoords, waypointCoords } = req.body;
    const cacheKey = `route_${origin}_${waypoint || ''}_${destination}_${avoidPolice}`;
    let cached = getCached(cacheKey);

    const geocode = async (q) => {
      try {
        const { data } = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en&countrycode=in`);
        if (data?.features?.length > 0) {
          const feat = data.features[0];
          const coords = feat.geometry?.coordinates || [0, 0];
          return { lat: coords[1], lon: coords[0], name: feat.properties.name || q };
        }
      } catch (err) {
        console.error("Photon geocode fallback trigger:", err.message);
      }

      const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'User-Agent': 'FinBuddy/1.0' } });
      if (!data?.length) throw new Error(`Cannot find: ${q}`);
      return { lat: data[0].lat, lon: data[0].lon, name: data[0].display_name.split(',')[0] };
    };

    let routes;
    if (!cached) {
      let orig, dest, wp;
      if (originCoords && originCoords.lat && originCoords.lon) {
        orig = { lat: originCoords.lat, lon: originCoords.lon, name: origin.split(',')[0] };
      } else {
        orig = await geocode(origin);
      }
      
      if (waypoint) {
        if (waypointCoords && waypointCoords.lat && waypointCoords.lon) {
          wp = { lat: waypointCoords.lat, lon: waypointCoords.lon, name: waypoint.split(',')[0] };
        } else {
          wp = await geocode(waypoint);
        }
      }

      if (destCoords && destCoords.lat && destCoords.lon) {
        dest = { lat: destCoords.lat, lon: destCoords.lon, name: destination.split(',')[0] };
      } else {
        dest = await geocode(destination);
      }

      let osrmUrl = `https://router.project-osrm.org/route/v1/driving/${orig.lon},${orig.lat};`;
      if (wp) {
        osrmUrl += `${wp.lon},${wp.lat};`;
      }
      osrmUrl += `${dest.lon},${dest.lat}?overview=full&steps=true&alternatives=true`;

      const { data: rd } = await axios.get(osrmUrl, { timeout: 10000 });
      if (rd.code !== 'Ok') throw new Error('Route not found');

      const mileage = { car: 15, bike: 45, suv: 12, truck: 8 };
      const kmpl = mileage[vehicleType] || 15;

      const currentHour = new Date().getHours();
      const isNight = currentHour >= 21 || currentHour <= 5;

      routes = rd.routes.map((r, idx) => {
        const checkpoints = [];
        let safetyScore = 100;
        const profileData = [];

        r.legs.forEach((leg, legIdx) => {
          leg.steps.forEach((s, stepIdx) => {
            const nm = (s.name || '').toLowerCase();
            const isToll = nm.includes('toll') || nm.includes('tollgate') || nm.includes('toll plaza');
            const isPolice = nm.includes('police') || nm.includes('chowki') || nm.includes('naka') || 
                              nm.includes('checkpoint') || nm.includes('check point') || nm.includes('checkpost');
            const isBorder = nm.includes('border');
            const isHighway = nm.includes('highway') || nm.includes('nh') || nm.includes('national') || nm.includes('expressway');

            if (isToll || isPolice || isBorder || isHighway) {
              let type = 'Toll/Patrol Zone';
              let advice = 'Have documents ready';
              let riskWeight = 5;

              if (isPolice) {
                type = '👮 Police Patrol Naka';
                advice = isNight 
                  ? 'Active night checkpoint. Carry vehicle registration, insurance & driver license' 
                   : 'Document verification zone. Ensure seatbelts/helmets are worn';
                riskWeight = isNight ? 15 : 10;
              } else if (isToll) {
                type = '🎫 Toll Plaza';
                advice = 'Keep FASTag balance recharged to avoid delays';
                riskWeight = 6;
              } else if (isBorder) {
                type = '🚧 State Border Checkpoint';
                advice = 'Interstate checkpoints; keep tax clearance/entry permit papers ready';
                riskWeight = 12;
              } else if (isHighway) {
                type = '🚗 Highway Patrol Sector';
                advice = 'Watch out for speed limits and highway patrol vehicles';
                riskWeight = 5;
              }

              if (!checkpoints.find(c => c.location === s.name))
                checkpoints.push({ type, location: s.name || 'Highway Section', advice });
              safetyScore -= riskWeight;
            }

            profileData.push({
              name: s.name ? s.name.substring(0, 12) : `Pt ${legIdx + 1}-${stepIdx + 1}`,
              traffic: Math.round(20 + Math.random() * 50),
              patrolProbability: isPolice ? (isNight ? 95 : 80) : (isToll || isBorder ? 60 : 10)
            });
          });
        });

        const distKm = r.distance / 1000;
        const durationMins = Math.round(r.duration / 60);
        const fuelCost = Math.round((distKm / kmpl) * fuelPrice);

        return {
          routeIndex: idx, isFastest: idx === 0, isSafest: false,
          summary: `Route ${idx + 1}: via ${r.legs[0].steps.find(s => s.name)?.name || 'Local Roads'}`,
          distance: `${distKm.toFixed(1)} km`, duration: `${durationMins} mins`,
          fuelCost: `₹${fuelCost}`, fuelLiters: `${(distKm / kmpl).toFixed(1)}L`,
          safetyScore: Math.max(40, Math.min(100, safetyScore)),
          policeCheckpoints: checkpoints,
          profileData: profileData.slice(0, 12),
          steps: r.legs.flatMap(l => l.steps).slice(0, 10).map(s => ({
            instruction: `${s.maneuver.type} ${s.maneuver.modifier || ''} ${s.name || ''}`.trim(),
            distance: `${s.distance.toFixed(0)}m`
          }))
        };
      });
      setCached(cacheKey, routes, 60);
    } else { routes = cached; }

    const monthlyCommuteCost = Math.round((routes[0].fuelCost?.replace('₹','') || 0) * 2 * 22);

    const safestIdx = routes.reduce((b, r, i) => r.safetyScore > routes[b].safetyScore ? i : b, 0);
    routes[safestIdx].isSafest = true;

    let recommended = routes[0];
    if (avoidPolice) {
      const clean = routes.filter(r => r.policeCheckpoints.filter(c => c.type.includes('Police') || c.type.includes('Border')).length === 0);
      if (clean.length) recommended = clean.sort((a, b) => parseInt(a.duration) - parseInt(b.duration))[0];
    }

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 21 || currentHour <= 5;

    res.json({
      success: true, routes, recommended: recommended.routeIndex, isNight,
      commuteAnalysis: {
        dailyCost: recommended.fuelCost,
        monthlyCost: `₹${monthlyCommuteCost.toLocaleString('en-IN')}`,
        annualCost: `₹${(monthlyCommuteCost * 12).toLocaleString('en-IN')}`,
        wfhSavings: `₹${(monthlyCommuteCost * 12 * 0.4).toLocaleString('en-IN')} saved/yr with 2 WFH days/week`
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. PURCHASE TIMING ORACLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const purchaseOracle = async (req, res) => {
  try {
    const { product, currentPrice } = req.body;
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const system = `You are a consumer market intelligence expert with 15 years of Indian retail pricing data.
Return ONLY JSON:
{
  "currentHeat": "Overpriced|Fair|Good Deal|Excellent Deal",
  "heatScore": 0-100,
  "heatColor": "red|yellow|green|emerald",
  "verdict": "Buy Now|Wait|Strong Buy|Avoid",
  "verdictReason": "2-sentence explanation",
  "bestMonthToBuy": "October",
  "bestSaleEvent": "Diwali Sale / Big Billion Day",
  "estimatedDiscount": "15-25%",
  "daysToWait": 23,
  "priceHistory": [
    {"event": "Diwali 2024", "discount": "20%", "month": "Oct"},
    {"event": "Republic Day", "discount": "12%", "month": "Jan"}
  ],
  "alternativeProducts": [
    {"name": "Product Name", "price": "₹XX,XXX", "reason": "Why it's better value"}
  ],
  "pricePrediction": "Prices expected to drop/rise by X% in next 30 days because...",
  "confidenceLevel": "High|Medium|Low"
}`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: `Product: ${product}. Current Price: ₹${currentPrice || 'unknown'}. Today: ${currentMonth}` }], 1200);
    const result = parseJSON(raw);
    if (!result) throw new Error('Parse failed');
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. EMI & LOAN TRAP DETECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const emiTrapDetector = async (req, res) => {
  try {
    const { offerText, principal, emiAmount, months, processingFee = 0, gstPercent = 18, extraPayment = 0 } = req.body;

    // Mathematical APR calculation if numbers provided
    let calculatedAPR = null;
    let amortizationSchedule = [];
    let prepaymentSavings = null;

    if (principal && emiAmount && months) {
      const P = parseFloat(principal);
      const E = parseFloat(emiAmount);
      const N = parseInt(months);
      const fee = parseFloat(processingFee) * (1 + gstPercent / 100);
      const totalPaid = (E * N) + fee;
      const totalInterest = totalPaid - P;
      // Newton-Raphson for IRR
      let r = 0.01;
      for (let i = 0; i < 1000; i++) {
        const f = P - E * (1 - Math.pow(1 + r, -N)) / r;
        const df = E * (1 - Math.pow(1 + r, -N)) / (r * r) - E * N * Math.pow(1 + r, -N - 1) / r;
        const newR = r - f / df;
        if (Math.abs(newR - r) < 0.0000001) { r = newR; break; }
        r = newR;
      }
      calculatedAPR = Math.round(r * 12 * 100 * 100) / 100;

      // ── Calculate full schedule using local emiEngine ──
      try {
        const emiResult = calculateEMI(P, calculatedAPR, N);
        amortizationSchedule = emiResult.schedule;

        if (extraPayment && parseFloat(extraPayment) > 0) {
          prepaymentSavings = extraPaymentSavings(P, calculatedAPR, N, parseFloat(extraPayment));
        }
      } catch (err) {
        console.error("Local EMI Engine calculation failed:", err);
      }
    }

    const system = `You are a forensic financial auditor who exposes predatory lending in India.
Return ONLY JSON:
{
  "trueAPR": "${calculatedAPR || 'calculated from text'}%",
  "advertisedRate": "what they claim",
  "isZeroEMIActuallyFree": false,
  "hiddenCosts": [
    {"name": "Processing Fee+GST", "amount": "₹XXX", "impact": "Adds X% to effective rate"}
  ],
  "totalExtraCost": "₹X,XXX above cash price",
  "trapLevel": "Safe|Mild Trap|Moderate Trap|Severe Trap",
  "trapScore": 0-100,
  "verdict": "1 blunt sentence verdict",
  "betterAlternatives": [
    {"option": "Pay Cash", "saving": "₹2,400", "pros": "No interest"},
    {"option": "HDFC Credit Card EMI", "rate": "13% APR", "saving": "₹800 vs this offer"}
  ],
  "shouldAccept": true,
  "redFlagTerms": ["specific problematic terms found in offer text"],
  "keyAdvice": "One critical action the user must take"
}`;

    const userMsg = offerText
      ? `Analyze: "${offerText}"`
      : `Principal: ₹${principal}, EMI: ₹${emiAmount}, Months: ${months}, Processing Fee: ₹${processingFee}. Calculated APR: ${calculatedAPR}%`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: userMsg }], 1200);
    const result = parseJSON(raw);
    if (!result) throw new Error('Parse failed');
    res.json({ success: true, result, calculatedAPR, amortizationSchedule, prepaymentSavings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. IMPULSE BUY THERAPIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const impulseTherapist = async (req, res) => {
  try {
    const { item, price, reason, monthlyIncome } = req.body;
    const affordRatio = monthlyIncome ? Math.round((price / monthlyIncome) * 100) : null;

    const system = `You are a CBT-trained behavioral finance therapist. Your job is to help users make conscious spending decisions.
Return ONLY JSON:
{
  "emotionalTrigger": "FOMO|Boredom|Status Anxiety|Reward Seeking|Social Pressure|Genuine Need",
  "triggerExplanation": "Specific explanation for this purchase",
  "needVsWant": "Need|Borderline|Want|Pure Impulse",
  "needScore": 0-100,
  "72HourRule": "If you still want this in 72 hours, it's not impulse",
  "cbtAnalysis": "2-sentence CBT analysis of the buying urge",
  "affordabilityVerdict": "${affordRatio ? `This is ${affordRatio}% of monthly income` : 'Unknown income'}",
  "prosAndCons": {
    "pros": ["genuine pro 1", "pro 2"],
    "cons": ["financial con 1", "psychological con 2"]
  },
  "finalVerdict": "BUY|WAIT 72 HOURS|DON'T BUY",
  "verdictEmoji": "✅|⏳|❌",
  "verdictReason": "Honest 2-sentence reason",
  "alternativeAction": "A free/cheap alternative to scratch the same itch",
  "willingToWait": true,
  "coinsEarned": 50,
  "savingsOpportunity": "If invested in SIP instead, this ₹X becomes ₹Y in 5 years"
}`;

    const raw = await getAI([{ role: 'system', content: system },
      { role: 'user', content: `Item: ${item}, Price: ₹${price}, Reason given: "${reason}", Monthly Income: ₹${monthlyIncome || 'unknown'}` }], 1200);
    const result = parseJSON(raw);
    if (!result) throw new Error('Parse failed');
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. FINANCIAL NEWS NOISE CANCELER (SSE Streaming)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const newsCanceler = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { headline, portfolio } = req.body;
    const system = `You are a calm, rational financial expert — the antidote to clickbait financial media.
First output a JSON block with: {"panicScore": 0-10, "verdict": "IGNORE|MONITOR|ACT", "actualMove": "e.g. Nifty down 1.8%", "mediaExaggeration": "what media says vs reality"}
Then write 3 paragraphs in plain markdown:
- Para 1: What actually happened (data-driven, calm)
- Para 2: Historical context (similar events, what happened after)  
- Para 3: What YOU should do (personalized based on portfolio type)`;

    const text = await getAI([{ role: 'system', content: system },
      { role: 'user', content: `Headline: "${headline}"\nMy portfolio type: ${portfolio || 'Long-term SIP investor'}` }], 1500, false);

    const words = text.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 15));
    }
    res.write('data: [DONE]\n\n');
  } catch (e) { res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`); }
  res.end();
};

const searchAddress = async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    if (!q || q.length < 3) return res.json([]);
    
    // Query Photon API (designed specifically for fast autocomplete and search-as-you-type)
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&countrycode=in`;
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    }
    
    const { data } = await axios.get(url);
    
    if (data && Array.isArray(data.features)) {
      // Map Photon features to look like OSM / Nominatim format for frontend compatibility
      const mapped = data.features.map(feat => {
        const props = feat.properties;
        const coords = feat.geometry?.coordinates || [0, 0];
        
        // Assemble clean display components
        const parts = [
          props.name,
          props.district || props.locality,
          props.city,
          props.state,
          props.country
        ].filter(Boolean);
        
        const uniqueParts = [...new Set(parts)];
        const display_name = uniqueParts.join(', ');
        
        return {
          display_name,
          lat: coords[1], // Latitude is index 1
          lon: coords[0]  // Longitude is index 0
        };
      });
      return res.json(mapped);
    }
    
    res.json([]);
  } catch (e) {
    // Fallback to Nominatim if Photon fails
    try {
      const { data } = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(req.query.q)}&countrycodes=in&limit=5`,
        { headers: { 'User-Agent': 'FinBuddyInstitution/1.0 (contact@finbuddy.com)' } }
      );
      return res.json(data);
    } catch (err) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
};

const financialAutopsy = async (req, res) => {
  try {
    const { decisionName, principal, actualFinal, years, rationale, benchmarkName, opportunityCost, deadCapitalScore } = req.body;
    
    const system = `You are a cognitive psychologist and behavioral finance auditor. 
    Analyze the user's past financial decision, their reasoning, and the computed opportunity cost.
    Return ONLY JSON:
    {
      "cognitiveBias": "Disposition Effect|Loss Aversion|Sunk Cost Fallacy|FOMO|Herd Mentality|Status Quo Bias|Action Bias",
      "emotionalTrigger": "e.g. Fear of market crash, greed for short term returns, regret minimization, etc.",
      "diagnosis": "A concise 2-sentence diagnostic assessment explaining the psychological trap they fell into.",
      "debiasAction": "A concise 1-sentence highly actionable psychological rule to prevent this bias in future decisions.",
      "lossAversionScore": 0-100,
      "fomoScore": 0-100,
      "statusQuoScore": 0-100,
      "recencyScore": 0-100
    }`;

    const userPrompt = `Decision: "${decisionName}"
    Principal Invested: ₹${principal}
    Actual Final Value: ₹${actualFinal}
    Duration: ${years} Years
    Benchmark Missed: "${benchmarkName}"
    Estimated Opportunity Cost: ₹${opportunityCost}
    Dead Capital Score: ${deadCapitalScore}/100
    User's Explained Rationale: "${rationale}"`;

    const raw = await getAI([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], 1000);
    const result = parseJSON(raw);
    if (!result) throw new Error('AI forensic parsing failed');
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};


const macroShockSimulation = async (req, res) => {
  try {
    const { fedShift, rbiShift, crudePrice, inflationRate } = req.body;
    
    const system = `You are a global macro investment strategist.
    Examine the simulated macroeconomic shifts and write a concise, professional threat assessment (3 paragraphs max) summarizing:
    1. The ripple effects of these interest rate adjustments on global and domestic equity/bond markets.
    2. How commodities (oil/gold) are driving inflation and the impact on purchasing power.
    3. Practical advice for asset allocation positioning (e.g. shifts from equity to debt, or hedging with gold).`;

    const userPrompt = `Simulated shifts:
    - US Federal Reserve Rate: ${fedShift > 0 ? `+${fedShift}% hike` : fedShift < 0 ? `${fedShift}% cut` : 'Unchanged'}
    - RBI Repo Rate: ${rbiShift > 0 ? `+${rbiShift}% hike` : rbiShift < 0 ? `${rbiShift}% cut` : 'Unchanged'}
    - Brent Crude Price: $${crudePrice}/barrel (Base is $80)
    - CPI Inflation Rate: ${inflationRate}% p.a. (Base is 5.5%)`;

    const analysis = await getAI([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], 1200, false);
    res.json({ success: true, analysis });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const debtRefinanceAnalysis = async (req, res) => {
  try {
    const { debts } = req.body;
    if (!debts || debts.length === 0) {
      return res.status(400).json({ success: false, message: 'No debts provided.' });
    }

    let totalBal = 0;
    let interestProductSum = 0;
    debts.forEach(d => {
      totalBal += d.balance;
      interestProductSum += (d.balance * d.rate);
    });
    const weightedRate = totalBal > 0 ? Math.round((interestProductSum / totalBal) * 100) / 100 : 0;

    const targetConsolidatedRate = 11;
    const shouldConsolidate = weightedRate > (targetConsolidatedRate + 1.5);
    const rateDiff = Math.max(0, weightedRate - targetConsolidatedRate);
    const estimatedInterestSaving = Math.round(totalBal * (rateDiff / 100));
    const breakEvenFees = Math.round(estimatedInterestSaving * 0.4);

    const system = `You are a credit auditor specializing in personal debt management and refinance structures.
    Provide a blunt, data-backed 3-sentence summary analysis of whether consolidating these debts makes sense.
    Focus on interest arbitrage, cash flow relief (single EMI vs multiple EMI), and credit score utilization impact.`;

    const userPrompt = `Debt List:
    ${debts.map(d => `- ${d.name}: ₹${d.balance} at ${d.rate}% interest (min pay ₹${d.minimum})`).join('\n')}
    Total Debt: ₹${totalBal}
    Weighted Average Interest Rate: ${weightedRate}%
    Consolidation target personal loan rate: ${targetConsolidatedRate}% p.a.
    Decision recommendation: ${shouldConsolidate ? 'Consolidate immediately' : 'Do not consolidate'}`;

    const aiText = await getAI([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], 1000, false);

    res.json({
      success: true,
      result: {
        weightedRate,
        shouldConsolidate,
        targetConsolidatedRate,
        estimatedInterestSaving,
        breakEvenFees,
        analysis: aiText
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const swpTaxAdvice = async (req, res) => {
  try {
    const {
      initialCapital, initialWithdrawal, expectedReturn, stepUp, equityAllocation, taxBracket, srrToggle, guytonKlinger
    } = req.body;

    const system = `You are a certified financial planner and tax expert specializing in Indian tax laws.
    Provide a step-by-step tax harvesting layout for this Systematic Withdrawal Plan (SWP).
    Focus on:
    - Minimizing Indian Long Term Capital Gains (LTCG) tax on equity by utilizing the annual ₹1.25L exemption.
    - Mitigating slab rate drag on debt holdings by scheduling withdrawals during low-income retirement phases.
    - The benefits of harvesting gains vs selling assets blindly.
    Write a concise, bulleted guide. Keep sentences short.`;

    const userPrompt = `SWP Parameters:
    - Capital: ₹${initialCapital}
    - Initial Monthly Payout: ₹${initialWithdrawal}
    - Return target: ${expectedReturn}% p.a.
    - Annual step up: ${stepUp}%
    - Allocation: ${equityAllocation}% Equity / ${100 - equityAllocation}% Debt
    - Current income slab: ${taxBracket}%
    - Stress factors active: ${srrToggle ? 'Year 1 market crash' : 'None'}, GK guardrails: ${guytonKlinger ? 'Yes' : 'No'}`;

    const advice = await getAI([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], 1200, false);
    res.json({ success: true, advice });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  spendingDNA,
  fraudShield,
  costOfLivingRadar,
  billNegotiator,
  getSmartRoute,
  purchaseOracle,
  emiTrapDetector,
  impulseTherapist,
  newsCanceler,
  searchAddress,
  financialAutopsy,
  macroShockSimulation,
  debtRefinanceAnalysis,
  swpTaxAdvice
};

