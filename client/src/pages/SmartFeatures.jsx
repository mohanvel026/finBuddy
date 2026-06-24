// client/src/pages/SmartFeatures.jsx — Redesigned Pillar-Based Smart Dashboard
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
/* import Sidebar removed */
import toast from 'react-hot-toast';
import SectionGuide from '../components/common/SectionGuide';

// Import all sub-tool components
import { SpendingDNA, FraudShield, CostRadar, BillNegotiator, RoutePlanner } from './smart/SmartTools';
import { PurchaseOracle, EMITrap, ImpulseTherapist, NewsCanceler } from './smart/SmartTools2';
import { SpendAnomalyDetector } from './smart/SpendAnomalyDetector';
import { GoalPlanner } from './smart/GoalPlanner';
import { SWPSimulator } from './smart/SWPSimulator';
import { FinancialAutopsy } from './smart/FinancialAutopsy';
import { MacroSimulator } from './smart/MacroSimulator';
import { FIREAutopilot } from './smart/FIREAutopilot';
import { DebtOptimizer } from './smart/DebtOptimizer';


const PILLARS = [
  {
    id: 'shield',
    icon: '🛡️',
    title: 'Security & Risk Shield',
    desc: 'Protect your money with real-time anomaly alerts, UPI scam forensic scanners, clickbait news cancelers, and macro-shock stress tests.',
    color: 'from-red-500/10 to-rose-600/10 border-red-500/20 text-red-400 hover:border-red-500/40',
    tag: '5 AI Tools',
    tools: [
      { id: 'fraud', icon: '🛡️', label: 'UPI Fraud Shield', desc: 'Forensic scam messaging analyzer' },
      { id: 'anomaly', icon: '🚨', label: 'AI Anomaly Shield', desc: 'Outlier transaction spike alerts' },
      { id: 'news', icon: '📰', label: 'News Panic Filter', desc: 'Noise-canceling headline scrubber' },
      { id: 'bill', icon: '🧾', label: 'Bill Negotiator', desc: 'AI call & email negotiation scripts' },
      { id: 'macro', icon: '🌐', label: 'Macro Shock Lab', desc: 'Fed & RBI interest rate stress test' }
    ]
  },
  {
    id: 'planning',
    icon: '🎯',
    title: 'Planning & Projections',
    desc: 'Map your financial future using Monte Carlo simulators, stochastic FIRE retirement plans, tax-efficient SWPs, and debt repayment calculators.',
    color: 'from-emerald-500/10 to-teal-600/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40',
    tag: '5 AI Tools',
    tools: [
      { id: 'goals', icon: '🎯', label: 'Goal Monte Carlo', desc: 'Drift & shock portfolio compounder' },
      { id: 'fire', icon: '🔥', label: 'FIRE Autopilot', desc: 'Stochastic early retirement runway' },
      { id: 'swp', icon: '📈', label: 'SWP Tax Optimizer', desc: 'Periodic withdrawals tax waterfall' },
      { id: 'debt', icon: '⚖️', label: 'Debt Paydown Optimizer', desc: 'Snowball vs. Avalanche simulator' },
      { id: 'emi', icon: '💸', label: 'EMI Trap Auditor', desc: 'Exposes hidden APR lending traps' }
    ]
  },
  {
    id: 'habits',
    icon: '🧠',
    title: 'Habits & Diagnostics',
    desc: 'Audit your spending behaviors, identify psychological biases, estimate city cost of living variances, and construct fuel-smart routes.',
    color: 'from-purple-500/10 to-indigo-600/10 border-purple-500/20 text-purple-400 hover:border-purple-500/40',
    tag: '6 AI Tools',
    tools: [
      { id: 'dna', icon: '🧬', label: 'Spending DNA', desc: 'Quiz-based behavioral diagnostics' },
      { id: 'autopsy', icon: '🧠', label: 'AI Financial Autopsy', desc: 'Opportunity cost bias analyzer' },
      { id: 'impulse', icon: '🧠', label: 'Impulse Therapy', desc: 'CBT buying therapist chatbot' },
      { id: 'radar', icon: '📡', label: 'City Radar Cost', desc: 'Living indices & relocation rates' },
      { id: 'route', icon: '🗺️', label: 'Stealth Fuel Router', desc: 'Toll, patrol, and fuel cost routing' },
      { id: 'oracle', icon: '⏰', label: 'Purchase Oracle', desc: 'Pricing seasonality deal timing' }
    ]
  }
];

const SmartFeatures = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const toolParam = searchParams.get('tool');

  const [activeCategory, setActiveCategory] = useState(categoryParam || null); // null | 'shield' | 'planning' | 'habits'
  const [activeTab, setActiveTab] = useState(toolParam || 'dna');

  // Sync search parameters -> state
  useEffect(() => {
    if (categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
    if (toolParam && toolParam !== activeTab) {
      setActiveTab(toolParam);
    }
  }, [categoryParam, toolParam]);

  // Sync state -> search parameters
  useEffect(() => {
    const params = {};
    if (activeCategory) {
      params.category = activeCategory;
      params.tool = activeTab;
    }
    setSearchParams(params, { replace: true });
  }, [activeCategory, activeTab, setSearchParams]);

  // Force scroll to top on mount and set scroll restoration to manual
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when tab or category changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCategory, activeTab]);

  const selectedPillar = PILLARS.find(p => p.id === activeCategory);

  const selectPillar = (id) => {
    setActiveCategory(id);
    const firstTool = PILLARS.find(p => p.id === id).tools[0].id;
    setActiveTab(firstTool);
  };

  return (
    <div className="contents">
      {/* Sidebar layout */}
      
      {/* 
        Responsive Layout Container: 
        Replaced ml-64 with lg:pl-72 to accommodate mobile views, adding pt-16 for mobile header spacing 
      */}
      <main className="lg:pl-72 flex-1 min-h-screen pt-16 lg:pt-0">
        
        {/* Ambient background blur orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-pink-600/4 rounded-full blur-3xl" />
        </div>

        <div className="p-4 lg:p-6 pb-24 w-full">
          {/* Header */}
          <div className="mb-8 border-b border-white/5 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--lavender)] mb-2">Smart Features Laboratory</p>
            <h1 className="text-3xl lg:text-4xl font-black leading-tight text-white">
              <span className="gradient-text">Financial Intelligence</span>
              <span> Hub</span>
            </h1>
            <p className="text-[var(--text-dim)] mt-1.5 text-xs lg:text-sm max-w-xl">
              16 AI-powered modules organized into three core pillars to shield, project, and optimize your financial universe.
            </p>
          </div>

          {/* PILLARS OVERVIEW MODE */}
          {activeCategory === null ? (
            <div className="space-y-6 animate-fade-in">
              <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest block">Choose a Lab Domain to begin</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PILLARS.map((p, pi) => (
                  <div 
                    key={p.id} 
                    onClick={() => selectPillar(p.id)}
                    className={`card bg-gradient-to-br ${p.color} hover:scale-105 transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between group relative overflow-hidden`}
                  >
                    {/* Animated background orb */}
                    <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none ${
                      pi === 0 ? 'bg-red-500' : pi === 1 ? 'bg-emerald-500' : 'bg-purple-500'
                    }`} />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-4xl shrink-0 group-hover:animate-float">{p.icon}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: pi === 0 ? '#F87171' : pi === 1 ? '#34D399' : '#A78BFA' }} />
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: pi === 0 ? '#F87171' : pi === 1 ? '#34D399' : '#A78BFA' }} />
                          </span>
                          <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">{p.tag}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:gradient-text transition-colors mb-2">{p.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{p.desc}</p>
                    </div>
                    
                    {/* Tool pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tools.slice(0, 3).map(tool => (
                        <span key={tool.id} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{tool.icon} {tool.label}</span>
                      ))}
                      {p.tools.length > 3 && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">+{p.tools.length - 3} more</span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      <span>Open Lab Panel</span>
                      <span className="group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
                    </div>
                  </div>
                ))}
              </div>
              <SectionGuide sectionId="/smart" />
            </div>
          ) : (
            /* ACTIVE PILLAR PANEL MODE (Horizontal Top Bar Layout) */
            <div className="space-y-6 animate-fade-in">
              {/* Pillar Top Tool Menu Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 border border-white/5 p-4 rounded-3xl w-full flex-wrap">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition duration-200 cursor-pointer"
                  >
                    ← BACK
                  </button>
                  <div className="flex items-center gap-2 border-l border-white/5 pl-3">
                    <span className="text-xl">{selectedPillar.icon}</span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">{selectedPillar.title}</span>
                  </div>
                </div>

                <div className="flex bg-black/45 border border-white/10 p-1 rounded-2xl gap-1.5 overflow-x-auto max-w-full no-scrollbar">
                  {selectedPillar.tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        activeTab === tool.id
                          ? 'bg-violet-500 text-slate-950 font-black shadow-lg'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/3'
                      }`}
                    >
                      {tool.icon} {tool.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pillar Active Content Output Box (Full Width) */}
              <div className="w-full">
                <div className="border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                  <span className="text-xl shrink-0">
                    {selectedPillar.tools.find(t => t.id === activeTab)?.icon}
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {selectedPillar.tools.find(t => t.id === activeTab)?.label}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {selectedPillar.tools.find(t => t.id === activeTab)?.desc}
                    </p>
                  </div>
                </div>

                <div className="w-full mb-6">
                  {/* Shield Pillar Views */}
                  {activeTab === 'fraud'   && <FraudShield />}
                  {activeTab === 'anomaly' && <SpendAnomalyDetector />}
                  {activeTab === 'news'    && <NewsCanceler />}
                  {activeTab === 'bill'    && <BillNegotiator />}
                  {activeTab === 'macro'   && <MacroSimulator />}

                  {/* Planning Pillar Views */}
                  {activeTab === 'goals'   && <GoalPlanner />}
                  {activeTab === 'fire'    && <FIREAutopilot />}
                  {activeTab === 'swp'     && <SWPSimulator />}
                  {activeTab === 'debt'    && <DebtOptimizer />}
                  {activeTab === 'emi'     && <EMITrap />}

                  {/* Habits Pillar Views */}
                  {activeTab === 'dna'     && <SpendingDNA />}
                  {activeTab === 'autopsy' && <FinancialAutopsy />}
                  {activeTab === 'impulse' && <ImpulseTherapist />}
                  {activeTab === 'radar'   && <CostRadar />}
                  {activeTab === 'route'   && <RoutePlanner />}
                  {activeTab === 'oracle'  && <PurchaseOracle />}
                </div>

                {/* Inline Section Guide for each active tool at the bottom */}
                <SectionGuide sectionId={`smart-${activeTab}`} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SmartFeatures;
