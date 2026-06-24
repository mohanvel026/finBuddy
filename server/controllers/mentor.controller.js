const axios = require('axios');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const ChatSession = require('../models/ChatSession');
const { calculateTax, calculateDynamicTax } = require('../algorithms/taxEngine');
const { calculateEMI } = require('../algorithms/emiEngine');

// Centralized unified AI completion utility
const { getAICompletion } = require('../utils/aiService');

// Build user financial context for AI
const buildUserContext = async (userId) => {
  const user = await User.findById(userId).select('virtualWallet finScore currentStreak spendingPersonality');
  const portfolio = await Portfolio.findOne({ user: userId });
  const recentTrades = await Trade.find({ user: userId }).sort({ timestamp: -1 }).limit(10);
  const groups = await Group.find({ 'members.user': userId });
  const groupIds = groups.map(g => g._id);
  const recentExpenses = await Expense.find({
    group: { $in: groupIds },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  const totalSpent30Days = recentExpenses.reduce((s, e) => {
    const split = e.splits?.find(sp => sp.user?.toString() === userId.toString());
    return s + (split?.amount || 0);
  }, 0);

  return {
    walletBalance: user.virtualWallet,
    finScore: user.finScore,
    streak: user.currentStreak,
    personality: user.spendingPersonality,
    portfolio: {
      holdings: portfolio?.holdings?.length || 0,
      totalInvested: portfolio?.totalInvested || 0,
      currentValue: portfolio?.currentValue || 0,
      pnl: (portfolio?.currentValue || 0) - (portfolio?.totalInvested || 0)
    },
    recentTrades: recentTrades.map(t => ({
      symbol: t.symbol,
      type: t.tradeType,
      pnl: t.profitLoss,
      score: t.aiScore
    })),
    spending: { last30Days: totalSpent30Days, groups: groups.length }
  };
};

// @desc    Ask AI Mentor
// @route   POST /api/mentor/ask
const askMentor = async (req, res) => {
  const { question, lang = 'en', sessionId } = req.body;
  let context;
  try {
    context = await buildUserContext(req.user._id);
    
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    }
    
    if (!session) {
      const title = question.substring(0, 35) + (question.length > 35 ? '...' : '');
      session = await ChatSession.create({
        user: req.user._id,
        title,
        messages: []
      });
    } else if (session.title === 'New Chat' || session.messages.length === 0) {
      session.title = question.substring(0, 35) + (question.length > 35 ? '...' : '');
    }

    let languageSpecificRule = "";
    if (lang === "ta") {
      languageSpecificRule = "The user prefers Standard TAMIL. You MUST answer the user completely in standard TAMIL SCRIPT (தமிழ்) only. Do not use English words unless they are necessary technical nouns, but write them in Tamil representation.";
    } else if (lang === "tanglish") {
      languageSpecificRule = "The user prefers TANGLISH (colloquial Tamil mixed with English finance terms, written entirely in Romanized English script). You MUST write your response entirely in romanized Tanglish. Style: 'Hey buddy! Stock market simple-a purinjuka shares buy pannalam. Unnoda virtual cash beero-la vekura badhila mutual funds-la active SIP (Systematic Plan) arambicha, compound interest valarndhu snowball aagum!'";
    } else {
      languageSpecificRule = "The user prefers English. Respond in professional, easy-to-understand, and encouraging English.";
    }

    const historyMessages = session.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const messages = [
      {
        role: 'system',
        content: `You are FinBuddy AI Mentor - a friendly, elite financial coach for Indian college students.
        User context: ${JSON.stringify(context)}
        
        Rules:
        - Always use Indian context (₹, NSE/BSE stocks, Indian tax laws)
        - Be encouraging, highly educational, and beginner-friendly
        - Give specific, highly actionable advice based on their wallet balance (₹${context?.walletBalance}) and portfolio
        - Keep responses under 180 words
        - Use emojis sparingly
        - Never recommend real investments - this is virtual/educational
        - LANGUAGE REQUIREMENT: ${languageSpecificRule}`
      },
      ...historyMessages,
      { role: 'user', content: question }
    ];

    const answer = await getAICompletion(messages, 500);

    session.messages.push({ role: 'user', content: question });
    session.messages.push({ role: 'assistant', content: answer });
    await session.save();

    res.json({ success: true, answer, context, session });
  } catch (error) {
    console.warn('⚡ askMentor falling back to expert localized knowledge:', error.message);
    const lowerQ = (question || '').toLowerCase();
    
    let answer = "";
    if (lang === "ta") {
      answer = "இது ஒரு சிறந்த நிதி கேள்வி! உங்கள் தனிப்பட்ட AI வழிகாட்டியாக, குறைந்த கட்டண, பன்முகப்படுத்தப்பட்ட நிஃப்டி 50 இன்டெக்ஸ் ஃபண்டில் தொடங்க பரிந்துரைக்கிறேன். ஒழுக்கமான முதலீட்டு பழக்கத்தை உருவாக்க, ஒவ்வொரு மாதமும் ₹500 - ₹2,000 வரையிலான முறையான முதலீட்டுத் திட்டம் (SIP) உங்களுக்குப் பாதுகாப்பாக விளங்கும்.";
      
      if (lowerQ.includes('invest') || lowerQ.includes('stock') || lowerQ.includes('share') || lowerQ.includes('mutual') || lowerQ.includes('முதலீடு') || lowerQ.includes('பங்கு')) {
        answer = `முதலீடுகள் தான் செல்வத்தை பெருக்கும் முக்கிய இயந்திரம்! இந்தியக் கல்லூரி மாணவர்களுக்கு, நிஃப்டி 50 இன்டெக்ஸ் ஃபண்ட் மற்றும் பாதுகாப்பான அரசாங்கப் பத்திரங்களில் முதலீடு செய்ய பரிந்துரைக்கிறேன். உங்களிடம் ₹${(context?.walletBalance || 100000).toLocaleString('ta-IN')} விளையாட்டுப் பணம் இருப்பதால், ஒவ்வொரு மாதமும் ₹1,000 முறையான முதலீட்டுத் திட்டம் (SIP) செய்வது மிகவும் பாதுகாப்பானது.`;
      } else if (lowerQ.includes('tax') || lowerQ.includes('80c') || lowerQ.includes('save') || lowerQ.includes('வரி')) {
        answer = "இந்திய வரிச் சட்டங்களின் கீழ் (பிரிவு 80சி, ₹1.5 லட்சம் வரை) வரி சேமிக்க சிறந்த வழிகள் ELSS (மியூச்சுவல் ஃபண்ட்), PPF மற்றும் NPS ஆகும். ELSS திட்டங்கள் வெறும் 3 வருட லாக்-இன் காலத்தைக் கொண்டிருப்பதால் இளம் முதலீட்டாளர்களுக்கு மிகவும் ஏற்றது!";
      } else if (lowerQ.includes('pe ratio') || lowerQ.includes('valuation') || lowerQ.includes('விகிதம்')) {
        answer = "பி.இ விகிதம் (P/E Ratio) என்பது ஒரு நிறுவனம் ஈட்டும் ஒரு ரூபாய் லாபத்திற்கு நீங்கள் எவ்வளவு பணம் கொடுக்கிறீர்கள் என்பதைக் குறிக்கும் விலை விவரக் குறியீடு. குறைந்த பி.இ மலிவான விலையையும், அதிக பி.இ அதிக தேவையையும் காட்டும். வாங்குவதற்கு முன் ஒப்பிட்டுப் பாருங்கள்!";
      } else if (lowerQ.includes('sip') || lowerQ.includes('lumpsum') || lowerQ.includes('முறையான')) {
        answer = "ஒரே நேரத்தில் பெரிய தொகையை முதலீடு செய்வதை விட முறையான முதலீட்டுத் திட்டம் (SIP) சிறந்தது! ஒவ்வொரு மாதமும் ₹500 முதலீடு செய்வதன் மூலம், சந்தை இறங்கும்போது அதிக யூனிட்களையும், ஏறும்போது குறைந்த யூனிட்களையும் வாங்கலாம். இது சந்தை நேரத்தை கணிக்கும் பதற்றத்தைத் தவிர்க்கும்.";
      } else if (lowerQ.includes('emergency') || lowerQ.includes('saving') || lowerQ.includes('அவசர')) {
        answer = "அவசரகால நிதி என்பது உங்கள் நிதிப் பாதுகாப்பு வளையம்! கல்லூரி மாணவர்கள் தங்கள் 3 முதல் 6 மாத செலவுக்கான தொகையை (சுமார் ₹10,000 - ₹25,000) அவசர கால தேவைகளுக்காக எளிதில் எடுக்கக்கூடிய சேமிப்பு கணக்கில் வைத்திருக்க வேண்டும்.";
      }
    } else if (lang === "tanglish") {
      answer = "Sema financial question boss! Unga personal AI Mentor-a na solrathu: simple low-cost Nifty 50 Index Fund-la start பண்ணுங்க. Nalla disciplined rules maintain panna, monthly fixed ₹500 - ₹2,000 SIP start panna compound interest moolama super wealth building aagum!";
      
      if (lowerQ.includes('invest') || lowerQ.includes('stock') || lowerQ.includes('share') || lowerQ.includes('mutual')) {
        answer = `Investments dhan unga wealth building engine! College students simple-a Nifty 50 index fund and safe government bonds pair panni arambikalam. Ungaloda play wallet-la ₹${(context?.walletBalance || 100000).toLocaleString('en-IN')} cash irukradhala, single lumpsum high risk trade pannaama disciplined monthly SIP start pannunga!`;
      } else if (lowerQ.includes('tax') || lowerQ.includes('80c') || lowerQ.includes('save')) {
        answer = "Indian tax laws (Section 80C) moolama annual tax-la ₹1.5 Lakhs varaikkum save panna ELSS mutual funds, PPF, and NPS super choice. ELSS-ku lock-in period just 3 years dhan, adhnnala young age-ku idhu best deal!";
      } else if (lowerQ.includes('pe ratio') || lowerQ.includes('valuation') || lowerQ.includes('price to earning')) {
        answer = "P/E ratio-nu solradhu stock price detail index mathiri. Company earn panra ₹1 profit-ku neenga evlo pay panreenganu idhu kaatum. Low P/E ratio target bargain-a irukum, and high P/E expensive rate custom parameter.";
      } else if (lowerQ.includes('sip') || lowerQ.includes('lumpsum')) {
        answer = "Lumpsum-a mudakratha vida dynamic Systematic Investment Plan (SIP) romba super. Ovvoru maasomum ₹500 regular-a pay panumbodhu market low zones-la adhigama units kedaikum, timing head-aches-u totally zero aagidum!";
      } else if (lowerQ.includes('emergency') || lowerQ.includes('saving')) {
        answer = "Emergency Fund dhan unga structural security shield! Personal unexpected expenses handle panna 3-6 months living expenses savings target ready-a liquid FD or simple bank cache-la hold panni vachikonga.";
      }
    } else {
      answer = "That is an excellent financial question! As your personal AI Mentor, I highly recommend starting with a low-cost, diversified Nifty 50 Index Fund. Since you are building good disciplined habits, a regular SIP (Systematic Investment Plan) of ₹500 - ₹2,000 per month will help you compound wealth safely while protecting against short-term market volatility.";
      
      if (lowerQ.includes('invest') || lowerQ.includes('stock') || lowerQ.includes('share') || lowerQ.includes('mutual')) {
        answer = `Investments are the key engine of wealth creation! For college students in India, I suggest allocating your capital across a diversified index fund (like Nifty 50) and secure fixed-income assets. Since you have ₹${(context?.walletBalance || 100000).toLocaleString('en-IN')} in virtual play capital, starting with a disciplined monthly SIP of ₹1,000 is far safer than jumping into speculative options or hype trades.`;
      } else if (lowerQ.includes('tax') || lowerQ.includes('80c') || lowerQ.includes('save')) {
        answer = "To save tax under Indian tax laws (Section 80C, up to ₹1.5 Lakhs), the best options are ELSS (Equity Linked Savings Schemes), PPF, and National Pension System (NPS). ELSS is particularly attractive for younger investors as it has the shortest lock-in period of just 3 years and offers exposure to stock market compounding!";
      } else if (lowerQ.includes('pe ratio') || lowerQ.includes('valuation') || lowerQ.includes('price to earning')) {
        answer = "The Price-to-Earnings (P/E) ratio shows how much investors are willing to pay for every ₹1 of a company's earnings. A low P/E might signal an undervalued bargain, whereas a high P/E indicates high growth expectations. Always compare a stock's P/E to its historical average and its direct sector peers before buying!";
      } else if (lowerQ.includes('sip') || lowerQ.includes('lumpsum')) {
        answer = "A Systematic Investment Plan (SIP) is generally superior for beginners compared to a lumpsum! With SIP, you invest a fixed amount regularly (e.g. ₹500 every month), which benefits from 'Rupee Cost Averaging'—buying more units when prices are low and fewer when prices are high. This removes the stress of trying to time the market.";
      } else if (lowerQ.includes('emergency') || lowerQ.includes('saving')) {
        answer = "An Emergency Fund is your ultimate financial shield! You should aim to save 3 to 6 months of your monthly living expenses in a highly liquid liquid-fund or savings account (about ₹10,000 - ₹25,000 for college students). This ensures you never have to sell your investments or take high-interest loans when unexpected expenses arise.";
      }
    }
    
    try {
      let session;
      if (sessionId) {
        session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      }
      if (!session) {
        session = await ChatSession.create({
          user: req.user._id,
          title: question.substring(0, 35) + (question.length > 35 ? '...' : ''),
          messages: []
        });
      }
      session.messages.push({ role: 'user', content: question });
      session.messages.push({ role: 'assistant', content: answer });
      await session.save();
      res.json({ success: true, answer, context, session, fallback: true });
    } catch (saveErr) {
      res.json({ success: true, answer, context, fallback: true });
    }
  }
};

// @desc    Get weekly AI report
// @route   GET /api/mentor/weekly-report
const getWeeklyReport = async (req, res) => {
  let context;
  try {
    context = await buildUserContext(req.user._id);
    const messages = [
      {
        role: 'system',
        content: 'You are a financial coach. Generate a concise weekly financial report in JSON format only.'
      },
      {
        role: 'user',
        content: `Generate a weekly report for this user: ${JSON.stringify(context)}
        
        Return ONLY valid JSON (no markdown):
        {
          "greeting": "personalised greeting",
          "overallGrade": "A/B/C/D",
          "highlights": ["positive thing 1", "positive thing 2"],
          "warnings": ["area to improve 1"],
          "tip": "one actionable tip for this week",
          "nextWeekGoal": "one specific goal"
        }`
      }
    ];

    const content = await getAICompletion(messages, 600, { type: "json_object" });

    let report;
    try {
      report = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      report = {
        greeting: `Great week, ${req.user.name || 'Alex'}!`,
        overallGrade: 'B',
        highlights: ['You are building good habits', 'Keep tracking your expenses'],
        warnings: ['Try to invest more consistently'],
        tip: 'Start a small SIP this week',
        nextWeekGoal: 'Make at least 3 trades'
      };
    }

    res.json({ success: true, report, context });
  } catch (error) {
    console.warn('⚡ getWeeklyReport falling back to local expert weekly report generator...');
    const report = {
      greeting: `Hey ${req.user.name || 'Alex'}! Outstanding job keeping your learning streak active! 🚀`,
      overallGrade: (context?.finScore || 500) >= 700 ? 'A' : (context?.finScore || 500) >= 500 ? 'B' : 'C',
      highlights: [
        `Your virtual wallet is well-capitalized at ₹${(context?.walletBalance || 100000).toLocaleString('en-IN')}.`,
        `Disciplined trading habit with an active streak of ${context?.streak || 0} days.`
      ],
      warnings: [
        "No active systematic investment plan running yet.",
        "Your recent transactions show cash reserves are idle in the play wallet."
      ],
      tip: "Set up a small SIP of ₹1,000 in a diversified mutual fund to harness the power of compounding!",
      nextWeekGoal: "Analyze at least 2 mutual funds using the MF Analyzer compounding engine."
    };
    res.json({ success: true, report, context, fallback: true });
  }
};

// @desc    What-If simulator
// @route   POST /api/mentor/whatif
const whatIfSimulator = async (req, res) => {
  const { scenario, amount, duration } = req.body;
  const amt = parseFloat(amount) || 1000;
  const dur = parseInt(duration) || 12;
  const scenarioLower = (scenario || '').toLowerCase();
  
  const expectedRate = scenarioLower.includes('fd') || scenarioLower.includes('fixed') || scenarioLower.includes('saving') ? 0.07 
    : scenarioLower.includes('gold') || scenarioLower.includes('sgb') ? 0.09 
    : scenarioLower.includes('ppf') ? 0.071
    : 0.14;
    
  const monthlyRate = expectedRate / 12;
  const futureVal = amt * ((Math.pow(1 + monthlyRate, dur) - 1) / monthlyRate) * (1 + monthlyRate);
  const invested = amt * dur;
  const gains = Math.max(0, futureVal - invested);

  const inflationRate = 0.06;
  const monthlyInflation = inflationRate / 12;
  const realVal = futureVal / Math.pow(1 + monthlyInflation, dur);

  let context;
  try {
    context = await buildUserContext(req.user._id);
    const messages = [
      {
        role: 'system',
        content: `You are a financial analyst specializing in Indian personal finance and the Union Budget 2025–26.
        User context: ${JSON.stringify(context)}
        
        Provide high-fidelity insights regarding:
        - "${scenario}" with ₹${amount}/month for ${duration} months.
        
        CRITICAL RULES:
        1. DO NOT calculate or mention basic nominal compound math, nominal total invested amount, or final nominal wealth values because the UI chart already displays these metrics reactively.
        2. Focus strictly on these three fresh perspectives:
           - Taxation under current Indian rules (slab rate, 12.5% LTCG, 20% STCG, or tax-free status).
           - Inflation drag (purchasing power loss and the real inflation-adjusted wealth equivalent at 6% inflation).
           - Risk & drawdown parameters (Beta, volatility class, lock-in terms).
           - Strategic Level-Up advice to optimize this contribution.
        3. Respond ONLY in valid JSON format matching this schema:
        {
          "inflationRealValue": "Calculate what this wealth is worth in actual purchasing power today after a 6% inflation discount. Keep it highly specific (e.g. '₹54,320 in real terms, representing a purchasing power haircut of ₹4,200').",
          "taxAnalysis": "Tax implications under current Indian Budget rules (e.g. slab vs 12.5% LTCG vs 20% STCG vs EEE). Be extremely specific to the asset type.",
          "riskMetrics": "Explain lock-ins, standard drawdown history, beta class, and capital risk levels.",
          "strategicAlternative": "A specific customized personal finance upgrade alternative (e.g. blending FDs with a Nifty Index SIP, or gold with ELSS)."
        }`
      }
    ];

    const content = await getAICompletion(messages, 500, { type: "json_object" });
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    res.json({ 
      success: true, 
      projection: parsed 
    });
  } catch (error) {
    console.warn('⚡ whatIfSimulator falling back to expert JSON generator...');
    
    let taxAnalysis = "Taxed under standard Indian income tax rules. Ensure assets are held for >12 months to qualify for 12.5% Long-Term Capital Gains (LTCG) brackets instead of short-term rates.";
    let riskMetrics = "Moderate volatility profile. Historical equity indices experience short-term drawdowns of 12-15% during market corrections, requiring a disciplined 3+ year time window.";
    let strategicAlternative = "Consider automating this allocation through a recurring Systematic Investment Plan (SIP) in a direct plan growth index fund for minimal expense ratios and efficient compounding.";

    if (scenarioLower.includes('fd') || scenarioLower.includes('fixed') || scenarioLower.includes('saving')) {
      taxAnalysis = "Interest earned is 100% taxable at your personal income slab tax rate (up to 30% + cess). No indexation benefits are allowed. Banks deduct 10% TDS if annual interest exceeds ₹40,000.";
      riskMetrics = "Practically zero capital risk. Bank deposits are securely insured up to ₹5 Lakhs per depositor by the RBI's DICGC. Zero liquidity barriers, though early exit incurs a minor 1% rate penalty.";
      strategicAlternative = "Since FD post-tax returns barely beat inflation, consider allocating 30% of this monthly amount into a low-cost Nifty 50 Index Fund SIP to build real wealth.";
    } else if (scenarioLower.includes('gold') || scenarioLower.includes('sgb')) {
      taxAnalysis = "Sovereign Gold Bonds (SGB) are 100% exempt from capital gains tax at 8-year maturity. If sold earlier on the stock exchange, gains are taxed under the lower 12.5% LTCG rules.";
      riskMetrics = "Backed by the Government of India so sovereign credit risk is zero. However, gold spot prices are subject to global commodity volatility. High liquidity barrier due to exchange volumes.";
      strategicAlternative = "Gold is an outstanding hedge. Enhance this plan by pairing it with a high-growth Flexi-Cap Mutual Fund SIP to balance defensive shielding with domestic equity expansion.";
    } else if (scenarioLower.includes('ppf')) {
      taxAnalysis = "PPF holds a premium EEE (Exempt-Exempt-Exempt) status. Contributions, interest earned, and final maturity withdrawals are all completely 100% exempt from income tax.";
      riskMetrics = "Zero capital risk as PPF is fully guaranteed by the Central Government. However, it carries a strict 15-year liquidity barrier (with partial withdrawal permitted from year 7 onwards).";
      strategicAlternative = "PPF is excellent for your secure debt portfolio. Allocate some of the remaining budget to high-yield equity funds to capture Indian wealth compounding.";
    } else if (scenarioLower.includes('mid-cap') || scenarioLower.includes('small-cap') || scenarioLower.includes('equity') || scenarioLower.includes('nifty') || scenarioLower.includes('sip') || scenarioLower.includes('mutual')) {
      taxAnalysis = "Long-Term Capital Gains (LTCG) above ₹1.25 Lakhs per year are taxed at 12.5% under Union Budget guidelines. Short-Term Capital Gains (STCG) are taxed at 20% if sold within 12 months.";
      riskMetrics = "Subject to equity market drawdowns of up to 15-20% during global cycles. Requires a minimum 5-year investment tenure to smooth out high volatility cycles and achieve stable returns.";
      strategicAlternative = "Excellent high-compounding strategy. Consider setting up dynamic automated SIP triggers and diversifying 15% into gold/SGBs to cushion major equity corrections.";
    }

    const fallbackResponse = {
      inflationRealValue: `₹${Math.round(realVal).toLocaleString('en-IN')} in actual purchasing power, accounting for a 6% annual inflation discount over ${dur} months (a purchasing power erosion of ~₹${Math.round(futureVal - realVal).toLocaleString('en-IN')}).`,
      taxAnalysis,
      riskMetrics,
      strategicAlternative
    };

    res.json({ 
      success: true, 
      projection: fallbackResponse,
      fallback: true 
    });
  }
};

// @desc    Get Financial Twin analysis
// @route   GET /api/mentor/financial-twin
const getFinancialTwin = async (req, res) => {
  let context;
  try {
    context = await buildUserContext(req.user._id);
    const messages = [
      {
        role: 'system',
        content: 'Analyze financial behavior and create a financial personality profile. Return JSON only.'
      },
      {
        role: 'user',
        content: `Analyze this user's financial behavior: ${JSON.stringify(context)}
        
        Return ONLY valid JSON:
        {
          "archetypeName": "name (e.g. Cautious Learner)",
          "archetypeEmoji": "emoji",
          "description": "2 sentences about their financial style",
          "strengths": ["strength1", "strength2"],
          "blindspots": ["blindspot1"],
          "prediction": "where they'll be financially in 1 year if they continue",
          "recommendation": "top 1 change they should make"
        }`
      }
    ];

    const content = await getAICompletion(messages, 500, { type: "json_object" });

    let twin;
    try {
      twin = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      twin = {
        archetypeName: 'Curious Explorer',
        archetypeEmoji: '🔭',
        description: 'You are just starting your financial journey. Your curiosity will serve you well.',
        strengths: ['Willing to learn', 'Tracking expenses'],
        blindspots: ['Needs more consistent investing'],
        prediction: 'Solid foundation built if you stay consistent',
        recommendation: 'Set up a monthly SIP of ₹500'
      };
    }

    res.json({ success: true, twin, context });
  } catch (error) {
    console.warn('⚡ getFinancialTwin falling back to personality archetype generator...');
    const twin = {
      archetypeName: (context?.finScore || 500) >= 700 ? 'Master Wealth Builder' : (context?.finScore || 500) >= 500 ? 'Disciplined Explorer' : 'Active Learner',
      archetypeEmoji: (context?.finScore || 500) >= 700 ? '👑' : (context?.finScore || 500) >= 500 ? '⏳' : '🔭',
      description: `You approach financial decisions with structural logic. Your streak of ${context?.streak || 0} days shows great educational persistence.`,
      strengths: [
        `High virtual wallet discipline with ₹${(context?.walletBalance || 100000).toLocaleString('en-IN')} capital reserves.`,
        "Steady learning habit and active engagement with financial tools."
      ],
      blindspots: [
        "Keeps excess capital in play-money cash rather than actively compounding in long term diversified assets."
      ],
      prediction: `In 1 year, you are projected to compound your portfolio by 12% to 15% with exceptionally low drawdown risk!`,
      recommendation: "Set up a diversified SIP plan and deploy 30% of your idle play wallet balance into low-cost index funds."
    };
    res.json({ success: true, twin, context, fallback: true });
  }
};

// @desc    Get learning modules
// @route   GET /api/mentor/lessons
const getLessons = async (req, res) => {
  const user = await User.findById(req.user._id).select('lessonsCompleted virtualCoins');

  const lessons = [
    { id: 'l1', title: 'What is the Stock Market?', duration: '3 min', coins: 20, category: 'basics', emoji: '📈' },
    { id: 'l2', title: 'How SIP Works - Power of Compounding', duration: '4 min', coins: 20, category: 'mutualfunds', emoji: '💰' },
    { id: 'l3', title: 'Understanding PE Ratio', duration: '3 min', coins: 25, category: 'analysis', emoji: '🔢' },
    { id: 'l4', title: 'What is Nifty 50 & Sensex?', duration: '3 min', coins: 15, category: 'basics', emoji: '📊' },
    { id: 'l5', title: 'How to Read a Balance Sheet', duration: '5 min', coins: 30, category: 'analysis', emoji: '📋' },
    { id: 'l6', title: 'Tax Saving Investments (80C)', duration: '4 min', coins: 25, category: 'tax', emoji: '🧾' },
    { id: 'l7', title: 'What is Crypto & Blockchain?', duration: '4 min', coins: 20, category: 'crypto', emoji: '₿' },
    { id: 'l8', title: 'Emergency Fund - Why & How', duration: '3 min', coins: 20, category: 'planning', emoji: '🛡️' },
    { id: 'l9', title: 'Options Basics: Calls and Puts', duration: '6 min', coins: 35, category: 'advanced', emoji: '⚙️' },
    { id: 'l10', title: 'Diversification - Don\'t put eggs in one basket', duration: '3 min', coins: 20, category: 'basics', emoji: '🥚' },
    { id: 'l11', title: 'Inflation & Purchasing Power', duration: '3 min', coins: 20, category: 'basics', emoji: '💸' },
    { id: 'l12', title: 'Active vs Passive Mutual Funds', duration: '4 min', coins: 25, category: 'mutualfunds', emoji: '🏢' },
    { id: 'l13', title: 'Asset Allocation for Beginners', duration: '4 min', coins: 30, category: 'planning', emoji: '⚖️' },
  ];

  const lessonsWithStatus = lessons.map(l => ({
    ...l,
    completed: user.lessonsCompleted?.includes(l.id) || false
  }));

  const totalCoinsEarned = lessonsWithStatus
    .filter(l => l.completed)
    .reduce((s, l) => s + l.coins, 0);

  res.json({
    success: true,
    lessons: lessonsWithStatus,
    progress: {
      completed: user.lessonsCompleted?.length || 0,
      total: lessons.length,
      coinsEarned: totalCoinsEarned
    }
  });
};

// @desc    Complete a lesson
// @route   POST /api/mentor/lesson-complete
const completeLesson = async (req, res) => {
  try {
    const { lessonId, coinsReward } = req.body;
    const user = await User.findById(req.user._id);

    if (user.lessonsCompleted?.includes(lessonId)) {
      return res.json({ success: true, message: 'Already completed', alreadyDone: true });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { lessonsCompleted: lessonId },
      $inc: {
        virtualCoins: coinsReward || 20,
        currentSeasonPoints: coinsReward || 20
      }
    });

    res.json({
      success: true,
      coinsEarned: coinsReward || 20,
      message: `Lesson complete! +${coinsReward || 20} coins 🎉`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

let cachedTaxSlabs = null;
let lastCacheTime = 0;

const getLatestTaxSlabs = async (getAICompletionFunc) => {
  const now = Date.now();
  // Cache for 24 hours to ensure high performance and avoid rate limits
  if (cachedTaxSlabs && (now - lastCacheTime < 24 * 60 * 60 * 1000)) {
    return cachedTaxSlabs;
  }

  // Define fallback (perfect FY 2025-26 rules)
  const defaultSlabs = {
    financialYear: "2025-26",
    newRegime: {
      standardDeduction: 75000,
      slabs: [
        { range: 'Up to ₹4,00,000', rate: '0% Tax', min: 0, max: 400000, percent: 0 },
        { range: '₹4,00,001 to ₹8,00,000', rate: '5% Tax', min: 400000, max: 800000, percent: 5, hasRebate: true },
        { range: '₹8,00,001 to ₹12,00,000', rate: '10% Tax', min: 800000, max: 1200000, percent: 10, hasRebate: true },
        { range: '₹12,00,001 to ₹16,00,000', rate: '15% Tax', min: 1200000, max: 1600000, percent: 15 },
        { range: '₹16,00,001 to ₹20,00,000', rate: '20% Tax', min: 1600000, max: 2000000, percent: 20 },
        { range: '₹20,00,001 to ₹24,00,000', rate: '25% Tax', min: 2000000, max: 2400000, percent: 25 },
        { range: 'Above ₹24,00,000', rate: '30% Tax', min: 2400000, max: null, percent: 30 }
      ],
      rebateThreshold: 1200000,
      rebateAmount: 60000
    },
    oldRegime: {
      standardDeduction: 50000,
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0% Tax', min: 0, max: 250000, percent: 0 },
        { range: '₹2,50,001 to ₹5,00,000', rate: '5% Tax', min: 250000, max: 500000, percent: 5, hasRebate: true },
        { range: '₹5,00,001 to ₹10,00,000', rate: '20% Tax', min: 500000, max: 1000000, percent: 20 },
        { range: 'Above ₹10,00,000', rate: '30% Tax', min: 1000000, max: null, percent: 30 }
      ],
      rebateThreshold: 500000,
      rebateAmount: 12500
    }
  };

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a professional Indian tax compliance API.
You output the latest Income Tax slabs for the current/most recent Financial Year in India (such as FY 2025-26 or whatever is the absolute latest active regime introduced in the Union Budget).
Return ONLY valid JSON (no markdown block, no extra conversational text).
JSON Format:
{
  "financialYear": "2025-26",
  "newRegime": {
    "standardDeduction": 75000,
    "slabs": [
      { "range": "Up to ₹4,00,000", "rate": "0% Tax", "min": 0, "max": 400000, "percent": 0 },
      { "range": "₹4,00,001 to ₹8,00,000", "rate": "5% Tax", "min": 400000, "max": 800000, "percent": 5, "hasRebate": true },
      { "range": "₹8,00,001 to ₹12,00,000", "rate": "10% Tax", "min": 800000, "max": 1200000, "percent": 10, "hasRebate": true },
      { "range": "₹12,00,001 to ₹16,00,000", "rate": "15% Tax", "min": 1200000, "max": 1600000, "percent": 15 },
      { "range": "₹16,00,001 to ₹20,00,000", "rate": "20% Tax", "min": 1600000, "max": 2000000, "percent": 20 },
      { "range": "₹20,00,001 to ₹24,00,000", "rate": "25% Tax", "min": 2000000, "max": 2400000, "percent": 25 },
      { "range": "Above ₹24,00,000", "rate": "30% Tax", "min": 2400000, "max": null, "percent": 30 }
    ],
    "rebateThreshold": 1200000,
    "rebateAmount": 60000
  },
  "oldRegime": {
    "standardDeduction": 50000,
    "slabs": [
      { "range": "Up to ₹2,50,000", "rate": "0% Tax", "min": 0, "max": 250000, "percent": 0 },
      { "range": "₹2,50,001 to ₹5,00,000", "rate": "5% Tax", "min": 250000, "max": 500000, "percent": 5, "hasRebate": true },
      { "range": "₹5,00,001 to ₹10,00,000", "rate": "20% Tax", "min": 500000, "max": 1000000, "percent": 20 },
      { "range": "Above ₹10,00,000", "rate": "30% Tax", "min": 1000000, "max": null, "percent": 30 }
    ],
    "rebateThreshold": 500000,
    "rebateAmount": 12500
  }
}`
      },
      {
        role: 'user',
        content: 'Identify and return the active Indian tax slabs and rules for the latest Financial Year, checking for any newly introduced Union Budget announcements up to 2026/2027.'
      }
    ];

    const content = await getAICompletionFunc(messages, 1000, { type: "json_object" });
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    if (parsed.financialYear && parsed.newRegime && parsed.newRegime.slabs) {
      cachedTaxSlabs = parsed;
      lastCacheTime = now;
      console.log(`🚀 Dynamic AI Tax Engine successfully updated with ${parsed.financialYear} rules!`);
      return parsed;
    }
  } catch (error) {
    console.warn('⚠️ Dynamic tax discovery failed. Falling back to built-in FY 2025-26 rules:', error.message);
  }

  cachedTaxSlabs = defaultSlabs;
  lastCacheTime = now;
  return defaultSlabs;
};

// @desc    Tax estimator
// @route   GET /api/mentor/tax-estimate
const getTaxEstimate = async (req, res) => {
  try {
    const { income, regime, deductions } = req.query;

    // Fetch the latest dynamic compliance rules from the AI / cache
    const activeConfig = await getLatestTaxSlabs(getAICompletion);

    // Bulletproof extraction of deduction fields, checking both nested objects and flat bracket keys
    const getDeductionValue = (key) => {
      // 1. Check if parsed as nested object: deductions: { section80C: ... }
      if (deductions && typeof deductions === 'object' && deductions[key] !== undefined) {
        const val = parseFloat(deductions[key]);
        return isNaN(val) ? 0 : val;
      }
      // 2. Check if parsed as flat bracket string: req.query['deductions[section80C]']
      const bracketKey = `deductions[${key}]`;
      if (req.query[bracketKey] !== undefined) {
        const val = parseFloat(req.query[bracketKey]);
        return isNaN(val) ? 0 : val;
      }
      // 3. Check if passed as flat direct query param: req.query.section80C
      if (req.query[key] !== undefined) {
        const val = parseFloat(req.query[key]);
        return isNaN(val) ? 0 : val;
      }
      return 0;
    };

    const sec80C = getDeductionValue('section80C');
    const sec80D = getDeductionValue('section80D');
    const hraVal = getDeductionValue('hra');
    const incVal = parseFloat(income);
    const parsedIncome = isNaN(incVal) ? 0 : incVal;

    // Dynamically calculate tax using AI-derived slabs
    const configKey = regime === 'old' ? 'oldRegime' : 'newRegime';
    const result = calculateDynamicTax(parsedIncome, activeConfig[configKey], {
      section80C: sec80C,
      section80D: sec80D,
      hra: hraVal
    }, regime || 'new');

    const oldResult = calculateDynamicTax(parsedIncome, activeConfig.oldRegime, {
      section80C: sec80C,
      section80D: sec80D,
      hra: hraVal
    }, 'old');

    const newResult = calculateDynamicTax(parsedIncome, activeConfig.newRegime, {}, 'new');

    res.json({
      success: true,
      result,
      comparison: {
        oldRegime: oldResult,
        newRegime: newResult,
        betterRegime: oldResult.totalTax <= newResult.totalTax ? 'old' : 'new',
        savings: Math.abs(oldResult.totalTax - newResult.totalTax)
      },
      slabs: activeConfig.newRegime.slabs,
      oldSlabs: activeConfig.oldRegime.slabs,
      financialYear: activeConfig.financialYear
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Portfolio Risk Analysis
// @route   POST /api/mentor/portfolio-risk
const portfolioRiskAnalysis = async (req, res) => {
  try {
    const { holdings = [], walletBalance = 0, totalInvested = 0, currentValue = 0 } = req.body;

    if (!holdings.length) {
      return res.json({
        success: true,
        risk: {
          overallScore: 0,
          riskLevel: 'No Portfolio',
          riskColor: 'gray',
          concentration: [],
          insights: ['Add holdings to your portfolio to get an AI risk analysis.'],
          recommendation: 'Start trading using virtual money to build a portfolio!',
          diversificationScore: 0,
          volatilityRating: 'N/A',
          sectorExposure: [],
          aiComment: 'Your portfolio is empty. Start by purchasing some stocks in TradeArena to get a personalised risk analysis.'
        }
      });
    }

    // Compute client-side metrics server-side for accuracy
    const totalPortfolioValue = currentValue || holdings.reduce((s, h) => s + (h.currentPrice * h.quantity), 0);
    const concentration = holdings.map(h => ({
      symbol: h.symbol,
      weight: totalPortfolioValue > 0 ? parseFloat(((h.currentPrice * h.quantity) / totalPortfolioValue * 100).toFixed(1)) : 0,
      pnlPct: h.profitLossPercent || 0
    })).sort((a, b) => b.weight - a.weight);

    const top1Weight = concentration[0]?.weight || 0;
    const top3Weight = concentration.slice(0, 3).reduce((s, c) => s + c.weight, 0);
    const herfindahlIndex = concentration.reduce((s, c) => s + Math.pow(c.weight / 100, 2), 0);
    const pnlPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0;

    const prompt = `You are an institutional portfolio risk analyst AI. Analyse this Indian retail portfolio and output a JSON risk report.

Portfolio Data:
- Holdings: ${JSON.stringify(concentration)}
- Total Invested: ₹${totalInvested.toLocaleString('en-IN')}
- Current Value: ₹${totalPortfolioValue.toLocaleString('en-IN')}
- P&L: ${pnlPct}%
- Herfindahl Concentration Index: ${herfindahlIndex.toFixed(3)} (0=diverse, 1=single stock)
- Top holding weight: ${top1Weight}%
- Top 3 holdings combined: ${top3Weight}%
- Number of holdings: ${holdings.length}

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <integer 0-100, higher = higher risk>,
  "riskLevel": "<Low/Moderate/High/Very High>",
  "diversificationScore": <integer 0-100, higher = better diversified>,
  "volatilityRating": "<Low/Medium/High>",
  "concentration": [
    {"symbol": "...", "weight": <number>, "alert": "<empty or warning string>"}
  ],
  "sectorExposure": [
    {"sector": "...", "weight": <number>}
  ],
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "recommendation": "<top 1 actionable recommendation in 1-2 sentences>",
  "aiComment": "<2-3 sentence professional risk commentary from a CFA analyst perspective>"
}`;

    const messages = [
      { role: 'system', content: 'You are a CFA-certified portfolio risk analyst. Output valid JSON only. No markdown.' },
      { role: 'user', content: prompt }
    ];

    const content = await getAICompletion(messages, 800, { type: 'json_object' });
    let risk;
    try {
      risk = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('JSON parse failed');
    }

    res.json({ success: true, risk });
  } catch (error) {
    console.warn('portfolioRiskAnalysis fallback:', error.message);
    const { holdings = [], totalInvested = 0, currentValue = 0 } = req.body;
    const totalVal = currentValue || holdings.reduce((s, h) => s + (h.currentPrice * h.quantity), 0);
    const concentration = holdings.map(h => ({
      symbol: h.symbol,
      weight: totalVal > 0 ? parseFloat(((h.currentPrice * h.quantity) / totalVal * 100).toFixed(1)) : 0,
      alert: ((h.currentPrice * h.quantity) / totalVal * 100) > 40 ? 'Over-concentrated! >40% in one stock.' : ''
    })).sort((a, b) => b.weight - a.weight);

    const top1 = concentration[0]?.weight || 0;
    const overallScore = Math.min(100, Math.round(top1 * 1.2 + (holdings.length < 3 ? 30 : 0) + (holdings.length < 5 ? 10 : 0)));
    const divScore = Math.max(0, 100 - overallScore);

    res.json({
      success: true,
      fallback: true,
      risk: {
        overallScore,
        riskLevel: overallScore >= 70 ? 'Very High' : overallScore >= 50 ? 'High' : overallScore >= 30 ? 'Moderate' : 'Low',
        diversificationScore: divScore,
        volatilityRating: overallScore >= 60 ? 'High' : overallScore >= 35 ? 'Medium' : 'Low',
        concentration,
        sectorExposure: [{ sector: 'Equity', weight: 100 }],
        insights: [
          top1 > 40 ? `${concentration[0]?.symbol} dominates at ${top1}% — rebalance to reduce single-stock risk.` : 'Concentration looks acceptable.',
          holdings.length < 5 ? 'Portfolio has fewer than 5 holdings — consider diversifying across sectors.' : `Good breadth with ${holdings.length} holdings.`,
          'Review trailing stop-losses on each position to protect against sudden corrections.'
        ],
        recommendation: holdings.length < 5
          ? 'Diversify across at least 8-10 stocks in different NSE sectors (IT, Banking, FMCG, Pharma) to reduce idiosyncratic risk.'
          : top1 > 40
          ? `Trim ${concentration[0]?.symbol} position to below 25% of portfolio value and redeploy capital across other sectors.`
          : 'Portfolio looks reasonably balanced. Continue monitoring sector weights quarterly.',
        aiComment: `This portfolio has a ${overallScore >= 70 ? 'very high' : overallScore >= 50 ? 'high' : 'moderate'} risk profile driven by ${
          top1 > 40 ? `extreme concentration in ${concentration[0]?.symbol}` : `${holdings.length < 5 ? 'limited diversification' : 'acceptable allocation spread'}`
        }. A well-diversified Indian equity portfolio typically holds 10-15 stocks across at least 5 NSE sectors with no single position exceeding 15-20% of total value. Consider systematic rebalancing every quarter.`
      }
    });
  }
};


// Chat Session CRUD Controllers
const getChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('title updatedAt messages')
      .sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChatSessionById = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createChatSession = async (req, res) => {
  try {
    const { title = 'New Chat' } = req.body;
    const session = await ChatSession.create({
      user: req.user._id,
      title,
      messages: []
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, message: 'Chat session deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save lesson progress (last active lesson & station) for cross-device resume
// @route   POST /api/mentor/learn-progress
const saveLearnProgress = async (req, res) => {
  try {
    const { lessonId, stationId } = req.body;
    const update = {};
    if (lessonId !== undefined) update.lastActiveLessonId = lessonId || null;
    if (stationId !== undefined) update.lastActiveStation = stationId || 1;

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lesson progress (last active lesson & station)
// @route   GET /api/mentor/learn-progress
const getLearnProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('lastActiveLessonId lastActiveStation lessonsCompleted claimedChests');
    res.json({
      success: true,
      lastActiveLessonId: user.lastActiveLessonId || null,
      lastActiveStation: user.lastActiveStation || 1,
      lessonsCompleted: user.lessonsCompleted || [],
      claimedChests: user.claimedChests || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  askMentor, getWeeklyReport, whatIfSimulator,
  getFinancialTwin, getLessons, completeLesson, getTaxEstimate,
  portfolioRiskAnalysis,
  getChatSessions, getChatSessionById, createChatSession, deleteChatSession,
  saveLearnProgress, getLearnProgress
};