// client/src/components/common/SectionGuide.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Compass, CheckSquare, Square, Lightbulb, ClipboardList, Info, Award, RotateCcw } from 'lucide-react';
import { featureGuides } from '../../data/featureGuideData';

const CATEGORY_THEMES = {
  finance: {
    border: 'border-emerald-500/20 hover:border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    borderLeft: 'border-l-emerald-500',
    gradient: 'from-emerald-500/5 to-transparent',
    badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    accent: 'bg-emerald-500'
  },
  trading: {
    border: 'border-cyan-500/20 hover:border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    borderLeft: 'border-l-cyan-500',
    gradient: 'from-cyan-500/5 to-transparent',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    accent: 'bg-cyan-500'
  },
  trips: {
    border: 'border-amber-500/20 hover:border-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    borderLeft: 'border-l-amber-500',
    gradient: 'from-amber-500/5 to-transparent',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    accent: 'bg-amber-500'
  },
  ai: {
    border: 'border-pink-500/20 hover:border-pink-500/30',
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    borderLeft: 'border-l-pink-500',
    gradient: 'from-pink-500/5 to-transparent',
    badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    accent: 'bg-pink-500'
  },
  system: {
    border: 'border-violet-500/20 hover:border-violet-500/30',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    borderLeft: 'border-l-violet-500',
    gradient: 'from-violet-500/5 to-transparent',
    badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    accent: 'bg-violet-500'
  }
};

const defaultTheme = {
  border: 'border-cyan-500/20 hover:border-cyan-500/30',
  text: 'text-cyan-400',
  bg: 'bg-cyan-500/10',
  borderLeft: 'border-l-cyan-500',
  gradient: 'from-cyan-500/5 to-transparent',
  badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  accent: 'bg-cyan-500'
};

const SectionGuide = ({ sectionId }) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_guide_open_${sectionId}`);
    return saved === 'true'; // Closed by default — only open if explicitly opened before
  });
  const [checkedItems, setCheckedItems] = useState({});

  // Fetch data
  const guide = featureGuides[sectionId];

  // Load checklist progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finbuddy_guide_progress');
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, [sectionId]);

  if (!guide) return null;

  const theme = CATEGORY_THEMES[guide.category] || defaultTheme;

  // Toggle open/close state and persist
  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    localStorage.setItem(`finbuddy_guide_open_${sectionId}`, nextState ? 'true' : 'false');
  };

  // Toggle checks
  const handleToggleCheck = (idx) => {
    const key = `${guide.id}-${idx}`;
    const updated = {
      ...checkedItems,
      [key]: !checkedItems[key]
    };
    setCheckedItems(updated);
    localStorage.setItem('finbuddy_guide_progress', JSON.stringify(updated));
  };

  // Reset checklist progress
  const handleResetChecklist = (e) => {
    e.stopPropagation();
    const updated = { ...checkedItems };
    const itemsList = guide.checklist || [];
    itemsList.forEach((_, idx) => {
      delete updated[`${guide.id}-${idx}`];
    });
    setCheckedItems(updated);
    localStorage.setItem('finbuddy_guide_progress', JSON.stringify(updated));
  };

  // Calculate completion
  const items = guide.checklist || [];
  let completed = 0;
  items.forEach((_, idx) => {
    if (checkedItems[`${guide.id}-${idx}`]) completed++;
  });
  const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className={`card-border-flow bg-slate-900/30 border ${theme.border} rounded-3xl overflow-hidden mt-10 mb-16 transition-all duration-300`}>
      
      {/* Header Bar */}
      <div 
        onClick={handleToggleOpen}
        className="px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-white/[0.01] transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow">{guide.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                {guide.title} Guide
              </span>
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}>
                {guide.tag}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Click to {isOpen ? 'Hide' : 'Reveal'} Section Overview & Onboarding Checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {percent > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                percent === 100 
                  ? 'bg-green-500/10 border-green-500/25 text-green-400' 
                  : `${theme.bg} ${theme.border} ${theme.text}`
              }`}>
                {percent}% Completed
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Reset onboarding checklist progress for this page?")) {
                    handleResetChecklist(e);
                  }
                }}
                title="Reset checklist progress"
                className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
              >
                <RotateCcw size={11} />
              </button>
            </div>
          )}
          <button className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 transition">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Guide Area */}
      {isOpen && (
        <div className="border-t border-white/5 px-5 py-5 sm:px-6 sm:py-6 bg-slate-950/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-200">
          
          {/* Overview Block: Why this Page & Value Proposition */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-white/5 pb-5">
            {/* Why this page? */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info size={14} className={theme.text} />
                <span>Why this Page?</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {guide.desc}
              </p>
            </div>

            {/* What is its value/uses? */}
            {guide.benefits && guide.benefits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Award size={14} className={theme.text} />
                  <span>Value & Key Benefits</span>
                </h4>
                <ul className="space-y-1.5 list-none pl-0 text-xs text-slate-300 font-medium">
                  {guide.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className={`${theme.text} font-bold select-none`}>✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Left Panel: Checklist and Pro Tips */}
          <div className="space-y-5">
            {items.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList size={14} className={theme.text} />
                  <span>Onboarding Exercises</span>
                </h4>
                <div className="space-y-2">
                  {items.map((task, idx) => {
                    const isChecked = !!checkedItems[`${guide.id}-${idx}`];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleCheck(idx)}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                          isChecked
                            ? 'bg-green-500/5 border-green-500/10 text-slate-400'
                            : 'bg-white/[0.01] border-white/5 text-slate-200 hover:border-white/10'
                        }`}
                      >
                        <span className={`shrink-0 mt-0.5 ${isChecked ? 'text-green-400' : 'text-slate-500'}`}>
                          <CheckSquare size={14} className={isChecked ? 'block' : 'hidden'} />
                          <Square size={14} className={isChecked ? 'hidden' : 'block'} />
                        </span>
                        <span className={`text-xs font-bold leading-normal ${isChecked ? 'line-through text-slate-500 font-medium' : ''}`}>
                          {task}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {guide.proTip && (
              <div className={`p-4 bg-gradient-to-r ${theme.gradient} border-l-2 ${theme.borderLeft} rounded-r-2xl flex gap-3 items-start`}>
                <span className={`${theme.text} mt-0.5 shrink-0 animate-pulse`}><Lightbulb size={18} /></span>
                <div className="space-y-0.5">
                  <h5 className={`text-[10px] font-black ${theme.text} uppercase tracking-wider`}>Pro Advice</h5>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{guide.proTip}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Capabilities & How to Get Started */}
          <div className="space-y-5">
            {/* Features */}
            {guide.features && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className={theme.text} />
                  <span>Capabilities & Features</span>
                </h4>
                <div className="space-y-3">
                  {guide.features.map((feat, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <h5 className={`text-xs font-extrabold ${theme.text} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 ${theme.accent} rounded-full animate-pulse`} />
                        {feat.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 pl-3 leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Use */}
            {guide.howToUse && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Compass size={14} className={theme.text} />
                  <span>How to Get Started</span>
                </h4>
                <div className="space-y-2.5">
                  {guide.howToUse.map((step, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <span className={`w-5 h-5 shrink-0 rounded-full ${theme.bg} border ${theme.border} ${theme.text} text-[10px] font-black flex items-center justify-center font-mono`}>
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default SectionGuide;
