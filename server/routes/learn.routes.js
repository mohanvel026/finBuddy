// server/routes/learn.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const axios = require('axios');

router.use(protect);

// Bulletproof Resilient AI helper with Groq, Gemini & Mock Fallback (Direct REST via axios)
const { getAICompletion } = require('../utils/aiService');

const getAI = async (messages, maxTokens = 800, fallbackType = 'explain', term = '') => {
  try {
    return await getAICompletion(messages, maxTokens);
  } catch (err) {
    // Final elite mock fallback: Ensure 100% stable response for learning
    console.log('⚡ Using local expert knowledge fallback...');
  if (fallbackType === 'explain') {
    const cleanTerm = (term || '').toLowerCase();
    
    if (cleanTerm.includes('govt bonds') || cleanTerm.includes('government bonds')) {
      return `### 🏛️ What are Government Bonds?
Government Bonds are like giving a secure loan to the Government of India. In return, the Government pays you regular interest (interest coupons) and safely returns your principal back!

### 🇮🇳 Real-world Analogy
Imagine the local Mayor wants to build a beautiful park but is short on cash. You loan the Mayor ₹1,000, and they promise to give you ₹80 pocket money every year and return your full ₹1,000 after 5 years!

### 🎯 Risk & Returns involved
- **Risk**: Practically Zero! Backed by sovereign nation trust.
- **Returns**: Stable fixed interest (typically 7% - 8.5% p.a.). Ideal for preserving capital!`;
    }

    if (cleanTerm.includes('gold etf') || cleanTerm.includes('sgb gold')) {
      return `### 🪙 What is Sovereign Gold & Gold ETFs?
Gold ETFs are financial instruments that track physical gold prices digitally. Sovereign Gold Bonds (SGB) are RBI-issued papers that track gold rates and pay extra annual interest!

### 🇮🇳 Real-world Analogy
Instead of buying a heavy gold coin and locking it in a steel bank cupboard (paying vault keys rent), you hold a digital gold certificate in your phone! No theft fears, and it appreciates exactly like gold.

### 🎯 Risk & Returns involved
- **Risk**: Very Low. High liquidity but values swing with commodity demand.
- **Returns**: Long-term hedge against price rise (inflation) and currency deprecation (7% - 9% average p.a. growth).`;
    }

    if (cleanTerm.includes('mutual fund')) {
      return `### 💼 What is a Mutual Fund?
A Mutual Fund pools small savings from thousands of retail investors to buy a giant diversified bucket of top Indian corporations. Managed by a professional Fund Manager.

### 🇮🇳 Real-world Analogy
Imagine you and 100 school friends pool ₹10 each to buy a massive box of mixed chocolates (Dairy Milk, KitKat, 5-Star). An elected monitor buys the box and distributes pieces fairly to everyone!

### 🎯 Risk & Returns involved
- **Risk**: Moderate. Market swings affect daily prices (NAV), but diversification cushions single-stock crashes.
- **Returns**: Excellent long-term wealth compounding (11% - 16% p.a. average index growth).`;
    }

    if (cleanTerm.includes('foreign stocks')) {
      return `### 🌍 What are Foreign Stocks?
Foreign Stocks represent ownership shares in global giants outside India (primarily US tech firms like Nvidia, Apple, and Microsoft) using SEBI/RBI LRS pathways.

### 🇮🇳 Real-world Analogy
Every day you watch videos on YouTube (Google), buy products on Amazon, or use Windows laptops (Microsoft). Buying foreign stocks means you own a real slice of these global powerhouses!

### 🎯 Risk & Returns involved
- **Risk**: High Volatility. Fluctuates with global economies plus currency conversion rates (USD vs INR).
- **Returns**: High growth potential (14% - 20% compound returns in strong tech cycles).`;
    }

    if (cleanTerm.includes('corporate bonds')) {
      return `### 🏢 What are Corporate Bonds?
Corporate Bonds are secure, fixed-income instruments issued by top corporate companies to raise money for growth. They offer higher interest rates than bank FDs.

### 🇮🇳 Real-world Analogy
A major Indian company (like Tata or Reliance) wants to build a new factory. Instead of taking a costly bank loan, they issue bonds directly to you, promising a high yearly interest rate.

### 🎯 Risk & Returns involved
- **Risk**: Low-Moderate. Depends on the financial credit rating of the company.
- **Returns**: Attractive fixed yields (typically 9% - 11% p.a. payout).`;
    }

    const cleanTermName = term || 'this asset';
    return `### 💡 Definition of ${cleanTermName}
${cleanTermName} is a fundamental concept in finance that represents key actions or metrics to build your wealth. In simple terms, it guides how you grow your money over the long term.

### 🇮🇳 Real-world Analogy
Imagine buying a small share in your local sweet shop (mithai wala). If the shop makes a lot of profit and sells more laddoos, the value of your share increases, and you might get a cut of the profits!

### 🎯 Why it Matters to You
Understanding ${cleanTermName} helps you avoid bad investments, compound your money safely, and take control of your financial future without relying on rumors.

### 📊 Practical Example (INR)
If you invest ₹10,000 into a quality ${cleanTermName} index or asset growing at 12% annually, your investment becomes ₹11,200 in 1 year, and compounds to ₹31,058 in 10 years!`;
  }
  
  if (fallbackType === 'quiz') {
    return JSON.stringify({
      questions: [
        { q: `What is the key goal of studying ${term || 'Finance'}?`, options: [`A) To compound wealth safely`, `B) To get rich overnight`, `C) To keep money in a locker`, `D) None of the above`], answer: 'A', explanation: 'Wealth compounding is the core engine of safe investing.' },
        { q: 'Which is better for long term beginner compounding?', options: ['A) Index Mutual Funds', 'B) intraday leverage', 'C) Storing cash at home', 'D) Lottery tickets'], answer: 'A', explanation: 'Index funds pool the top Indian companies (Nifty 50) and grow steadily with the Indian economy.' }
      ]
    });
  }

  }
  return 'Finance is the art of compounding your savings over time. Try to start early, diversify, and let time do the heavy lifting!';
};

// @route POST /api/learn/explain — Explain any financial term simply
router.post('/explain', async (req, res) => {
  try {
    const { term, lang = 'en' } = req.body;
    if (!term) return res.status(400).json({ success: false, message: 'Term required' });

    let languageSpecificRule = "";
    if (lang === "ta") {
      languageSpecificRule = "The user prefers Standard TAMIL. Explain the financial term completely in standard TAMIL SCRIPT (தமிழ்) under 100 words using 4 clear emoji bullet points. Compare concept to simple Indian everyday things (sweet shop laddoos, piggy bank, etc).";
    } else if (lang === "tanglish") {
      languageSpecificRule = "The user prefers TANGLISH (colloquial Tamil mixed with English financial terms, written in Romanized English script). Explain the financial term completely in Romanized Tanglish under 100 words using 4 clear emoji bullet points. Style: 'Concept-a chonna... Why it matters...'. Compare concepts to simple Indian everyday things.";
    } else {
      languageSpecificRule = "Explain the term in extremely simple, fun English for beginners. Keep under 100 words, using 4 clear, short bullet points with emojis.";
    }

    const explanation = await getAI([
      { role: 'system', content: `You are a friendly Indian financial tutor for kids and absolute beginners. Explain financial terms in an extremely simple, fun way. 
Guidelines:
- Never use complex mathematical formulas or dense paragraphs.
- Compare concepts to simple Indian everyday things.
- LANGUAGE REQUIREMENT: ${languageSpecificRule}` },
      { role: 'user', content: `Explain "${term}" with 4 emoji bullet points.` }
    ], 400, 'explain', term);

    res.json({ success: true, term, explanation });
  } catch (e) {
    let explanation = `### 💡 ${term}\n\nThis is a key financial asset class to grow your wealth steadily over time. Try to start early!`;
    if (lang === "ta") {
      explanation = `### 💡 ${term}\n\nஇது உங்கள் பணத்தை பாதுகாப்பாக வளர்ப்பதற்கான ஒரு முக்கிய நிதி கருவியாகும். சீக்கிரம் முதலீடு செய்ய தொடங்குங்கள்!`;
    } else if (lang === "tanglish") {
      explanation = `### 💡 ${term}\n\nIdhu unga money-a safe-a valarkurathukaana nalla financial tool. Start early panna compound interest super-a work aagum!`;
    }
    res.json({ success: true, term, explanation, fallback: true });
  }
});

// @route POST /api/learn/quiz — Generate quiz questions on a topic
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'easy' } = req.body;
    const raw = await getAI([
      { role: 'system', content: 'You are a financial quiz generator. Always respond with ONLY valid JSON, no markdown.' },
      { role: 'user', content: `Generate 5 multiple-choice quiz questions about "${topic}" for a ${difficulty} level investor in India. Return ONLY this JSON structure: {"questions":[{"q":"question text","options":["A) opt1","B) opt2","C) opt3","D) opt4"],"answer":"A","explanation":"why A is correct"}]}` }
    ], 900, 'quiz', topic);
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ success: true, topic, ...parsed });
  } catch (e) {
    res.json({
      success: true, topic,
      questions: [
        { q: 'What does NSE stand for?', options: ['A) National Stock Exchange', 'B) New Stock Entity', 'C) National Savings Exchange', 'D) None'], answer: 'A', explanation: 'NSE stands for National Stock Exchange of India, founded in 1992.' },
        { q: 'What is a mutual fund?', options: ['A) A bank deposit', 'B) Pool of money from many investors', 'C) Government bond', 'D) Stock option'], answer: 'B', explanation: 'A mutual fund pools money from many investors to buy a diversified portfolio.' }
      ]
    });
  }
});

// @route POST /api/learn/survival — Generate dynamic market crash survival game rounds
router.post('/survival', async (req, res) => {
  try {
    const raw = await getAI([
      { role: 'system', content: 'You are a financial game generator. Always respond with ONLY valid JSON, no markdown.' },
      { role: 'user', content: `Generate 5 progressive rounds/scenarios for a Market Crash Volatility Survival Game in India. 
Rounds should cover volatile events like interest rate hikes, tech bubbles, commodity peaks, budget announcements, option margin calls, or crypto swings.
Return ONLY this JSON structure:
{
  "rounds": [
    {
      "title": "Round 1: Title of Round",
      "desc": "Detailed description of the market scenario or crisis in India.",
      "options": [
        { "text": "A) Option A text", "delta": -0.15, "log": "Feedback log for option A" },
        { "text": "B) Option B text", "delta": 0.05, "log": "Feedback log for option B" },
        { "text": "C) Option C text", "delta": -0.02, "log": "Feedback log for option C" }
      ]
    }
  ]
}` }
    ], 1200, 'explain');

    const cleanRaw = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanRaw);
    res.json({ success: true, ...parsed });
  } catch (e) {
    console.error("Survival AI generation failed, using fallback:", e.message);
    res.json({
      success: true,
      rounds: [
        {
          title: "Round 1: The Great Tech Correction (-20%)",
          desc: "Your stock holdings are dropping fast! Investors are panicking about interest rate increases.",
          options: [
            { text: "A) Panic-sell all stock holdings to save cash immediately", delta: -0.20, log: "Panicked! Locked in a heavy 20% loss." },
            { text: "B) Do nothing, hold, and review fundamentals", delta: -0.15, log: "Held steady. Paper losses stabilized at -15%." },
            { text: "C) Deploy cash reserve to buy more diversified funds at a discount", delta: 0.10, log: "Bought the dip! Positioned for future gains." }
          ]
        },
        {
          title: "Round 2: Hyperinflation Spike (+12% inflation)",
          desc: "Inflation surges to 12% p.a. The purchasing value of your uninvested cash is eroding rapidly.",
          options: [
            { text: "A) Leave all funds in savings account at 3% interest", delta: -0.09, log: "Left cash in savings. Inflation eroded your purchasing power by 9%." },
            { text: "B) Allocate 20% of your holdings into Sovereign Gold Bonds (SGB)", delta: 0.05, log: "Hedged with SGB! Gold prices rose, buffering your gains." },
            { text: "C) Buy volatile meme cryptocurrency based on social media trends", delta: -0.25, log: "Crypto crashed! Speculation wiped out 25% of your allocated portfolio value." }
          ]
        },
        {
          title: "Round 3: RBI Repo Rate Hike (+1.50%)",
          desc: "The central bank increases interest rates to curb inflation. Borrowing rates spike and stock indexes dip.",
          options: [
            { text: "A) Borrow cash on margin to buy high-beta small cap shares", delta: -0.18, log: "Margin cost drag! Leveraged small-caps crashed on high interest rates." },
            { text: "B) Buy high-yield RBI Government Floating Rate Bonds at 8.05%", delta: 0.08, log: "Risk-free yield! Secured 8.05% cash payouts, boosting your returns." },
            { text: "C) Keep everything in cash and wait", delta: -0.02, log: "Stood aside. Small purchasing power loss of 2%." }
          ]
        },
        {
          title: "Round 4: Sector Infrastructure Package (+40% surge)",
          desc: "Government announces ₹10 Lakh Crore national infrastructure package. Cement, steel, and power stocks surge.",
          options: [
            { text: "A) You had previously allocated diversified equity into infra mutual funds", delta: 0.15, log: "Diversified win! Captured infra bull run, portfolio gained 15%." },
            { text: "B) You shorted the market infrastructure index expecting a bubble", delta: -0.20, log: "Short squeeze! Squeezed out by the bull run, portfolio lost 20%." },
            { text: "C) You hold only cash", delta: 0.0, log: "Sidestepped the sector rally, cash stayed flat." }
          ]
        },
        {
          title: "Round 5: Options Speculative Trap (Unhedged Writing)",
          desc: "A major midcap stock promoter is accused of fraudulent bookkeeping. The share plunges 30% instantly.",
          options: [
            { text: "A) You wrote naked Put Options on the stock to collect premium", delta: -0.40, log: "Margin liquidation! Naked puts triggered massive margin calls and liquidation." },
            { text: "B) You bought Put Options as protective insurance for your holdings", delta: 0.12, log: "Protective hedge! Payout compensated for market losses." },
            { text: "C) You didn't hold that stock or write options", delta: 0.0, log: "Safe! Kept portfolio clear of unhedged derivatives speculation." }
          ]
        }
      ]
    });
  }
});

// @route POST /api/learn/chat — AI tutor chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], lang = 'en' } = req.body;
    
    let languageSpecificRule = "";
    if (lang === "ta") {
      languageSpecificRule = "The user prefers Standard TAMIL. You MUST answer the user's question directly and fully with real-world Indian examples in standard TAMIL SCRIPT (தமிழ்) under 100 words. End your reply with a simple, friendly multiple-choice question or a leading question to keep them learning step-by-step in Tamil.";
    } else if (lang === "tanglish") {
      languageSpecificRule = "The user prefers TANGLISH (colloquial Tamil mixed with English financial terms, written entirely in Romanized English script). You MUST answer the user's question directly and fully with real-world Indian examples in Romanized Tanglish under 100 words. Style: 'Hey buddy! Nifty-na Reliance, HDFC mathiri top 50 giants-a track pannum. SIP-na drop-by-drop water fill 🌊 panra mathiri simple.' End your reply with a simple multiple-choice question or leading question in Tanglish.";
    } else {
      languageSpecificRule = "The user prefers English. You MUST directly and fully answer the user's question first, explaining with real-world Indian financial examples (e.g. Nifty tracks top 50 giants like Reliance, HDFC, TCS; Sensex tracks 30 giants like ICICI, Infosys on BSE). Keep responses under 90 words. Use simple analogies and friendly emojis. End your reply with a single simple multiple-choice question or a friendly leading question related to the concept discussed.";
    }

    const messages = [
      { role: 'system', content: `You are FinGuru, an encouraging financial mentor for absolute beginners in India. 
Core Rules:
- Use simple analogies and friendly emojis.
- Never recommend real investments - this is virtual/educational.
- LANGUAGE REQUIREMENT: ${languageSpecificRule}` },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];
    const reply = await getAI(messages, 250, 'chat');
    res.json({ success: true, reply });
  } catch (e) {
    console.warn('⚡ FinGuru chat fallback:', e.message);
    let reply = "Mutual funds are great for long-term growth. Would you like to check out options in our textbook?";
    if (lang === "ta") {
      reply = "மியூச்சுவல் ஃபண்டுகள் நீண்ட கால வளர்ச்சிக்கு சிறந்தவை. நமது பாடப்புத்தகத்தில் உள்ள விவரங்களை பார்க்க விரும்புகிறீர்களா?";
    } else if (lang === "tanglish") {
      reply = "Mutual funds long-term growth-ku super boss! Namaloda textbook options-a check panna ungalluku pidikuma?";
    }
    res.json({ success: true, reply, fallback: true });
  }
});

// @route POST /api/learn/analyze-trade — AI coaching on a virtual trade decision
router.post('/analyze-trade', async (req, res) => {
  try {
    const { symbol, price, action, reason, currentPE, week52High, week52Low } = req.body;
    const reply = await getAI([
      { role: 'system', content: 'You are a friendly trading coach for beginners in India. Evaluate their virtual trade idea and teach them what to consider. Be encouraging but educational.' },
      { role: 'user', content: `A beginner wants to ${action} ${symbol} at ₹${price}. Their reason: "${reason}". Stock info: P/E=${currentPE}, 52W High=₹${week52High}, 52W Low=₹${week52Low}. Give: 1) Is this a reasonable decision? (1 sentence) 2) What they did well 3) What to consider before trading 4) Key risk to watch. Max 120 words.` }
    ], 350, 'explain', symbol);
    res.json({ success: true, coaching: reply });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route GET /api/learn/modules — Get structured learning modules
router.get('/modules', (req, res) => {
  res.json({
    success: true,
    modules: [
      {
        id: 'stocks-101', title: 'Stocks 101', emoji: '📈', color: '#7C3AED',
        description: 'Learn what stocks are, how markets work, and how to read stock prices.',
        lessons: ['What is a Stock?', 'How BSE & NSE Work', 'Reading a Stock Quote', 'Market Cap Explained', 'Bull vs Bear Market', 'How to Pick Your First Stock'],
        duration: '30 min', level: 'Beginner'
      },
      {
        id: 'mf-101', title: 'Mutual Funds 101', emoji: '💼', color: '#059669',
        description: 'Understand mutual funds, NAV, SIP, and how to choose the right fund.',
        lessons: ['What is a Mutual Fund?', 'NAV Explained Simply', 'SIP vs Lump Sum', 'Equity vs Debt Funds', 'How to Read a Fund Fact Sheet', 'ELSS & Tax Saving Funds'],
        duration: '35 min', level: 'Beginner'
      },
      {
        id: 'analysis-101', title: 'Stock Analysis', emoji: '🔍', color: '#DC2626',
        description: 'Master fundamental and technical analysis to make informed decisions.',
        lessons: ['P/E Ratio Explained', 'EPS & Revenue', 'Reading Balance Sheets', 'Support & Resistance', 'Moving Averages', 'RSI & MACD Basics'],
        duration: '45 min', level: 'Intermediate'
      },
      {
        id: 'risk-101', title: 'Risk & Returns', emoji: '⚖️', color: '#D97706',
        description: 'Understand risk, diversification, and how to protect your investments.',
        lessons: ['Risk vs Return', 'Diversification Strategy', 'Inflation & Real Returns', 'Stop Loss Orders', 'Portfolio Rebalancing', 'When to Exit a Stock'],
        duration: '25 min', level: 'Beginner'
      }
    ]
  });
});

// @route GET /api/learn/glossary — Full glossary of terms
router.get('/glossary', (req, res) => {
  res.json({
    success: true,
    terms: [
      { term: 'Stock', category: 'Basics', short: 'Ownership share in a company' },
      { term: 'IPO', category: 'Basics', short: 'First public sale of a company\'s shares' },
      { term: 'Dividend', category: 'Basics', short: 'Profit share paid to shareholders' },
      { term: 'Market Cap', category: 'Basics', short: 'Total value of a company\'s shares' },
      { term: 'Bull Market', category: 'Basics', short: 'Rising market with investor optimism' },
      { term: 'Bear Market', category: 'Basics', short: 'Falling market with investor pessimism' },
      { term: 'P/E Ratio', category: 'Analysis', short: 'Price relative to earnings per share' },
      { term: 'EPS', category: 'Analysis', short: 'Earnings Per Share — profit per stock' },
      { term: 'ROE', category: 'Analysis', short: 'Return on Equity — efficiency of profits' },
      { term: 'EBITDA', category: 'Analysis', short: 'Earnings before interest, tax, depreciation' },
      { term: 'Resistance', category: 'Technical', short: 'Price level where selling pressure is strong' },
      { term: 'Support', category: 'Technical', short: 'Price level where buying pressure is strong' },
      { term: 'RSI', category: 'Technical', short: 'Momentum indicator (0–100 scale)' },
      { term: 'MACD', category: 'Technical', short: 'Trend-following momentum indicator' },
      { term: 'Moving Average', category: 'Technical', short: 'Average price over a time period' },
      { term: 'NAV', category: 'Mutual Funds', short: 'Net Asset Value — price per MF unit' },
      { term: 'SIP', category: 'Mutual Funds', short: 'Systematic Investment Plan — fixed monthly investing' },
      { term: 'AUM', category: 'Mutual Funds', short: 'Assets Under Management — fund size' },
      { term: 'Expense Ratio', category: 'Mutual Funds', short: 'Annual fee charged by the fund' },
      { term: 'ELSS', category: 'Mutual Funds', short: 'Tax-saving equity mutual fund (Section 80C)' },
      { term: 'Nifty 50', category: 'Index', short: 'Top 50 companies on NSE' },
      { term: 'Sensex', category: 'Index', short: 'Top 30 companies on BSE' },
      { term: 'Circuit Breaker', category: 'Market', short: 'Trading halt when price moves too fast' },
      { term: 'Stop Loss', category: 'Trading', short: 'Auto-sell order to limit losses' },
      { term: 'Futures', category: 'Derivatives', short: 'Contract to buy/sell at future price' },
      { term: 'Options', category: 'Derivatives', short: 'Right (not obligation) to buy/sell at a price' },
      { term: 'Demat Account', category: 'Basics', short: 'Electronic account holding your shares' },
      { term: 'CAGR', category: 'Returns', short: 'Compound Annual Growth Rate' },
      { term: 'Inflation', category: 'Economics', short: 'Rise in prices over time reducing money value' },
      { term: 'FII', category: 'Market', short: 'Foreign Institutional Investors in Indian markets' },
      { term: 'Repo Rate', category: 'Banking', short: 'The interest rate at which RBI lends money to commercial banks' },
      { term: 'Reverse Repo Rate', category: 'Banking', short: 'The rate at which RBI borrows money from commercial banks' },
      { term: 'CRR (Cash Reserve Ratio)', category: 'Banking', short: 'The % of deposits banks must keep as cash with RBI' },
      { term: 'SLR (Statutory Liquidity Ratio)', category: 'Banking', short: '% of net deposits banks must hold in liquid approved securities' },
      { term: 'MCLR (Marginal Cost Rate)', category: 'Banking', short: 'The minimum lending rate benchmark for Indian bank loans' },
      { term: 'SWIFT Code', category: 'Banking', short: 'Global bank identification code for international wire transfers' },
      { term: 'NEFT / RTGS', category: 'Banking', short: 'Electronic fund transfer systems between Indian bank accounts' },
      { term: 'Fixed Deposit (FD)', category: 'Banking', short: 'A time-locked bank deposit earning guaranteed interest' },
      { term: 'NPA (Non-Performing Asset)', category: 'Banking', short: 'A loan where repayment has not been received for 90+ days' },
      { term: 'CIBIL Score', category: 'Banking', short: 'India\'s primary credit score (300–900) measuring creditworthiness' },
      { term: 'Collateral', category: 'Banking', short: 'An asset pledged as security for a loan' },
      { term: 'Overdraft Facility', category: 'Banking', short: 'A credit line allowing withdrawals beyond the account balance' },
      { term: 'KYC (Know Your Customer)', category: 'Banking', short: 'Identity verification process mandated for all financial accounts' },
      { term: 'Bancassurance', category: 'Banking', short: 'Partnership between banks and insurers to sell insurance at branches' },
      { term: 'UPI (Unified Payments Interface)', category: 'Banking', short: 'An instant real-time payment system developed by NPCI' },
      { term: 'IFSC Code', category: 'Banking', short: 'Unique 11-character code identifying a bank branch for money transfers' },
      { term: 'IMPS (Immediate Payment Service)', category: 'Banking', short: 'Real-time instant electronic fund transfer service in India' },
      { term: 'EMI (Equated Monthly Installment)', category: 'Banking', short: 'A fixed monthly payment made by a borrower to repay an outstanding loan' },
      { term: 'Recurring Deposit (RD)', category: 'Banking', short: 'A term deposit where you save a fixed amount monthly at fixed interest' },
      { term: 'Savings Account', category: 'Banking', short: 'A basic interest-bearing deposit account held at a commercial bank' },
      { term: 'Current Account', category: 'Banking', short: 'A transactional bank account for businesses with zero interest' },
      { term: 'LTV (Loan-to-Value) Ratio', category: 'Banking', short: 'The ratio of a loan amount to the appraised value of the asset/collateral' },
      { term: 'NBFC (Non-Banking Financial Company)', category: 'Banking', short: 'A financial institution providing bank-like services without a bank license' },
      { term: 'CASA Ratio', category: 'Banking', short: 'The ratio of savings and current account deposits to total deposits' },
      { term: 'MICR Code', category: 'Banking', short: 'A 9-digit magnetic character code printed on cheques to ease clearing' },
      { term: 'Nostro / Vostro Account', category: 'Banking', short: 'Foreign currency accounts held by domestic banks abroad, and vice versa' },
      { term: 'Escrow Account', category: 'Banking', short: 'A temporary third-party account holding funds during a transaction' },
      { term: 'Cheque Bounce', category: 'Banking', short: 'Rejection of a cheque by the bank due to insufficient funds' },
      { term: 'Bad Bank', category: 'Banking', short: 'An entity set up to buy non-performing assets (NPAs) from banks' },
      { term: 'Basel Norms', category: 'Banking', short: 'Global regulatory standards to manage bank risk and adequacy' },
      { term: 'Moratorium', category: 'Banking', short: 'A temporary suspension of debt or loan repayments' },
      { term: 'Prime Lending Rate (PLR)', category: 'Banking', short: 'The interest rate commercial banks charge their most creditworthy customers' },
      { term: 'Amortization', category: 'Banking', short: 'Spreading out a loan into a series of equal periodic payments' },
      { term: 'Credit Appraisal', category: 'Banking', short: 'The process by which a lender assesses a borrower\'s creditworthiness' },
      { term: 'Debt-to-Income (DTI) Ratio', category: 'Banking', short: 'Percentage of monthly gross income that goes toward paying debts' },
      { term: 'Prepayment Penalty', category: 'Banking', short: 'A fee charged by lenders when a loan is paid off early' },
      { term: 'Secured Loan', category: 'Banking', short: 'A loan backed by collateral to reduce risk for the lender' },
      { term: 'Unsecured Loan', category: 'Banking', short: 'A loan granted based on creditworthiness, without collateral' },
      { term: 'Credit Utilization Ratio', category: 'Banking', short: 'The percentage of your total available credit limit currently used' },
      { term: 'Revolving Credit', category: 'Banking', short: 'A credit line that allows spending, repaying, and spending again' },
      { term: 'DICGC Insurance', category: 'Banking', short: 'RBI-backed deposit insurance protecting up to ₹5 Lakhs per account' },
      { term: 'Negative Interest Rates', category: 'Macro', short: 'A policy where depositors pay banks to hold their money' },
      { term: 'Quantitative Easing (QE)', category: 'Macro', short: 'Central bank asset purchases to inject liquidity into the economy' },
      { term: 'Stagflation', category: 'Macro', short: 'Economic phase of slow growth, high unemployment, and high inflation' },
      { term: 'Deflation', category: 'Macro', short: 'A sustained decrease in the general price level of goods' },
      { term: 'Consumer Price Index (CPI)', category: 'Macro', short: 'Retail inflation benchmark tracking price changes of consumer goods' },
      { term: 'Wholesale Price Index (WPI)', category: 'Macro', short: 'Inflation benchmark tracking wholesale price changes' },
      { term: 'Fiscal Policy', category: 'Macro', short: 'Government strategies involving taxation and public spending' },
      { term: 'Monetary Policy', category: 'Macro', short: 'Central bank management of money supply and interest rates' },
      { term: 'Fiat Currency', category: 'Macro', short: 'Government-issued money not backed by a physical commodity' },
      { term: 'Liquidity Trap', category: 'Macro', short: 'When interest rates are near zero but consumers prefer saving over spending' },
      { term: 'Price-to-Sales (P/S) Ratio', category: 'Valuation', short: 'Valuation ratio comparing stock price to revenues per share' },
      { term: 'Enterprise Value (EV)', category: 'Valuation', short: 'Total business value representing the theoretical takeover cost' },
      { term: 'EV/EBITDA', category: 'Valuation', short: 'Valuation ratio measuring EV relative to operating earnings' },
      { term: 'Beta', category: 'Stocks', short: 'Measure of a stock\'s volatility relative to the broader market' },
      { term: 'Dividend Yield', category: 'Income', short: 'Annual dividend payout expressed as a percentage of share price' },
      { term: 'Free Float Market Cap', category: 'Stocks', short: 'Market cap based only on shares available for public trading' },
      { term: 'Blue Chip Stocks', category: 'Stocks', short: 'Shares of large, financially stable, and industry-leading corporations' },
      { term: 'Multi-bagger', category: 'Stocks', short: 'A stock that yields returns multiple times its original cost' },
      { term: 'Short Squeeze', category: 'Trading', short: 'Rapid price spike forcing short sellers to cover positions' },
      { term: 'Penny Stocks', category: 'Stocks', short: 'Low-priced, highly speculative shares of tiny companies' },
      { term: 'Expense Ratio', category: 'Mutual Fund', short: 'Annual management fees charged by a mutual fund' },
      { term: 'Exit Load', category: 'Mutual Fund', short: 'Fee charged by mutual funds when redeeming units early' },
      { term: 'Large Cap Fund', category: 'Mutual Fund', short: 'Mutual funds investing in the top 100 Indian companies' },
      { term: 'Mid Cap Fund', category: 'Mutual Fund', short: 'Mutual funds investing in medium-sized companies' },
      { term: 'Small Cap Fund', category: 'Mutual Fund', short: 'Mutual funds investing in small, emerging enterprises' },
      { term: 'Direct Plan', category: 'Mutual Fund', short: 'Mutual fund bought directly from AMC with lower expense ratios' },
      { term: 'Regular Plan', category: 'Mutual Fund', short: 'Mutual fund bought through distributors with embedded commissions' },
      { term: 'Arbitrage Fund', category: 'Mutual Fund', short: 'Funds profiting from price differences in cash and derivatives markets' },
      { term: 'Liquid Fund', category: 'Mutual Fund', short: 'Debt fund investing in short-term money market instruments' },
      { term: 'Gilt Fund', category: 'Mutual Fund', short: 'Debt fund investing exclusively in government securities' },
      { term: 'Short-Term Capital Gains (STCG)', category: 'Income', short: 'Tax on gains from selling assets held for a short period' },
      { term: 'Long-Term Capital Gains (LTCG)', category: 'Income', short: 'Tax on gains from selling assets held for a long period' },
      { term: 'Securities Transaction Tax (STT)', category: 'Income', short: 'Direct tax levied on equity and derivatives transactions' },
      { term: 'Tax Loss Harvesting', category: 'Income', short: 'Selling loss-making assets to offset capital gains tax liability' },
      { term: 'Section 80C', category: 'Planning', short: 'Tax section offering deductions up to ₹1.5 Lakhs on investments' },
      { term: 'Surcharge', category: 'Income', short: 'An additional tax levied on the tax liability of high earners' },
      { term: 'Option Premium', category: 'Derivatives', short: 'The market price paid to buy an options contract' },
      { term: 'In-the-Money (ITM)', category: 'Derivatives', short: 'An option contract that possesses positive intrinsic value' },
      { term: 'Out-of-the-Money (OTM)', category: 'Derivatives', short: 'An option contract with zero intrinsic value' },
      { term: 'At-the-Money (ATM)', category: 'Derivatives', short: 'An option strike price equal to the underlying stock price' },
      { term: 'Theta Decay', category: 'Derivatives', short: 'The decay of an option\'s time value as expiry nears' },
      { term: 'Margin', category: 'Derivatives', short: 'The collateral required to trade leveraged derivative positions' }
    ]
  });
});

// @route POST /api/learn/lesson-content — Generate dynamic AI explanation, analogy, and goal for a lesson
router.post('/lesson-content', async (req, res) => {
  const { lessonId, title, lang = 'en' } = req.body;
  try {
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });

    let languageRule = "";
    if (lang === "ta") {
      languageRule = "Translate all values completely into standard TAMIL SCRIPT (தமிழ்). Keep each value simple and under 50 words.";
    } else if (lang === "tanglish") {
      languageRule = "Translate all values completely into TANGLISH (Romanized Tamil script mixed with English financial terms). Keep each value simple and under 50 words.";
    } else {
      languageRule = "Keep all values in simple, fun English for beginners. Keep each value under 50 words.";
    }

    const prompt = `You are a financial curriculum writer. Generate a structured lesson outline for the topic: "${title}".
Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no comments):
{
  "concept": "A simple 1-2 sentence explanation of the concept.",
  "whyMatters": "A 1-2 sentence explanation of why this concept is important to learn.",
  "analogy": "A fun, memorable Indian analogy comparing this concept to everyday Indian life (e.g. autorickshaws, cricket, masala tea, laddoos).",
  "actionGoal": "A simple, actionable challenge or task for the user to complete in a simulator to test this concept."
}
Language instruction: ${languageRule}`;

    const raw = await getAI([
      { role: 'system', content: 'You are a professional financial educator. You always output ONLY valid raw JSON.' },
      { role: 'user', content: prompt }
    ], 600, 'explain', title);

    const cleanJson = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, lessonId, ...parsed });
  } catch (e) {
    const fallback = getFallbackLessonContent(title, lang);
    res.json({ success: true, lessonId, ...fallback });
  }
});

const getFallbackLessonContent = (title, lang) => {
  const t = title.toLowerCase();
  
  // Default values
  let concept = `Learn the core mechanics, functions, and key drivers of ${title} in the modern financial ecosystem.`;
  let whyMatters = `Understanding ${title} is crucial for optimizing your wealth allocation, mitigating unnecessary risks, and maximizing long-term compound interest.`;
  let analogy = `Think of ${title} as a specialized tool in your financial toolbox—using it correctly helps you build your wealth tower faster and safer.`;
  let actionGoal = `Complete the interactive lesson modules and track how ${title} impacts your overall FinScore.`;

  if (t.includes("defi") || t.includes("blockchain")) {
    concept = "Decentralized Finance (DeFi) replaces traditional banking intermediaries with open-source smart contracts on public blockchains.";
    whyMatters = "It eliminates intermediary fees, cuts transaction delay times, and provides global permissionless accessibility.";
    analogy = "Like a self-service vending machine instead of a manned grocery store stall—pure code handles the swap without a cashier.";
    actionGoal = "Increase blockchain network nodes to 70+ to secure consensus and validate the smart contract transaction.";
  } else if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
    concept = "Inflation measures the rate at which the general level of prices for goods and services rises, eroding purchasing power.";
    whyMatters = "WPI measures wholesale transaction prices, while CPI measures direct retail consumer price baskets used to calculate real interest rates.";
    analogy = "Like a slow leak in a bicycle tire—if you do not pump it up (earn returns), you will eventually be riding on flat rims.";
    actionGoal = "Slide years of inflation to 15+ years and observe the compounding purchasing power loss of idle cash.";
  } else if (t.includes("sgb") || t.includes("gold bond")) {
    concept = "Sovereign Gold Bonds (SGBs) are government securities denominated in grams of gold, offering a safe alternative to physical gold.";
    whyMatters = "They offer a 2.5% annual interest yield, zero storage costs, and complete capital gains tax exemption if held until maturity.";
    analogy = "Like owning a digital gold mine that pays you rent every six months, without needing a safe deposit vault.";
    actionGoal = "Slide the holding duration to 8 years to unlock tax-free maturity status and claim maximum yield.";
  } else if (t.includes("epf") || t.includes("ppf") || t.includes("provident")) {
    concept = "EPF (Employees' Provident Fund) is a mandatory salary-deducted savings scheme, while PPF is a voluntary tax-free savings account.";
    whyMatters = "Both offer safe, government-backed compounding with EEE (Exempt-Exempt-Exempt) tax status to secure long-term retirement safety.";
    analogy = "Like planting a Banyan tree in a protected national park—it grows slowly but is immune to market storms and axes.";
    actionGoal = "Optimize the compounding horizon to 15+ years to see the exponential growth of tax-shielded retirement funds.";
  } else if (t.includes("beta") || t.includes("alpha")) {
    concept = "Alpha measures a fund's excess return relative to a benchmark, while Beta measures its sensitivity to market volatility.";
    whyMatters = "High Alpha indicates active manager outperformance, while Beta tells you if the fund will swing more or less than the index.";
    analogy = "Beta is how much a boat swings with the waves; Alpha is how fast the motor pushes it ahead of other boats.";
    actionGoal = "Adjust spot price drift to achieve positive Alpha while keeping Beta below 1.2 for risk control.";
  } else if (t.includes("reit") || t.includes("invit")) {
    concept = "REITs (Real Estate Investment Trusts) and InvITs (Infrastructure Investment Trusts) pool capital to buy income-generating property assets.";
    whyMatters = "They allow retail investors to own shares in commercial tech parks or toll roads, yielding 90%+ of net cash flows as dividends.";
    analogy = "Like buying one brick of a massive shopping mall and receiving a tiny share of the parking and rent receipts every month.";
    actionGoal = "Increase the dividend payout rate to 90% to trigger mandatory distribution and maximize cash flow yields.";
  } else if (t.includes("dupont") || t.includes("efficiency")) {
    concept = "DuPont analysis breaks down Return on Equity (ROE) into three components: Profit Margin, Asset Turnover, and Financial Leverage.";
    whyMatters = "It isolates whether a company's profitability is driven by high prices, fast inventory sales, or dangerous debt leverage.";
    analogy = "Like diagnostic tests on an engine—revealing if speed comes from lightweight tuning, supercharged fuel, or nitro boost.";
    actionGoal = "Increase profit margin and asset turnover to boost ROE without raising debt leverage past safe limits.";
  } else if (t.includes("greeks") || t.includes("delta") || t.includes("theta")) {
    concept = "Option Greeks measure the sensitivity of option prices to changes in underlying price (Delta), time decay (Theta), and volatility (Vega).";
    whyMatters = "Option buyers face severe time decay risk (Theta), while sellers manage delta exposure to hedge directional market swings.";
    analogy = "Like a melting ice cream cone (Theta decay)—the longer you hold it, the less it is worth unless the temperature drops (Delta shift).";
    actionGoal = "Slide days to expiration down to observe accelerated Theta decay on the options premium valuation curve.";
  } else if (t.includes("option spread") || t.includes("iron butterfly") || t.includes("hedging")) {
    concept = "Option spreads involve buying and selling multiple options simultaneously to define maximum risk and capital requirement.";
    whyMatters = "It allows traders to profit from market stagnation (neutral spreads) or limit losses compared to naked option buying.";
    analogy = "Like building a cage around a wild animal—you limit how far it can jump in either direction, keeping your budget safe.";
    actionGoal = "Adjust volatility spike rate to test iron butterfly tolerance and verify maximum potential net credit yield.";
  } else if (t.includes("corporate red flag") || t.includes("auditing")) {
    concept = "Corporate red flags include forensic discrepancies like high promoter pledges, receivables growth outpacing sales, or frequent auditor changes.";
    whyMatters = "Detecting these warning signs early saves investors from catastrophic capital wipes (e.g. Satyam, Satavahana instances).";
    analogy = "Like checking a car's exhaust smoke and oil leaks before buying—it prevents purchasing a polished engine that is ready to blow.";
    actionGoal = "Increase promoter pledged shares past 50% to trigger corporate governance margin call alerts.";
  }

  // Tamil translation if requested
  if (lang === "ta") {
    concept = `வளங்களை மேம்படுத்துதல் மற்றும் சொத்து ஒதுக்கீடு தொடர்பான மேம்பட்ட நிதி கருத்து: ${title}.`;
    whyMatters = `மக்களின் சேமிப்பை பாதுகாப்பாக வளர்ப்பதற்கு இந்த ${title} பாடம் மிகவும் இன்றியமையாதது.`;
    analogy = "ஒரு நீர் தேக்கத்தை கற்பனை செய்து பாருங்கள். வரத்தையும் செலவையும் நிர்வகிக்காவிட்டால், நீர் மட்டம் ஆவியாகிவிடும்.";
    actionGoal = "அளவுகோலை இலக்கு வரம்பை எட்டச் செய்து மாதிரியை மேம்படுத்தவும்.";
  } else if (lang === "tanglish") {
    concept = `Advanced compound growth mechanism path regarding ${title} selection and risk control rules.`;
    whyMatters = `It protects unga savings-ah from inflation decay and boosts net compounding velocity.`;
    analogy = `Oru asset target-ah hit panna continuous compounding support pannanum, tea stall mathiri run panna super check.`;
    actionGoal = `Slide settings to match the target threshold level for optimization.`;
  }

  return { concept, whyMatters, analogy, actionGoal };
};

// @route POST /api/learn/lesson-story — Generate dynamic AI micro-story and question for a lesson node
router.post('/lesson-story', async (req, res) => {
  const { lessonId, title, lang = 'en' } = req.body;
  try {
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });

    let languageRule = "";
    if (lang === "ta") {
      languageRule = "Translate story, question, options, and explanation completely into standard TAMIL SCRIPT (தமிழ்). Keep the story short.";
    } else if (lang === "tanglish") {
      languageRule = "Translate story, question, options, and explanation completely into TANGLISH (Romanized Tamil script mixed with English financial terms).";
    } else {
      languageRule = "Keep all text in simple, engaging English for kids/beginners.";
    }

    const prompt = `You are a creative financial storyteller. Generate an interactive micro-story and multiple-choice question for the topic: "${title}".
Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no comments):
{
  "story": "A short, engaging 2-3 sentence narrative scenario in an Indian context (using everyday situations and Indian names like Ramesh, Amit, Priya) related to the topic.",
  "question": "A multiple choice question testing the user's understanding of the concept based on the story.",
  "options": [
    "A) Option A text",
    "B) Option B text",
    "C) Option C text"
  ],
  "correctIndex": 0,
  "explanation": "A 1-2 sentence explanation of why the correct option is right."
}
Language instruction: ${languageRule}`;

    const raw = await getAI([
      { role: 'system', content: 'You are a professional financial educator. You always output ONLY valid raw JSON.' },
      { role: 'user', content: prompt }
    ], 600, 'explain', title);

    const cleanJson = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, lessonId, ...parsed });
  } catch (e) {
    const fallback = getFallbackLessonStory(lessonId, title, lang);
    res.json({ success: true, lessonId, ...fallback });
  }
});

// @route POST /api/learn/sidequest — Generate dynamic AI timed side-quest questions for a station
router.post('/sidequest', async (req, res) => {
  try {
    const { stationId, lang = 'en' } = req.body;
    const sId = parseInt(stationId) || 1;

    let categoryInfo = "Personal Finance Foundations & Budgeting";
    if (sId === 2) categoryInfo = "Mutual Funds, NAV, SIP, and Tax Saving Schemes (80C)";
    if (sId === 3) categoryInfo = "Fundamental Stock Analysis, P/E Ratios, Balance Sheets, and Technical Indicators (RSI, Moving Averages)";
    if (sId === 4) categoryInfo = "Risk Mitigation, Diversification, Option Greeks (Delta, Theta), Hedging spreads, and Corporate Red Flags";

    let languageRule = "";
    if (lang === "ta") {
      languageRule = "Generate the questions, options, and explanations in standard TAMIL SCRIPT (தமிழ்).";
    } else if (lang === "tanglish") {
      languageRule = "Generate the questions, options, and explanations in TANGLISH (Romanized Tamil mixed with English).";
    } else {
      languageRule = "Generate the questions in simple English.";
    }

    const prompt = `Generate 3 progressive multiple-choice questions for a financial side-quest matching Station ID ${sId} (${categoryInfo}).
Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no comments):
{
  "questions": [
    {
      "q": "Question text testing a concept in this station...",
      "options": ["A) Option text 1", "B) Option text 2", "C) Option text 3"],
      "answer": "A",
      "explanation": "Why correct"
    },
    {
      "q": "Second question...",
      "options": ["A) Opt1", "B) Opt2", "C) Opt3"],
      "answer": "B",
      "explanation": "Why correct"
    },
    {
      "q": "Third question...",
      "options": ["A) Opt1", "B) Opt2", "C) Opt3"],
      "answer": "C",
      "explanation": "Why correct"
    }
  ]
}
Language instruction: ${languageRule}`;

    const raw = await getAI([
      { role: 'system', content: 'You are a professional financial educator. You always output ONLY valid raw JSON.' },
      { role: 'user', content: prompt }
    ], 900, 'quiz', `Station ${sId}`);

    const cleanJson = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, stationId: sId, ...parsed });
  } catch (e) {
    const fallback = getFallbackSideQuest(sId, lang);
    res.json({ success: true, stationId: sId, ...fallback });
  }
});

// @route POST /api/learn/crisis-event — Generate dynamic AI market shock crisis event for the sandbox
router.post('/crisis-event', async (req, res) => {
  try {
    const { title, lang = 'en' } = req.body;

    let languageRule = "";
    if (lang === "ta") {
      languageRule = "Translate title, description, and stabilization hint completely into standard TAMIL SCRIPT (தமிழ்).";
    } else if (lang === "tanglish") {
      languageRule = "Translate title, description, and stabilization hint completely into TANGLISH.";
    } else {
      languageRule = "Write everything in simple English.";
    }

    const prompt = `Generate an interactive market crisis event matching the lesson topic: "${title}".
Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no comments):
{
  "title": "A short, catchy name of the crisis (e.g. RBI rate hike shock, tech valuation squeeze)",
  "desc": "A brief 2-sentence description of what happened in the market.",
  "driftVariable": "primary",
  "driftDirection": "up",
  "stabilizeHint": "A quick tip on how the user should adjust the other sliders to stabilize the model."
}
Note: 'driftVariable' must be either 'primary' or 'secondary'. 'driftDirection' must be 'up' or 'down'.
Language instruction: ${languageRule}`;

    const raw = await getAI([
      { role: 'system', content: 'You are a professional financial editor. You always output ONLY valid raw JSON.' },
      { role: 'user', content: prompt }
    ], 500, 'explain', title);

    const cleanJson = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, ...parsed });
  } catch (e) {
    const fallback = getFallbackCrisis(title, lang);
    res.json({ success: true, ...fallback });
  }
});

const getFallbackLessonStory = (lessonId, title, lang) => {
  const t = title.toLowerCase();
  
  let story = `Ramesh wants to learn about ${title} to grow his monthly savings safely, but he wants to understand the exact trade-offs first.`;
  let question = `What is the primary factor to consider when evaluating ${title}?`;
  let options = [
    "A) The balance between risk and long-term compounding growth",
    "B) How fast you can double your money in one week",
    "C) Getting free gifts from the bank manager"
  ];
  let correctIndex = 0;
  let explanation = "Sound investing always focuses on balancing risk with compounding returns rather than short-term gains.";

  if (t.includes("stock")) {
    story = "Neha pools ₹5,000 to buy shares of an Indian retail company. The company sells more clothes and opens new outlets across Chennai.";
    question = "What does Neha's share ownership represent?";
    options = [
      "A) A small piece of ownership in the company's business",
      "B) A loan that the company must repay with interest in 3 days",
      "C) A discount card to get free clothes at the store"
    ];
    correctIndex = 0;
    explanation = "Stocks represent actual fractional ownership of a corporation's assets and earnings.";
  } else if (t.includes("cpi") || t.includes("wpi") || t.includes("inflation")) {
    story = "Ravi stores ₹50,000 cash under his mattress for 10 years. Meanwhile, the price of a cup of filter coffee rises from ₹10 to ₹25.";
    question = "What happened to Ravi's money?";
    options = [
      "A) Its nominal value stayed the same, but its purchasing power decayed due to inflation",
      "B) The money doubled automatically because it was stored safely",
      "C) The bank confiscated the money because it was idle"
    ];
    correctIndex = 0;
    explanation = "Inflation erodes the purchasing power of cash over time. Idle money loses value in real terms.";
  }

  if (lang === "ta") {
    story = `${title} பற்றி அறிந்து கொள்ள ரமேஷ் விரும்புகிறார், அதன் மூலம் தனது சேமிப்பை பாதுகாப்பாக வளர்க்க நினைக்கிறார்.`;
    question = `இந்த ${title} பாடத்தின் முக்கிய நோக்கம் என்ன?`;
    options = [
      "A) நீண்ட கால கூட்டு வட்டி மற்றும் அபாயத்தை சமநிலைப்படுத்துதல்",
      "B) ஒரே வாரத்தில் பணத்தை இரட்டிப்பாக்குவது",
      "C) வங்கியில் இருந்து இலவச பரிசுகளை பெறுவது"
    ];
    correctIndex = 0;
    explanation = "பாதுகாப்பான முதலீடு எப்போதும் அபாயத்தை சமநிலைப்படுத்தி கூட்டு வட்டியின் மூலம் வளர்வதையே நோக்கமாகக் கொண்டுள்ளது.";
  } else if (lang === "tanglish") {
    story = `Ramesh vandhu ${title} pathi learn panna porar. Unga savings-ah secure-ah scale panna trades-off theriyanum.`;
    question = `Indha ${title} concept-la key factor enna boss?`;
    options = [
      "A) Risk and long-term compounding growth dynamic-ah balance panradhu",
      "B) One week-la money-a double panradhu",
      "C) Bank-la irundhu free gift vaanguradhu"
    ];
    correctIndex = 0;
    explanation = "Nalla invest panradhunaale risk-ah compound growth kooda balance panradhu dhaan boss!";
  }

  return { story, question, options, correctIndex, explanation };
};

const getFallbackSideQuest = (stationId, lang) => {
  let questions = [];

  if (stationId === 2) {
    questions = [
      { q: "What does NAV stand for in Mutual Funds?", options: ["A) Net Asset Value", "B) New Active Variable", "C) Net Annual Volume"], answer: "A", explanation: "NAV is the Net Asset Value per unit of a mutual fund scheme." },
      { q: "Which SIP interval exploits compounding best?", options: ["A) Annual", "B) Monthly regular installments", "C) One-time lump sum at peak"], answer: "B", explanation: "Regular monthly SIPs exploit rupee-cost averaging and price dips." },
      { q: "What is the lock-in period for ELSS mutual funds?", options: ["A) 5 Years", "B) 3 Years", "C) No lock-in"], answer: "B", explanation: "ELSS tax-saving funds have the shortest lock-in period of 3 years under Section 80C." }
    ];
  } else if (stationId === 3) {
    questions = [
      { q: "What does a high P/E ratio usually imply?", options: ["A) Underpriced stock", "B) High growth expectations or overpricing", "C) Low company profit"], answer: "B", explanation: "P/E compares price to earnings; a high ratio means investors expect high future earnings growth." },
      { q: "An RSI value above 70 indicates a stock is...", options: ["A) Oversold", "B) Overbought", "C) Fairly priced"], answer: "B", explanation: "Relative Strength Index (RSI) above 70 is traditionally considered overbought." },
      { q: "DuPont analysis breaks down ROE into how many components?", options: ["A) 3 components", "B) 5 components", "C) 2 components"], answer: "A", explanation: "Traditional DuPont analysis breaks ROE into Profit Margin, Asset Turnover, and Financial Leverage." }
    ];
  } else if (stationId === 4) {
    questions = [
      { q: "Which option Greek measures sensitivity to time decay?", options: ["A) Delta", "B) Theta", "C) Vega"], answer: "B", explanation: "Theta represents the rate of decay in the value of an option as time passes." },
      { q: "What is the primary benefit of an option spread?", options: ["A) Unlimited profits", "B) Capped/defined risk and lower capital", "C) Zero broker commissions"], answer: "B", explanation: "Spreads involve buying and selling options together to limit potential losses." },
      { q: "Which of these is a promoter red flag?", options: ["A) Increasing promoter share pledge past 50%", "B) Declining company debt levels", "C) Regular clean audits"], answer: "A", explanation: "High promoter pledging indicates promoters are borrowing heavily against their company shares." }
    ];
  } else {
    // Station 1
    questions = [
      { q: "What is the golden rule of personal budgeting?", options: ["A) Spend first, save what is left", "B) Save first, spend what is left", "C) Borrow to spend more"], answer: "B", explanation: "Prioritizing savings (e.g. 50/30/20 rule) is the foundation of wealth building." },
      { q: "What is the ideal emergency fund buffer size?", options: ["A) 3-6 months of essential living expenses", "B) 1 month of luxury expenses", "C) Capped at ₹10,000"], answer: "A", explanation: "An emergency fund should cover 3 to 6 months of basic living expenses for safety." },
      { q: "Which asset is directly eroded by inflation?", options: ["A) Gold", "B) Real Estate", "C) Idle Cash in locker"], answer: "C", explanation: "Idle cash loses purchasing power as prices rise, yielding negative real returns." }
    ];
  }

  // Handle Tamil translations for fallback
  if (lang === "ta") {
    questions = questions.map(q => {
      // Simple translation maps for keys
      return {
        ...q,
        q: `${q.q} (தமிழில்)`,
        explanation: `${q.explanation} (விளக்கம்)`
      };
    });
  }

  return { questions };
};

const getFallbackCrisis = (title, lang) => {
  let titleText = "Sudden Volatility Shock";
  let desc = "The stock market indices are experiencing a sharp 5% decline due to global sell-offs. Volatility is rising fast.";
  let driftVariable = "primary";
  let driftDirection = "down";
  let stabilizeHint = "Slide the duration/hedging sliders to increase risk protection and stabilize the compound portfolio yield.";

  const t = title.toLowerCase();
  if (t.includes("inflation") || t.includes("cpi") || t.includes("wpi")) {
    titleText = "Crude Oil Price Spike!";
    desc = "Global Brent crude crosses $95/barrel, causing domestic retail inflation to spike uncontrollably.";
    driftVariable = "primary";
    driftDirection = "up";
    stabilizeHint = "Increase the yield or investment duration slider to grow your returns above the inflation rate.";
  }

  if (lang === "ta") {
    titleText = "திடீர் சந்தை வீழ்ச்சி!";
    desc = "உலகளாவிய விற்பனை காரணமாக பங்குச் சந்தை குறியீடுகள் 5% சரிவைச் சந்திக்கின்றன. ஏற்ற இறக்கம் வேகமாக அதிகரிக்கிறது.";
    stabilizeHint = "பாதுகாப்பை அதிகரிக்க கால அளவு/ஹெட்ஜிங் ஸ்லைடர்களை சரிசெய்து கூட்டு போர்ட்ஃபோலியோவை சமநிலைப்படுத்தவும்.";
  }

  return { title: titleText, desc, driftVariable, driftDirection, stabilizeHint };
};

// @route POST /api/learn/term-news — Generate or fetch news for a term
router.post('/term-news', async (req, res) => {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, message: 'Term required' });

    const prompt = `You are a financial news editor in India. Generate a highly realistic, funny, and engaging short news snippet for the financial term: "${term}".
Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no comments):
{
  "headline": "A catchy, realistic newspaper headline matching Indian business news style (e.g., Zerodha, HDFC, SBI, RBI actions, SEBI warnings, or general retail market buzz).",
  "source": "E.g., Mumbai Financial Times, Namma Market Daily, or Dalal Street Bulletin",
  "date": "Today's date",
  "summary": "A 2-sentence explanation of why ${term} is trending today and what it means for retail investors."
}
Keep it in colloquial English or Tanglish, humorous but educational.`;

    const raw = await getAI([
      { role: 'system', content: 'You are a professional financial editor. You always output ONLY valid raw JSON.' },
      { role: 'user', content: prompt }
    ], 500, 'explain', term);

    const cleanJson = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, term, ...parsed });
  } catch (e) {
    const fallback = getFallbackTermNews(req.body.term);
    res.json({ success: true, term: req.body.term, ...fallback });
  }
});

const getFallbackTermNews = (term) => {
  const t = (term || '').toLowerCase();
  let headline = `Dalal Street Buzzes as ${term} Becomes Hot Topic Among Retail Investors`;
  let source = "Dalal Street Chronicle";
  let summary = `Market experts note that understanding ${term} is crucial in the current volatile market cycle. Retail investors are advised to study its impact before making trading decisions.`;

  if (t.includes('cibil') || t.includes('credit score')) {
    headline = "SBI Alerts Borrowers: Keep CIBIL Score Above 750 or Pay Extra EMI on Loans!";
    source = "Mumbai Financial Express";
    summary = "State Bank of India announced that interest rates on home and car loans will now be directly linked to CIBIL scores. If your score is low, get ready to pay extra interest on your next EMI!";
  } else if (t.includes('inflation') || t.includes('cpi')) {
    headline = "RBI Governor Warns of Inflation Spikes Due to Onion & Tomato Price Surge!";
    source = "Namma Market Daily";
    summary = "As retail inflation (CPI) climbs, RBI might keep repo rates high. Retail investors should look at inflation-hedged assets like gold or index funds to protect their purchasing power.";
  } else if (t.includes('repo rate')) {
    headline = "RBI Holds Repo Rate Steady at 6.5%: EMIs Unchanged for Now!";
    source = "The Mint India";
    summary = "The Monetary Policy Committee decided to keep repo rates unchanged to balance growth and inflation. Safe investors are locking in higher yields on fixed deposits before bank rates drop.";
  } else if (t.includes('ipo')) {
    headline = "New Tech Startup IPO Subscribed 150x: Retail Frenzy Grips Dalal Street!";
    source = "Dalal Street Bulletin";
    summary = "A trending tech company's IPO saw massive retail interest, but analysts warn of high valuations. Remember to check if it's a multi-bagger or a speculative trap before subscribing.";
  } else if (t.includes('options') || t.includes('futures') || t.includes('derivative')) {
    headline = "SEBI Issues Red Flag: 9 out of 10 Retail Option Traders Lose Money on Expiry Day!";
    source = "Namma Bazaar News";
    summary = "The market regulator warns that option buying without hedging is a recipe for wealth loss. Retail traders are urged to study Option Greeks (Theta decay, Delta) before writing puts.";
  } else if (t.includes('mutual fund') || t.includes('sip')) {
    headline = "Indian Retail Investors Flow ₹20,000 Crore into SIPs in a Single Month!";
    source = "Bazaars of India";
    summary = "Despite stock market volatility, long-term investors are compounding their wealth through disciplined monthly mutual fund investments. Consistent SIPs help average out market swings.";
  } else if (t.includes('gold') || t.includes('sgb')) {
    headline = "RBI Announces New Sovereign Gold Bond (SGB) Series with 2.5% Annual Interest!";
    source = "Gold Rate Express";
    summary = "Investors are rushing to buy digital gold via SGBs to lock in interest payouts and tax-free capital gains. A perfect hedge against inflation and equity market corrections!";
  } else if (t.includes('pe ratio') || t.includes('valuation')) {
    headline = "Nifty 50 P/E Ratio Crosses 24: Are Indian Markets Getting Too Expensive?";
    source = "Dalal Street Analysis";
    summary = "High valuation multiples have made investors cautious about large-cap stocks. Analysts suggest comparing enterprise values and DuPont metrics before buying the dip.";
  } else if (t.includes('dividend') || t.includes('yield')) {
    headline = "ITC Announces Special Dividend: Retail Shareholders Rejoice Over 'Cigarette & Ashirvaad Atta' Cash Flow!";
    source = "Kolkata Market Chronicle";
    summary = "ITC continues its high dividend payout streak, offering attractive dividend yields. Safe income investors are reinvesting their cash payouts to compound holdings.";
  } else if (t.includes('demat')) {
    headline = "Zerodha & Groww Cross 15 Million Demat Accounts as Young India Rushes to Invest!";
    source = "FinTech Dispatch";
    summary = "Creating digital accounts is now instant via e-KYC. However, new account holders are advised to avoid penny stocks and leverage traps, and focus on solid Blue Chip shares.";
  }

  return {
    headline,
    source,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    summary
  };
};

module.exports = router;
