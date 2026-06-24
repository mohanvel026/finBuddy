// client/src/data/featureGuideData.js
// Structured feature guide database mapping paths, query params, and sections to detailed documentation.

export const guideCategories = [
  { id: 'all', name: 'All Modules', icon: '📁' },
  { id: 'finance', name: 'Personal Finance', icon: '💰' },
  { id: 'trading', name: 'Trading & Markets', icon: '📈' },
  { id: 'trips', name: 'Social & Trips', icon: '✈️' },
  { id: 'ai', name: 'AI Assistants', icon: '🤖' },
  { id: 'system', name: 'Developer & Admin', icon: '⚙️' }
];

export const featureGuides = {
  // --- CORE PAGES ---
  '/dashboard': {
    id: '/dashboard',
    title: 'Unified Workspace Dashboard',
    category: 'finance',
    icon: '🏠',
    tag: 'Workspace Overview',
    desc: 'The ultimate financial command center combining modern portfolio aggregation with social travel cost tracking. Features real-time alerts for asset allocation drift, over-budget trips, and anomalous expense warnings to keep your net worth stable.',
    path: '/dashboard',
    features: [
      { name: 'Aggregate Net Worth Monitor', desc: 'Consolidates linked bank accounts, stock brokerage profiles, gold feeds, and crypto wallets, converting rates dynamically to plot your historical net worth trend.' },
      { name: 'Trip Vault Planner Summary', desc: 'Displays active shared trips, budget progress thresholds, and real-time destination weather forecasts to coordinate travel plans.' },
      { name: 'Quick-Access Action Strips', desc: 'Hardware-accelerated shortcut blocks that let you jump directly to Wealth Map, Trade Arena, or AI Mentor speech labs.' },
      { name: 'Asset Drift Alert Panel', desc: 'Automatically compares actual balances against target asset allocation splits, flagging drift deviations of over 5% for rebalancing.' }
    ],
    howToUse: [
      'Log in to view your high-level financial health and consolidated net worth metrics immediately.',
      'Scan the active alerts panel to catch budget deficits or portfolio asset class drifts.',
      'Click on any dashboard widget card to navigate directly to its dedicated sub-system page.'
    ],
    benefits: [
      'Eliminates fragmentation by unifying diverse asset classes (banking, gold, stocks) alongside travel cost ledgers.',
      'Minimizes financial blind spots by surfacing warnings—like budget overruns or high volatility—before they compound.'
    ],
    checklist: [
      'Verify consolidated net worth balances on the dashboard',
      'Scan the active alerts panel for portfolio drift warnings',
      'Click a quick-access action shortcut to navigate pages'
    ],
    proTip: 'Keep your linked gold and crypto holdings updated to ensure your net worth trend line accurately reflects your current purchasing power.'
  },

  '/guide': {
    id: '/guide',
    title: 'App Mastery Hub & Guide',
    category: 'system',
    icon: '📖',
    tag: 'Mastery Hub',
    desc: 'An interactive personal finance academy sitemap and tool index to track your onboarding exercises and mastery progress.',
    path: '/guide',
    features: [
      { name: 'Interactive Progress Ring', desc: 'Displays your global onboarding completion percentage and ranks (Novice, Explorer, Strategist, Master Advisor).' },
      { name: 'Unified Database Engine', desc: 'Connected directly to the shared guide configuration, ensuring zero documentation drift.' },
      { name: 'Sitemap SVG Tree Graph', desc: 'Plots all pages and calculators with smooth, interactive bezier connectors to visualize app capabilities.' },
      { name: 'Dynamic Scroll & Flash Highlights', desc: 'Clicking any node in the SVG tree scrolls the screen to that card and flashes its border using GPU-accelerated glow effects.' }
    ],
    howToUse: [
      'Filter the directory by categories (like Personal Finance or Trading) or search for a keyword.',
      'Click "View Specifications" on any card to read its full checklists, pro tips, and capabilities.',
      'Check off completed onboarding exercises to level up your platform mastery progress bar.',
      'Click "Go to Page" to navigate to any active workspace tool instantly.'
    ],
    benefits: [
      'Centralizes platform discovery, helping you discover features you might have missed.',
      'Syncs onboarding exercises in real-time, encouraging daily financial checkups.'
    ],
    checklist: [
      'Expand a tool card to view its specifications and pro tips',
      'Toggle a checkbox to update your platform mastery percentage',
      'Reset onboarding checklist progress using the refresh controls'
    ],
    proTip: 'Use the Ctrl+K command palette and search for "guide" to return here from any page in the app instantly!'
  },

  '/wealth': {
    id: '/wealth',
    title: 'Wealth Map & Portfolio Enclave',
    category: 'finance',
    icon: '📊',
    tag: 'Portfolio Registry',
    desc: 'A comprehensive wealth vault that serves as a single source of truth for your asset portfolio. It features automatic statement ingestors for mutual funds, precious metal trackers, cryptocurrency registries, interest-bearing SGBs/FDs, an EMI payoff auditor, and a target-versus-actual asset allocation rebalancer.',
    path: '/wealth',
    features: [
      { name: 'Multi-Asset Registry Enclave', desc: 'Tracks equities, mutual funds, real estate, precious metals (Gold, Silver), cryptocurrencies, and fixed income (FD, SGB, PPF, NPS) in a unified ledger.' },
      { name: 'eCAS & CSV Statement Ingestor', desc: 'Parses CAMS PDF statement files and custom CSV templates automatically to populate your asset vaults.' },
      { name: 'Live Spot Price Tickers', desc: 'Retrieves live precious metal (Gold, Silver) prices and major crypto rates (BTC, ETH) to value your holdings in real-time.' },
      { name: 'Interactive EMI Payoff Optimizer', desc: 'Logs active loans, maps amortization curves, and contrasts interest savings using Snowball vs. Avalanche repayment strategies.' },
      { name: 'Portfolio Drift & Rebalancer', desc: 'Automatically compares actual asset divisions against Conservative, Balanced, or Aggressive targets, suggesting rebalancing actions.' }
    ],
    howToUse: [
      'Click "Import Statement" to upload a CAMS PDF or precious metals CSV statement, or click "Add Holdings to Vault" to add assets manually.',
      'Record your gold, silver, cryptocurrency, or stock balances to populate your consolidated wealth chart.',
      'Navigate to the "AI Rebalancer" tab to evaluate portfolio concentration and risk drift parameters.',
      'Open the "EMI Tracker" tab to log loans, run calculations, and evaluate accelerated payoff routes.'
    ],
    benefits: [
      'Consolidates all asset classes (from physical gold and real estate to mutual funds and crypto) under a single command center.',
      'Reduces interest drag by highlighting optimal debt liquidation strategies.'
    ],
    checklist: [
      'Log or import an asset holding to your Wealth Vault',
      'Compare actual holdings against your target allocation profile',
      'Add a mock loan to the EMI tracker and review the payoff schedule'
    ],
    proTip: 'Use the statement importer regularly to avoid manually inputting stock units and purchase prices.'
  },

  '/trade': {
    id: '/trade',
    title: 'Trade Arena Paper-Trading Hub',
    category: 'trading',
    icon: '📈',
    tag: 'Virtual Markets',
    desc: 'A high-fidelity virtual paper trading environment designed to build market execution discipline. Simulates real-time pricing feeds over WebSockets, allowing you to practice short-selling, margin leverage, and order book matching with zero capital risk.',
    path: '/trade',
    features: [
      { name: 'Live Stock Tickers', desc: 'Simulated real-time quote feeds powered by persistent WebSocket connections.' },
      { name: 'Margin & Short-Selling System', desc: 'Practice leveraging your positions or profiting from market drops risk-free.' },
      { name: 'Interactive Order Book', desc: 'Visualizes bid/ask spreads and simulates limit/stop-loss order execution.' },
      { name: 'Trading Journal Integration', desc: 'Maintains logs of past trades alongside emotional and psychological notes.' }
    ],
    howToUse: [
      'Select a stock ticker from the search bar or watchlist.',
      'Configure order type (Market, Limit, or Stop-loss) and select Buy or Sell.',
      'Monitor your active margin leverage levels and live paper portfolio P&L updates.'
    ],
    benefits: [
      'Enables risk-free exploration of short-selling and leveraged margin tools.',
      'Builds emotional discipline using the integrated trading journal.'
    ],
    checklist: [
      'Search for a stock ticker (e.g. RELIANCE, TCS)',
      'Place a mock Market or Limit paper trade order',
      'Examine active open positions and margin status'
    ],
    proTip: 'Set strict stop-loss orders in the simulator to protect your virtual balance from extreme price dumps.'
  },

  '/trade/strategy': {
    id: '/trade/strategy',
    title: 'Strategy Lab Code-Free Indicator Builder',
    category: 'trading',
    icon: '🔬',
    tag: 'Algorithmic Trading',
    desc: 'A code-free visual algorithmic builder to define systematic trading models. Enables linking lookback parameters, moving average crossovers (SMA/EMA), and RSI momentum boundaries to eliminate emotional bias from execution.',
    path: '/trade/strategy',
    features: [
      { name: 'Dynamic Parameter Sliders', desc: 'Adjust lookback periods for Simple/Exponential Moving Averages and RSI thresholds.' },
      { name: 'Visual Condition Connector', desc: 'Link rules together (e.g., Buy if SMA-20 > SMA-50 AND RSI < 30) using visual gates.' },
      { name: 'Historical Simulation Engine', desc: 'Calculates signal frequencies based on mock market cycles.' }
    ],
    howToUse: [
      'Add indicators (e.g., EMA, RSI, Bollinger Bands) to the strategy board.',
      'Adjust boundaries (e.g., RSI overbought at 70, oversold at 30) using the sliders.',
      'Click "Compile Strategy" to lock in rules before running backtests.'
    ],
    benefits: [
      'Saves hours of script coding by automating rule definitions.',
      'Teaches traders to define objective entry/exit rules instead of trading on gut feelings.'
    ],
    checklist: [
      'Select at least two trading indicators',
      'Adjust lookback periods using parameter sliders',
      'Generate visual buy/sell signal conditions'
    ],
    proTip: 'Combine a trend indicator (like EMA) with a momentum oscillator (like RSI) to filter out fake consolidation signals.'
  },

  '/trade/backtest': {
    id: '/trade/backtest',
    title: 'Backtest Arena Quantitative Simulator',
    category: 'trading',
    icon: '⏳',
    tag: 'Backtesting Engine',
    desc: 'A quantitative historical simulator that audits strategy profitability. Renders interactive candlestick charts overlaid with buy/sell signals, calculates risk metrics (Sharpe Ratio, Win Rate, Max Drawdown), and stress-tests setups against historical market crises.',
    path: '/trade/backtest',
    features: [
      { name: 'Recharts Candlestick Engine', desc: 'Plots historical OHLC bars overlaid with buy and sell indicator flags.' },
      { name: 'Quantitative Performance Audit', desc: 'Calculates Win Rate, Total Returns, Sharpe Ratio, and Maximum Drawdown.' },
      { name: 'Crisis Time-Machine Presets', desc: 'Simulate how your strategy performs during historical market shocks (e.g., 2008 Crash).' }
    ],
    howToUse: [
      'Select a strategy compiled in Strategy Lab or choose a preset rule.',
      'Select historical timeframes or pick a market crisis scenario.',
      'Click "Run Backtest Simulation" and inspect buy/sell signals on the charts.'
    ],
    benefits: [
      'Proves whether a strategy is statistically profitable before trading real money.',
      'Exposes performance vulnerabilities during periods of high volatility.'
    ],
    checklist: [
      'Select a strategy rule preset',
      'Trigger the "Run Backtest" action',
      'Analyze the resulting Sharpe Ratio and Win Rate metrics'
    ],
    proTip: 'A Sharpe Ratio above 1.5 is good, but watch out for high Drawdowns (>20%), which indicate excessive account risk.'
  },

  '/trade/options': {
    id: '/trade/options',
    title: 'Options Chain Greeks Analytics',
    category: 'trading',
    icon: '📊',
    tag: 'Derivative Options',
    desc: 'An options chain Greeks analyzer to manage derivative risk. Displays strike pricing grids with calls/puts alongside calculated Greeks (Delta, Gamma, Theta decay, Vega volatility) and Implied Volatility (IV) smile skew curves.',
    path: '/trade/options',
    features: [
      { name: 'Options Bid/Ask Chain', desc: 'Interactive grid displaying strike prices alongside calls and puts.' },
      { name: 'Greeks Engine', desc: 'Computes contract Delta, Gamma, Theta (time decay), and Vega instantly.' },
      { name: 'IV Smile Curve Chart', desc: 'Plots volatility skew patterns across strikes to help identify cheap premiums.' }
    ],
    howToUse: [
      'Select a ticker and contract expiration date.',
      'Hover over a Call or Put row to inspect Greeks values.',
      'Click a strike price to model spread strategies and check maximum risk.'
    ],
    benefits: [
      'Demystifies option pricing by breaking down time decay (Theta) and volatility (Vega).',
      'Helps hedge stock portfolios using protective puts.'
    ],
    checklist: [
      'Query a stock ticker and select contract expiration date',
      'Click on a strike price row to examine its Greeks variables',
      'Inspect the Implied Volatility (IV) smile curve'
    ],
    proTip: 'Theta decay accelerates during the last 30 days before expiration. Avoid buying options close to expiration unless you expect rapid, massive price moves.'
  },

  '/split': {
    id: '/split',
    title: 'SplitSmart Social Circles & Splits',
    category: 'trips',
    icon: '💸',
    tag: 'Shared Expenses',
    desc: 'A social expense splitter that coordinates shared bills and budgets within your travel, household, or project circles. Employs debt simplification algorithms to reduce total cash transfers between group members.',
    path: '/split',
    features: [
      { name: 'Linked Group Directories', desc: 'Manages separate hubs for travel, household shares, or projects.' },
      { name: 'Debt Settlement Optimization', desc: 'Algorithmic settling that reduces total cash transfers between members.' },
      { name: 'Quick Split Panel', desc: 'Instantly splits a bill with custom weighting or percentages.' }
    ],
    howToUse: [
      'Click "New Group" to create an expense hub and add member names.',
      'Select a group to log bills, specify payers, and configure splits.',
      'Click "Settle Debts" to view the optimized list of payment steps.'
    ],
    benefits: [
      'Eliminates complex manual math when dividing travel bills.',
      'Reduces social tension by clearly listing debt settlements.'
    ],
    checklist: [
      'Create a new travel or expense circle group',
      'Add mock members to the group registry',
      'Review outstanding balances across all groups'
    ],
    proTip: 'Use unequal splits (by percentage or shares) for bills where some group members spent significantly more or less than others.'
  },

  '/split/group/:id': {
    id: '/split/group/:id',
    title: 'SplitSmart Group Details & Ledger',
    category: 'trips',
    icon: '👥',
    tag: 'Group Ledger',
    desc: 'A detailed group expense ledger tracking individual contributions. Supports custom weightings, unequal percentage splits, categorized transaction histories, and step-by-step settlement instructions.',
    path: '/split/group/1', // representative path
    features: [
      { name: 'Dynamic Expense Form', desc: 'Allows logging bills with unequal splits (by percentage, shares, or exact amount).' },
      { name: 'Settle-Up Assistant', desc: 'Provides step-by-step transaction pathways to clear all group debts.' },
      { name: 'Categorized Ledger Feed', desc: 'Chronological list of expenses with Category filters and delete options.' }
    ],
    howToUse: [
      'Click "Add Expense", fill in the amount, select the payer, and allocate splits.',
      'Filter transaction logs by category (Food, Travel, Stays) to review allocations.',
      'Click "Show Debt Settlements" to check who owes whom.'
    ],
    benefits: [
      'Handles complex multi-payer calculations effortlessly.',
      'Keeps a clear log of transactions so everyone stays on the same page.'
    ],
    checklist: [
      'Log an expense with a multi-person unequal split',
      'Check the real-time activity ledger for edits',
      'Open the optimized "Settle Debts" panel to check transfers'
    ],
    proTip: 'Click on any member name to quickly check their balance or log a payment directly to them.'
  },

  '/split/trip/:groupId': {
    id: '/split/trip/:groupId',
    title: 'TripVault Multi-Currency Budgeting',
    category: 'trips',
    icon: '✈️',
    tag: 'Travel Budgeting',
    desc: 'A travel budget manager with live exchange rates. Monitors your foreign expenditures in real-time, displays local-to-home currency conversions, and warns you as you approach category budget limits.',
    path: '/split/trip/1',
    features: [
      { name: 'Live Exchange Calculator', desc: 'Converts foreign expenditures to home currency using live pricing feeds.' },
      { name: 'Visual Budget Progress Bar', desc: 'Color-coded bar that changes color (green, yellow, red) based on budget exhaustion.' },
      { name: 'Allocation Breakdown', desc: 'Tracks costs by Category (Lodging, Transport, Food, Sightseeing).' }
    ],
    howToUse: [
      'Create a trip, set the start/end dates, and configure the budget.',
      'Log travel expenses in the local currency of the destination.',
      'Monitor the progress bar and category breakdown chart to manage spending.'
    ],
    benefits: [
      'Saves time by automatically calculating currency exchanges.',
      'Helps prevent budget overruns during international travel.'
    ],
    checklist: [
      'Configure a new trip budget limit and select foreign currency',
      'Add foreign expenses and observe real-time exchange conversion',
      'Check category allocations chart and limit bar warnings'
    ],
    proTip: 'Update your trip home currency in settings to ensure accurate exchange conversions.'
  },

  '/split/photos/:groupId': {
    id: '/split/photos/:groupId',
    title: 'TripPhotoVault Member AI Album',
    category: 'trips',
    icon: '🖼️',
    tag: 'AI Photo Vault',
    desc: 'A collaborative photo album that integrates with Google Drive. Features AI photo quality checking to filter out duplicates or blurry images, retro postcard canvas creators, and AI-generated trivia games based on your trip photos.',
    path: '/split/photos/1',
    features: [
      { name: 'Google Drive Sync Integration', desc: 'Links organizer accounts to provision cloud folders and share write access with members.' },
      { name: 'AI Image Curation', desc: 'Analyzes photo quality, filters out blurry duplicates, and tags key highlights.' },
      { name: 'Canvas Postcard Generator', desc: 'Assemble photos into custom collage postcards with retro filters and titles.' },
      { name: 'AI Travel Memory Trivia', desc: 'Generates interactive quiz games based on uploaded locations and captions.' }
    ],
    howToUse: [
      'Drag and drop travel photos into the upload area.',
      'Click "Connect Google Drive" to sync files to secure cloud folders.',
      'Generate postcards or play the AI-generated trivia game to earn FinScore XP.'
    ],
    benefits: [
      'Maintains original photo resolution, avoiding standard WhatsApp compression.',
      'Saves photos to your own cloud storage while keeping them accessible to the group.'
    ],
    checklist: [
      'Upload travel photos or test with mock uploads',
      'Generate custom Retro Postcard Canvas and export it',
      'Launch AI Memory Trivia quiz and test your trip knowledge'
    ],
    proTip: 'Add descriptive captions to your photos so the AI can generate accurate, personalized memory trivia questions.'
  },

  '/battle': {
    id: '/battle',
    title: 'FinBattle Mock Trading Tournament',
    category: 'trading',
    icon: '⚔️',
    tag: 'Gamified Competition',
    desc: 'A gamified multiplayer mock trading tournament. Compete in timed matches against other users, chat in lobby groups, place virtual trades on real tickers, and climb the real-time leaderboard.',
    path: '/battle',
    features: [
      { name: 'Timed Battle Lobby', desc: 'Join ongoing or upcoming matches with fixed initial cash balances.' },
      { name: 'Real-Time Rank Leaderboards', desc: 'Ranks players based on total returns, updated dynamically.' },
      { name: 'Lobby Chat', desc: 'Interact, share trade updates, and debate strategy with competitors in the lobby.' }
    ],
    howToUse: [
      'Browse active matches in the battle lobby and click "Join Battle".',
      'Place mock trades using your starting cash balance during the active match.',
      'Monitor the leaderboard and interact with other players in the group chat.'
    ],
    benefits: [
      'Gamifies learning, making financial education engaging.',
      'Builds confidence by testing trading strategies against other users.'
    ],
    checklist: [
      'Join an active mock trading match lobby',
      'Execute a trade using match virtual cash',
      'Post a comment in the tournament lobby chat'
    ],
    proTip: 'Short-term battles are highly volatile. Use momentum indicator strategies (like RSI) to capture quick stock price swings and climb the leaderboard.'
  },

  '/learn': {
    id: '/learn',
    title: 'FinAcademy Learning Hub',
    category: 'ai',
    icon: '🎓',
    tag: 'Gamified Academy',
    desc: 'A gamified personal finance academy. Features bite-sized lessons, multilingual learning (English, Tamil, Tanglish) and interactive quizzes that reward you with Willpower coins to style your profile.',
    path: '/learn',
    features: [
      { name: 'Multilingual Lessons', desc: 'Learn financial concepts in English, Tamil, or Tanglish.' },
      { name: 'Interactive Quizzes', desc: 'Test your knowledge on courses and earn XP and Willpower coins.' },
      { name: 'Gamified Reward System', desc: 'Earn virtual badges and level up your FinScore by completing modules.' }
    ],
    howToUse: [
      'Select a learning module (e.g., Stock Markets, Compound Interest).',
      'Choose your preferred language toggle (English, Tamil, Tanglish).',
      'Read the lesson cards and complete the quiz to earn coins and badges.'
    ],
    benefits: [
      'Simplifies complex topics with everyday analogies (e.g., sweet shop shares).',
      'Keeps you motivated to learn through XP and coin rewards.'
    ],
    checklist: [
      'Select a financial lesson card (e.g., Compound Interest)',
      'Toggle language options (English, Tamil, Tanglish)',
      'Complete the lesson quiz and collect Willpower coins'
    ],
    proTip: 'Spend earned Willpower Coins in the Profile Shop to unlock premium avatar custom styling!'
  },

  '/mentor': {
    id: '/mentor',
    title: 'AI Mentor Speech-Enabled FinGuru',
    category: 'ai',
    icon: '🤖',
    tag: 'AI Assistant',
    desc: 'A voice-enabled financial AI assistant. Dictate questions or select preset query chips to get character-by-character streaming explanations, and listen to synthesized advice using Web Speech.',
    path: '/mentor',
    features: [
      { name: 'Voice Input & Output', desc: 'Dictate questions and listen to replies using Web Speech API.' },
      { name: 'Streaming AI Output', desc: 'Displays model responses character-by-character for real-time reading.' },
      { name: 'Onboarding Query Presets', desc: 'Quickly select common topics (SIP, tax optimization, debt plans) to start chats.' }
    ],
    howToUse: [
      'Click the microphone button to dictate your question, or type it in the box.',
      'Select any preset question chip to start the conversation.',
      'Read the response or toggle voice playback on/off using the speaker button.'
    ],
    benefits: [
      'Provides hands-free assistance for quick financial questions.',
      'Explains complicated terms with simple, easy-to-understand examples.'
    ],
    checklist: [
      'Type or dictate a personal finance query in the box',
      'Click an onboarding preset query chip',
      'Listen to the voice synthesis output response'
    ],
    proTip: 'Ask the AI to explain a topic "like I am 10 years old" for a very simple explanation with helpful analogies.'
  },

  '/mf': {
    id: '/mf',
    title: 'Mutual Fund Analyzer & Cost Drag Simulator',
    category: 'finance',
    icon: '🧬',
    tag: 'Fund Analytics',
    desc: 'A mutual fund auditor and cost drag calculator. Scans fund portfolios to detect stock overlap concentration risk and simulates how minor expense ratio differences eat away at your long-term compounding returns.',
    path: '/mf',
    features: [
      { name: 'Mutual Fund Overlap Detector', desc: 'Compares portfolios of different funds to flag redundant stock holdings.' },
      { name: 'Expense Ratio Drag Simulator', desc: 'Models the impact of annual fees on your investments over 10-30 years.' },
      { name: 'Asset Allocation Auditor', desc: 'Highlights concentration risks by checking category allocation.' }
    ],
    howToUse: [
      'Select two or more mutual funds in the search bar.',
      'Check the overlap percentage score and review the duplicate stock holdings list.',
      'Adjust the fee slider to see how expense ratios impact long-term portfolio value.'
    ],
    benefits: [
      'Prevents accidental portfolio concentration in the same stocks across multiple funds.',
      'Shows how even minor differences in fees can significantly reduce savings over time.'
    ],
    checklist: [
      'Select two mutual funds to run overlap comparison',
      'Examine common stock list and portfolio overlap score',
      'Adjust expense ratio drag sliders to calculate savings loss'
    ],
    proTip: 'An overlap score above 50% means you are holding redundant funds. Consolidate into a single low-cost index fund to save on fees.'
  },

  '/smart': {
    id: '/smart',
    title: 'Smart Lab Financial Engineering Hub',
    category: 'finance',
    icon: '🧠',
    tag: 'Advanced Tools',
    desc: 'A central dashboard for 16+ advanced financial engines and scanners organized under three security and habits pillars.',
    path: '/smart',
    features: [
      { name: 'Three Planning Pillars', desc: 'Tools categorized under Security Shield, Future Planning, and Behavioral Habits.' },
      { name: 'Portfolio Health Badge Monitor', desc: 'Displays real-time notifications about portfolio drift, debt traps, or anomalies.' },
      { name: 'Tool Search & Filter Grid', desc: 'Quickly find tools by search queries or category tags.' }
    ],
    howToUse: [
      'Browse the available tools categorized under Shield, Planning, and Habits.',
      'Click any tool card to launch its calculator or simulation interface.',
      'Review your high-level portfolio health warnings at the top of the hub.'
    ],
    benefits: [
      'Centralizes 16+ specialized engines, from retirement planning to route mapping.',
      'Flags structural financial risks before they impact your savings.'
    ],
    checklist: [
      'Scan portfolio health alert badges at the top',
      'Search or filter the tool grid by category',
      'Select a card to launch a financial engine'
    ],
    proTip: 'Run the Spending DNA quiz first to understand how your personality type affects your financial choices.'
  },

  '/profile': {
    id: '/profile',
    title: 'Profile Settings & Willpower Enclave',
    category: 'system',
    icon: '👤',
    tag: 'Account Center',
    desc: 'An account enclave and Willpower coin center. Tracks daily login streaks, integrates brokerage API keys, and hosts the shop where you redeem coins for styles and badges.',
    path: '/profile',
    features: [
      { name: 'Daily Login Streak Tracker', desc: 'Tracks consecutive logins and awards bonuses to help build positive habits.' },
      { name: 'Willpower Coin Shop', desc: 'Redeem coins earned in Academy quizzes for profile customization options.' },
      { name: 'Brokerage API Integrations', desc: 'Connect your real accounts safely using API keys.' }
    ],
    howToUse: [
      'Review your account info, active login streaks, and current coin balance.',
      'Click "Link Accounts" to add Google logins or custom API access tokens.',
      'Browse the Willpower Shop to redeem badges or unlock premium themes.'
    ],
    benefits: [
      'Encourages positive habits using streaks and coin rewards.',
      'Keeps your connected account keys secure and accessible in one place.'
    ],
    checklist: [
      'Check active daily login streak count',
      'View Willpower coins balance details',
      'Verify connected social profiles and security settings'
    ],
    proTip: 'Log in daily to keep your streak going! Streak multipliers increase the Willpower coins you earn from completing quizzes.'
  },


  // --- SMART ENGINES SUB-SECTIONS ---
  'smart-fraud': {
    id: 'smart-fraud',
    title: 'UPI Fraud Shield Scanner',
    category: 'finance',
    icon: '🛡️',
    tag: 'AI Security Shield',
    desc: 'An AI-powered communications scanner. Evaluates UPI handles, suspicious SMS links, and phishing text messages against databases of known fraudulent vectors to calculate risk scores.',
    path: '/smart?category=shield&tool=fraud',
    features: [
      { name: 'SMS scam scanner', desc: 'Analyzes text messages for common scams (fake lottery winnings, fake bank alerts).' },
      { name: 'UPI VPA Scanner', desc: 'Verifies UPI addresses against lists of flagged spam accounts.' },
      { name: 'Phishing URL Checker', desc: 'Scans links for redirects to fraudulent websites.' }
    ],
    howToUse: [
      'Paste suspicious text messages or links into the input box.',
      'Click "Run Fraud Scan" to analyze the text.',
      'Review the risk score (Low, Medium, High) and the checklist of flagged items.'
    ],
    benefits: [
      'Protects you from losing money to common payment scams.',
      'Helps you spot phishing techniques, such as typos in domains.'
    ],
    checklist: [
      'Paste a sample payment message in the scanner',
      'Execute "Run Fraud Scan"',
      'Inspect the risk assessment score and recommendations'
    ],
    proTip: 'Never click on a link in an SMS claiming you won a lottery or owe unpaid taxes. Banks will never ask you to click a link to claim cash.'
  },

  'smart-anomaly': {
    id: 'smart-anomaly',
    title: 'AI Spend Anomaly Engine',
    category: 'finance',
    icon: '🚨',
    tag: 'AI Security Shield',
    desc: 'A statistical spending spike detector. Flags expenses exceeding category standard deviation limits (Z-score limits) and lets you exclude one-off capital asset purchases to keep baseline averages clean.',
    path: '/smart?category=shield&tool=anomaly',
    features: [
      { name: 'Outlier Alerts', desc: 'Identifies expenditures that deviate significantly from your regular spending habits.' },
      { name: 'Exclude One-Off Bills option', desc: 'Allows excluding large, planned purchases (like flights) to keep baseline calculations accurate.' },
      { name: 'Sensitivity Slider', desc: 'Adjust the Z-score limit to catch minor deviations or only major spikes.' }
    ],
    howToUse: [
      'Input or review your weekly transaction history.',
      'Adjust the slider to change anomaly detection sensitivity.',
      'Review flagged transactions and exclude planned, one-off purchases.'
    ],
    benefits: [
      'Catches billing errors or unauthorized cards quickly.',
      'Prevents your budget baseline from being skewed by planned expenses.'
    ],
    checklist: [
      'Review logged transactions flagged as outliers',
      'Adjust the sensitivity slider (Z-score limit)',
      'Exclude one-off purchases to update the baseline'
    ],
    proTip: 'A Z-score of 2.0 flags the top 5% of unusual expenses, while a Z-score of 3.0 only alerts you to extreme outliers (top 1%).'
  },

  'smart-news': {
    id: 'smart-news',
    title: 'News Noise Filter & Scrubber',
    category: 'finance',
    icon: '📰',
    tag: 'AI Security Shield',
    desc: 'An AI headlines cleaner that strips sensational clickbait. Scrubs fear-inducing adjectives from news feeds to isolate core economic facts and prevent panic selling.',
    path: '/smart?category=shield&tool=news',
    features: [
      { name: 'Headline Scrubber', desc: 'Removes emotional cues and fear-inducing adjectives from articles.' },
      { name: 'Sentiment Neutralizer', desc: 'Re-writes news alerts in clear, factual, objective terminology.' },
      { name: 'Market Correlation Check', desc: 'Matches news events with actual historical impacts on indexes.' }
    ],
    howToUse: [
      'Enter a news link or paste the text of a sensational headline.',
      'Click "Scrub News" to generate a neutral summary.',
      'Review the core facts list and historical context report.'
    ],
    benefits: [
      'Reduces emotional trading and panic selling caused by sensational headlines.',
      'Saves time by summarizing long, speculative articles into actionable facts.'
    ],
    checklist: [
      'Paste a sensational headline in the text input box',
      'Run the noise scrubber to clean emotional modifiers',
      'Review the extracted core facts vs original text'
    ],
    proTip: 'If a headline uses words like "CRASH", "COLLAPSE", or "EXPLODE", run it through the filter to check the actual percentage change before reacting.'
  },

  'smart-bill': {
    id: 'smart-bill',
    title: 'AI Bill Negotiator & Saver',
    category: 'finance',
    icon: '🧾',
    tag: 'AI Security Shield',
    desc: 'An AI contract negotiator toolkit. Generates custom phone scripts, email templates, and competitor pricing databases to help you negotiate cheaper telecom and software subscription rates.',
    path: '/smart?category=shield&tool=bill',
    features: [
      { name: 'Script Generator', desc: 'Creates tailored negotiation templates for major telecom and software utilities.' },
      { name: 'Competitor Database', desc: 'Tracks active cheaper plans from rival service providers.' },
      { name: 'Email Writer', desc: 'Drafts formal retention letters asking for discounts.' }
    ],
    howToUse: [
      'Select the utility category and select your current provider.',
      'Input details about your monthly billing plan.',
      'Click "Generate Negotiation Toolkit" to copy scripts and rival rates.'
    ],
    benefits: [
      'Reduces monthly bills by leveraging active market competition.',
      'Provides scripts for phone negotiations.'
    ],
    checklist: [
      'Select a subscription service category (e.g. Broadband)',
      'Input your current monthly pricing tier',
      'Generate and copy the customized negotiation script'
    ],
    proTip: 'Mentioning that a competitor is offering a similar plan for 20% less is the most reliable way to get transferred to a retention agent who has authority to issue discounts.'
  },

  'smart-macro': {
    id: 'smart-macro',
    title: 'Macro Shock Lab Stress Tester',
    category: 'finance',
    icon: '🌐',
    tag: 'AI Security Shield',
    desc: 'A macroeconomic portfolio stress tester. Simulates asset return sensitivities under different RBI repo rates, Fed hikes, crude price shocks, or stagflation regimes.',
    path: '/smart?category=shield&tool=macro',
    features: [
      { name: 'Interest Rate Scenarios', desc: 'Simulates impacts of RBI repo rate hikes or US Fed updates.' },
      { name: 'Commodity Shock Simulator', desc: 'Models gold, oil, and dollar index adjustments.' },
      { name: 'Historical Presets', desc: 'Compare setups to historical events like the 1970s stagflation or the 2008 crash.' }
    ],
    howToUse: [
      'Adjust macro sliders (Inflation, Interest Rates, Crude Prices).',
      'Click "Run Stress Test" to see asset class sensitivity bars.',
      'Review the recommended portfolio shifts to shield against high risks.'
    ],
    benefits: [
      'Helps protect asset allocations from global monetary tightening cycles.',
      'Teaches how macro variables impact equities, debt, and precious metals.'
    ],
    checklist: [
      'Select a macro shock preset (e.g. Crude Price Spike)',
      'Adjust interest rate or inflation sliders',
      'Review asset class returns sensitivity forecast charts'
    ],
    proTip: 'During high inflation and interest rate hike cycles, allocate larger weights to short-duration debt and Gold to stabilize returns.'
  },

  'smart-goals': {
    id: 'smart-goals',
    title: 'Probabilistic Goal Planner',
    category: 'finance',
    icon: '🎯',
    tag: 'Stochastic Planning',
    desc: 'A probabilistic Goal Planner utilizing Monte Carlo simulations. Runs 1,000 randomized trials to forecast the likelihood of reaching a target savings corpus, offering savings adjustments if odds fall below 85%.',
    path: '/smart?category=planning&tool=goals',
    features: [
      { name: 'Monte Carlo Trials Simulator', desc: 'Runs 1,000 simulations factoring in historical asset volatility.' },
      { name: 'Market Scenario Selectors', desc: 'Stress-tests plans under normal, bull, recession, or high inflation conditions.' },
      { name: 'Recommended Adjustments', desc: 'Calculates the savings adjustments needed if your success probability falls below 85%.' }
    ],
    howToUse: [
      'Input target amount, timeline, and current monthly savings rate.',
      'Select asset allocation splits (equity vs debt vs cash).',
      'Click "Run Monte Carlo Simulation" and check the probability percentage.'
    ],
    benefits: [
      'Replaces simple compound interest calculators with realistic, risk-adjusted forecasts.',
      'Guides adjustments to savings rates based on statistical likelihoods.'
    ],
    checklist: [
      'Input target amount and savings timeline',
      'Run Monte Carlo trials to calculate success probability',
      'Review suggested adjustments if probability is below 85%'
    ],
    proTip: 'If your success probability is under 80%, increase your equity allocation for longer timelines, or increase your monthly savings rate.'
  },

  'smart-fire': {
    id: 'smart-fire',
    title: 'FIRE Autopilot Simulator',
    category: 'finance',
    icon: '🔥',
    tag: 'Future Planning',
    desc: 'A stochastic early retirement simulator. Projects nest egg longevity over 30-50 years, evaluating fixed withdrawal rules (Bengen\'s 4%) against dynamic performance guardrails (Guyton-Klinger) to combat sequence-of-returns risk.',
    path: '/smart?category=planning&tool=fire',
    features: [
      { name: 'Guyton-Klinger Rules Engine', desc: 'Simulates dynamic withdrawals that adjust based on market performance.' },
      { name: 'Retirement Runway Projection', desc: 'Plots portfolio values over 30-50 years across different trial outcomes.' },
      { name: 'Sequence of Returns Risk Monitor', desc: 'Highlights risks of market crashes happening early in retirement.' }
    ],
    howToUse: [
      'Input current age, target retirement age, nest egg size, and yearly expenses.',
      'Select a withdrawal policy (Bengen\'s 4% Rule vs Guyton-Klinger Guardrails).',
      'Click "Simulate Retirement Runway" to check if your nest egg is likely to survive.'
    ],
    benefits: [
      'Protects your retirement nest egg from being depleted during market downturns.',
      'Provides a realistic assessment of when you can safely retire early.'
    ],
    checklist: [
      'Input target retirement age and annual expenses',
      'Select a withdrawal policy (e.g. Guyton-Klinger Guardrails)',
      'Run simulation to check nest egg survival probability'
    ],
    proTip: 'Bengen\'s 4% rule assumes a fixed inflation-adjusted withdrawal, but Guyton-Klinger rules adjust withdrawals downward in market crashes, significantly improving nest egg longevity.'
  },

  'smart-swp': {
    id: 'smart-swp',
    title: 'SWP & Tax Harvest Simulator',
    category: 'finance',
    icon: '📈',
    tag: 'Future Planning',
    desc: 'A systematic withdrawal plan optimizer. Models time-series decay and calculates tax savings by leveraging annual LTCG tax-free gains (up to ₹1.25L) alongside basic tax slab exemptions.',
    path: '/smart?category=planning&tool=swp',
    features: [
      { name: 'SWP Withdrawal Engine', desc: 'Simulates periodic withdrawals over multiple decades.' },
      { name: 'Tax Harvesting Simulator', desc: 'Calculates yearly tax savings using equity LTCG allowances (up to ₹1.25L free).' },
      { name: 'Inflation Adjuster', desc: 'Increases payouts annually to maintain purchasing power.' }
    ],
    howToUse: [
      'Enter starting capital, initial withdrawal rate, and step-up inflation rate.',
      'Select tax harvesting mode to automate annual mutual fund sales and buybacks.',
      'Review the projected wealth chart and tax savings reports.'
    ],
    benefits: [
      'Minimizes drag on your portfolio during withdrawals.',
      'Helps protect capital from sequence of returns risk.'
    ],
    checklist: [
      'Input starting retirement corpus and withdrawal rate',
      'Enable tax harvesting option toggle',
      'Inspect annual tax liability curves'
    ],
    proTip: 'Harvesting ₹1.25 Lakh of long-term capital gains tax-free annually resets your cost basis, saving significant capital gains tax over time.'
  },

  'smart-debt': {
    id: 'smart-debt',
    title: 'Debt Payoff Optimizer',
    category: 'finance',
    icon: '💸',
    tag: 'Future Planning',
    desc: 'A debt payoff optimization engine. Compares the mathematical interest savings of the Debt Avalanche method against the psychological momentum of the Debt Snowball method.',
    path: '/smart?category=planning&tool=debt',
    features: [
      { name: 'Avalanche Calculator', desc: 'Prioritizes high-interest debt first to minimize total interest paid.' },
      { name: 'Snowball Calculator', desc: 'Prioritizes smallest balance first to build emotional momentum.' },
      { name: 'AI Consolidation Auditor', desc: 'Evaluates if a single low-interest loan can replace multiple debts.' }
    ],
    howToUse: [
      'Input your debts, interest rates, and minimum payments.',
      'Adjust the "Extra Monthly Payment" slider to see savings.',
      'Compare strategy schedules to see interest cost and time savings.'
    ],
    benefits: [
      'Provides a step-by-step payoff plan.',
      'Shows how even small extra payments can reduce debt tenure.'
    ],
    checklist: [
      'Add at least two debts with balances and interest rates',
      'Compare interest savings under Snowball vs Avalanche methods',
      'Adjust extra monthly payment slider to check date acceleration'
    ],
    proTip: 'While the Avalanche method mathematically saves the most money, the Snowball method has a higher success rate for most users due to the psychological win of clearing small debts quickly.'
  },

  'smart-emi': {
    id: 'smart-emi',
    title: 'EMI Trap Auditor & APR Checker',
    category: 'finance',
    icon: '💸',
    tag: 'Future Planning',
    desc: 'A true APR auditor and loan checker. Factoring in processing fees and upfront charges to expose hidden interest rates in "0% interest no-cost EMIs" and calculate prepayment savings.',
    path: '/smart?category=planning&tool=emi',
    features: [
      { name: 'True APR Calculator', desc: 'Factors in processing fees, documentation charges, and advance EMIs.' },
      { name: 'No-Cost EMI Unveiler', desc: 'Exposes how zero-interest schemes use upfront discounts to hide interest charges.' },
      { name: 'Prepayment Profit Calculator', desc: 'Models how much interest you save by making extra yearly principal payments.' }
    ],
    howToUse: [
      'Enter the advertised loan amount, interest rate, tenure, and upfront processing fees.',
      'Compare standard loans against zero-interest schemes side-by-side.',
      'Review the amortization chart and the calculated True APR.'
    ],
    benefits: [
      'Prevents you from falling for deceptive low-interest marketing.',
      'Shows the impact of fees on total borrowing costs.'
    ],
    checklist: [
      'Input loan amount and advertised interest rate',
      'Add processing fees and hidden charges',
      'Examine calculated True APR vs advertised rate'
    ],
    proTip: 'Always check the True APR. A "0% interest loan" with a 5% processing fee and advance EMIs often has a real APR exceeding 10%.'
  },

  'smart-dna': {
    id: 'smart-dna',
    title: 'Behavioral Spending DNA Quiz',
    category: 'finance',
    icon: '🧬',
    tag: 'Behavioral Habits',
    desc: 'A behavioral finance diagnostic quiz. Maps your answers to spending archetypes (Saver, Spender, Investor, Avoider) to diagnose emotional triggers and configure customized habit guardrails.',
    path: '/smart?category=habits&tool=dna',
    features: [
      { name: 'Behavioral Assessment', desc: '10 scenario-based questions assessing risk and spending triggers.' },
      { name: 'Personality Profile Card', desc: 'Displays your spending archetype with strengths and pitfalls.' },
      { name: 'AI Habit Guardrails', desc: 'Personalized recommendations to counter negative habits.' }
    ],
    howToUse: [
      'Answer the behavioral spending scenario questions.',
      'Submit the quiz to generate your Spending DNA profile card.',
      'Review the personalized tips to help keep your budget on track.'
    ],
    benefits: [
      'Helps you identify and address emotional spending triggers.',
      'Provides practical tips tailored to your spending habits.'
    ],
    checklist: [
      'Complete all questions of the Spending DNA questionnaire',
      'Submit answers to generate your behavioral profile card',
      'Review habit guardrails to address key triggers'
    ],
    proTip: 'Spenders should set automated transfer rules on payday to save money before they have a chance to spend it.'
  },

  'smart-autopsy': {
    id: 'smart-autopsy',
    title: 'AI Financial Autopsy',
    category: 'finance',
    icon: '🧠',
    tag: 'Behavioral Habits',
    desc: 'An opportunity cost calculator for financial mistakes. Computes the cost of holding excessive idle cash against indexes like the Nifty 50, highlighting loss aversion and anchoring biases.',
    path: '/smart?category=habits&tool=autopsy',
    features: [
      { name: 'Opportunity Cost Calculator', desc: 'Calculates the difference in returns between past decisions and benchmarks.' },
      { name: 'Cognitive Bias Detector', desc: 'Diagnoses bias triggers (Loss Aversion, FOMO, Anchoring).' },
      { name: 'AI Forensic Report Generator', desc: 'Provides summaries explaining mistakes and how to avoid them.' }
    ],
    howToUse: [
      'Input the date and details of a past investment decision.',
      'Select a comparison benchmark (e.g. S&P 500, Gold, Cash).',
      'Click "Run Autopsy" to review the opportunity cost and AI report.'
    ],
    benefits: [
      'Quantifies the cost of holding cash or selling winners too early.',
      'Helps you recognize and counter cognitive biases.'
    ],
    checklist: [
      'Input a past financial decision (e.g. delayed investing)',
      'Compare returns against S&P 500 or Gold benchmarks',
      'Read the AI Forensic Report on cognitive biases'
    ],
    proTip: 'Loss aversion often leads investors to sell winning stocks early to lock in profits while holding onto losing stocks in hopes of breaking even. Focus on business fundamentals, not purchase price.'
  },

  'smart-impulse': {
    id: 'smart-impulse',
    title: 'Impulse Therapy Chatbot',
    category: 'ai',
    icon: '🧠',
    tag: 'Behavioral Habits',
    desc: 'A cognitive-behavioral therapy (CBT) shopping chatbot. Prompts you with questions to evaluate the utility of purchases, cooling off items in a 24-hour ledger, and awarding coins for deleted items.',
    path: '/smart?category=habits&tool=impulse',
    features: [
      { name: 'CBT Therapist Chatbot', desc: 'Prompts you with questions to evaluate the utility of purchases.' },
      { name: '24-Hour Cool-Down Timer', desc: 'Saves items to a cool-down list to help curb impulsive decisions.' },
      { name: 'Willpower Reward System', desc: 'Earn Willpower coins for deleting items from your purchase list.' }
    ],
    howToUse: [
      'Enter an item you are tempted to buy on impulse.',
      'Chat with the therapist to evaluate the purchase.',
      'Save the item to the Cool-Down list, or delete it to earn coins.'
    ],
    benefits: [
      'Helps curb impulse buying by prompting a 24-hour cooling-off period.',
      'Earn Willpower coins for making disciplined financial choices.'
    ],
    checklist: [
      'Add a pending purchase item to the impulse list',
      'Complete the chat session to evaluate the purchase',
      'Add the item to the 24-Hour Cool-Down ledger'
    ],
    proTip: 'Wait 24 hours before buying non-essential items. If you still want the item after 24 hours, go ahead; most of the time, the urge will have passed.'
  },

  'smart-radar': {
    id: 'smart-radar',
    title: 'Cost of Living Radar',
    category: 'finance',
    icon: '📡',
    tag: 'Behavioral Habits',
    desc: 'A cost of living comparator. Compares rent, grocery indices, and air quality (AQI) side-by-side between two cities to calculate the target salary increase needed to maintain your lifestyle.',
    path: '/smart?category=habits&tool=radar',
    features: [
      { name: 'Living Indices Database', desc: 'Tracks costs across rent, groceries, utilities, and transport.' },
      { name: 'AQI & Health Factor Check', desc: 'Factors in air quality and environment metrics.' },
      { name: 'Relocation Net Income Adjuster', desc: 'Calculates the salary increase needed to maintain your lifestyle.' }
    ],
    howToUse: [
      'Select two cities (e.g. Bangalore vs Delhi) from the list.',
      'Input your current household salary.',
      'Review the comparison metrics and calculated salary adjustments.'
    ],
    benefits: [
      'Helps you negotiate salary adjustments for relocations.',
      'Compares environmental factors alongside financial costs.'
    ],
    checklist: [
      'Select a source and target city for relocation',
      'Input your current household monthly salary',
      'Analyze the calculated salary adjustments and cost indices'
    ],
    proTip: 'A city with lower rent can still have higher living costs if transport is expensive. Factor in all costs, including tax rates, when relocating.'
  },

  'smart-route': {
    id: 'smart-route',
    title: 'Stealth Fuel & Toll Router',
    category: 'trips',
    icon: '🗺️',
    tag: 'Trip Planning',
    desc: 'A route expense optimizer. Computes fuel usage, toll costs, and CO2 emissions for trips, offering live simulated playbacks and comparing driving costs against cab rates.',
    path: '/smart?category=habits&tool=route',
    features: [
      { name: 'Smart Autocomplete Deduplication', desc: 'Deduplicates and groups search suggestions under Nearby, Cities, and Other.' },
      { name: 'Animated "Route Ready" Strip', desc: 'Animated confirmation bar that confirms both locations are valid.' },
      { name: 'Cost Breakdown Card', desc: 'Detailed cost breakdown including tolls, fuel consumption, and equivalent cab options.' },
      { name: 'Simulation Player Controls', desc: 'Interactive controls to pause, resume, or reset the simulated drive.' }
    ],
    howToUse: [
      'Input origin and destination locations in the search boxes.',
      'Wait for the green confirmation strip, then review route cards.',
      'Click "Simulate Live Drive" to watch a live playback simulation.'
    ],
    benefits: [
      'Saves money on road trips by comparing toll and fuel costs beforehand.',
      'Shows the environmental impact of your drive with carbon emissions estimates.'
    ],
    checklist: [
      'Input origin and destination addresses in inputs',
      'Inspect the green confirmation strip and metrics card',
      'Trigger "Simulate Live Drive" and use playback controls'
    ],
    proTip: 'Compare driving costs to local cab rates displayed in the cost summary to determine if driving is the most cost-effective option.'
  },

  'smart-oracle': {
    id: 'smart-oracle',
    title: 'Purchase Timing Oracle',
    category: 'finance',
    icon: '⏰',
    tag: 'Behavioral Habits',
    desc: 'A retail price timing predictor. Tracks discount cycles for electronics and uses fare simulators to recommend whether to buy now or wait for upcoming holiday sales.',
    path: '/smart?category=habits&tool=oracle',
    features: [
      { name: 'Discount Cycles Database', desc: 'Tracks sales patterns for electronics, apparel, and cars.' },
      { name: 'Flight Fare Price Simulator', desc: 'Predicts flight price changes based on days to departure.' },
      { name: 'Action Recommendation', desc: 'Displays a clear "BUY NOW" or "WAIT" rating based on price trends.' }
    ],
    howToUse: [
      'Select a product category or search for an item.',
      'Input your target purchase timeline.',
      'Check the Price Trend rating (Buy vs Wait) and historical sale dates.'
    ],
    benefits: [
      'Helps you get the best price by timing purchases to major sales.',
      'Saves money on flights by identifying optimal booking windows.'
    ],
    checklist: [
      'Select a product category (e.g. Smartphones)',
      'Input your target purchase date range',
      'Review the Buy / Wait rating and price forecast card'
    ],
    proTip: 'Electronics and home appliances usually have their lowest prices during major holiday sales. Wait for these events if your purchase isn\'t urgent.'
  },

  '/learn/lab': {
    id: '/learn/lab',
    title: 'Sandbox Simulation Lab',
    category: 'ai',
    icon: '🔬',
    tag: 'Interactive Sandbox',
    desc: 'An interactive sandbox simulator where you can tweak sliders to test compound interest, inflation, options decay, and more in real-time.',
    path: '/learn/lab',
    features: [
      { name: 'Dynamic Knob Sliders', desc: 'Interact with variables to simulate financial mechanisms under different regimes.' },
      { name: 'SVG Dynamic Curves', desc: 'Visualize exponential curves, option butterflies, and blockchain node security waves in real-time.' },
      { name: 'AI Debate Chat Tutor', desc: 'Chat with FinGuru AI to clarify questions and debate topics for score evaluation.' },
      { name: 'Market Crisis Injector', desc: 'Stress test your parameters against supply shocks and volatility events.' }
    ],
    howToUse: [
      'Read the lesson concept and analogy at the top.',
      'Adjust the microscope variables to satisfy the target goal conditions.',
      'Chat with FinGuru AI or inject a market crisis to test your understanding.',
      'Click "Complete & Claim" once the practice target is achieved to earn coins.'
    ],
    benefits: [
      'Reinforces complex financial concepts using risk-free sandbox visualization.',
      'Earns virtual coins to unlock premium custom profile features.'
    ],
    checklist: [
      'Adjust sliders to meet the simulation target goal',
      'Ask the AI tutor a question in the debate chatbox',
      'Inject and stabilize a simulated Market Crisis'
    ],
    proTip: 'Use the Sweep toggle to automate parameter shifts and watch how curves adjust continuously!'
  },

  '/playground': {
    id: '/playground',
    title: 'Gamified Academy Road Playground',
    category: 'ai',
    icon: '🎮',
    tag: 'Gamified Path',
    desc: 'An interactive SVG winding map that charts your financial learning journey visually through chapters and quests.',
    path: '/playground',
    features: [
      { name: 'Interactive SVG Winding Map', desc: 'A node-based map of lessons that unlocks sequentially as you complete courses.' },
      { name: 'CSS Celebration Confetti', desc: 'Triggers rewarding confetti animations on completing checkpoints to motivate learners.' },
      { name: 'Platform Achievements Panel', desc: 'Displays earned badges and tracks progress toward unlocking the next milestone.' }
    ],
    howToUse: [
      'Open the playground to see your progress on the winding course map.',
      'Click on any active, unlocked lesson node to start a module.',
      'Complete quizzes and earn coins to unlock subsequent nodes on the path.'
    ],
    benefits: [
      'Visualizes financial education progress, making complex curricula feel like a game.',
      'Keeps users engaged and motivated through structured milestones.'
    ],
    checklist: [
      'Select and open an active node on the winding map',
      'Earn enough XP to unlock the next chapter node',
      'View your active achievements badges overview list'
    ],
    proTip: 'Follow the path sequentially. Skipping modules might leave gaps in your knowledge, making later quizzes much harder to pass!'
  },

  '/public/photos/:inviteCode': {
    id: '/public/photos/:inviteCode',
    title: 'Public Photo Vault Showcase',
    category: 'trips',
    icon: '🖼️',
    tag: 'Public Photo Album',
    desc: 'View shared trip albums publicly via secure invite links, browse high-res photos, and download memories.',
    path: '/public/photos/:inviteCode',
    features: [
      { name: 'High-Res Carousel Viewer', desc: 'View trip photos in full definition without social media compression.' },
      { name: 'AI Image Details', desc: 'View AI curation tags and photo capture metadata.' },
      { name: 'Postcard Gallery', desc: 'Browse customized trip retro collages and postcards.' }
    ],
    howToUse: [
      'Access the page using the secure public invite link.',
      'Browse through the photo thumbnails and click to expand into full view.',
      'Review postcards and memory notes posted by group members.'
    ],
    benefits: [
      'Allows friends and family to view memories without needing an active account.',
      'Preserves original photo quality for sharing.'
    ],
    checklist: [
      'Browse the shared trip photo gallery grid',
      'Expand an image to view in high-resolution detail',
      'Check the collages and postcards generated by the group'
    ],
    proTip: 'You can download the full-resolution images directly by clicking the download icon on any expanded photo.'
  },

  '/admin': {
    id: '/admin',
    title: 'System Administrator Control Center',
    category: 'system',
    icon: '⚙️',
    tag: 'Admin Dashboard',
    desc: 'Internal developer and administrator workspace to manage users, monitor API health metrics, and audit system logs.',
    path: '/admin',
    features: [
      { name: 'User Management Table', desc: 'List registered users, reset virtual coin balances, and adjust permissions.' },
      { name: 'API Health Monitors', desc: 'Real-time charts displaying response times, query load, and database connection status.' },
      { name: 'System Logs Auditing', desc: 'Scrollable live logger stream catching anomalies and transaction flags.' }
    ],
    howToUse: [
      'Verify database connection indicators are glowing green.',
      'Use the search filter to find users and modify their virtual balances.',
      'Scan the system logs terminal to identify any API error flags.'
    ],
    benefits: [
      'Provides developers and operators full visibility into system health.',
      'Enables quick resolution of account issues or transaction logs.'
    ],
    checklist: [
      'Verify API health and database status indicators',
      'Search for a user in the administrator panel',
      'Review the recent system logs output terminal stream'
    ],
    proTip: 'Keep an eye on the database connection pool; high traffic can cause query delays if connections exceed safe limits.'
  }
};
