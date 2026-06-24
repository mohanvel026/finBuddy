// client/src/components/common/ExpenseSegmentTree.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Play, SkipForward, RotateCcw, HelpCircle, Edit2, Check, Sparkles, Sliders, ArrowRight } from 'lucide-react';

const INITIAL_EXPENSES = [1200, 450, 0, 3200, 800, 1500, 600, 0, 4500, 1200, 850, 300, 0, 150, 2400, 950];

export const ExpenseSegmentTree = () => {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [activeMode, setActiveMode] = useState('query'); // 'query' | 'update'
  
  // Query parameters
  const [queryL, setQueryL] = useState(2);
  const [queryR, setQueryR] = useState(9);

  // Lazy Update parameters
  const [updateL, setUpdateL] = useState(4);
  const [updateR, setUpdateR] = useState(11);
  const [updateVal, setUpdateVal] = useState(500);

  const [editingDay, setEditingDay] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Segment Tree & Lazy state
  const [tree, setTree] = useState([]);
  const [lazy, setLazy] = useState([]);

  // Simulation steps states
  const [simSteps, setSimSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms

  // Initial Tree builder
  const buildTree = (arr) => {
    const n = arr.length;
    const nextTree = new Array(4 * n).fill(null);
    const nextLazy = new Array(4 * n).fill(0);

    const build = (node, start, end) => {
      if (start === end) {
        nextTree[node] = { val: arr[start], start, end, isLeaf: true };
        return;
      }
      const mid = Math.floor((start + end) / 2);
      const left = 2 * node + 1;
      const right = 2 * node + 2;
      build(left, start, mid);
      build(right, mid + 1, end);
      nextTree[node] = {
        val: (nextTree[left]?.val || 0) + (nextTree[right]?.val || 0),
        start,
        end,
        isLeaf: false
      };
    };

    build(0, 0, n - 1);
    return { newTree: nextTree, newLazy: nextLazy };
  };

  // Rebuild tree on expenses change (when not running lazy update simulation)
  useEffect(() => {
    const { newTree, newLazy } = buildTree(expenses);
    setTree(newTree);
    setLazy(newLazy);
    handleResetSim();
  }, [expenses]);

  // Generate Simulation steps for Query
  const generateQuerySteps = () => {
    const steps = [];
    const nextTree = JSON.parse(JSON.stringify(tree));
    const nextLazy = [...lazy];

    const query = (node, start, end) => {
      // 1. Resolve pending lazy value at this node
      if (nextLazy[node] !== 0) {
        const diff = nextLazy[node];
        nextTree[node].val += (end - start + 1) * diff;
        if (start !== end) {
          nextLazy[2 * node + 1] += diff;
          nextLazy[2 * node + 2] += diff;
        }
        steps.push({
          node,
          type: 'lazy_resolve',
          desc: `⚙️ Node ${node} [Day ${start}-${end}]: Found pending lazy value +₹${diff}. Updated node value to ₹${nextTree[node].val}.`,
          status: 'partial',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        nextLazy[node] = 0;
      }

      if (queryR < start || end < queryL) {
        steps.push({
          node,
          type: 'outside',
          desc: `🔴 Node ${node} [Day ${start}-${end}] is completely OUTSIDE query range [Day ${queryL}-${queryR}]. Return 0.`,
          status: 'outside',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        return 0;
      }
      if (queryL <= start && end <= queryR) {
        const val = nextTree[node]?.val || 0;
        steps.push({
          node,
          type: 'inside',
          desc: `🟢 Node ${node} [Day ${start}-${end}] is completely INSIDE query range [Day ${queryL}-${queryR}]. Add ₹${val.toLocaleString('en-IN')} and return.`,
          status: 'inside',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        return val;
      }
      steps.push({
        node,
        type: 'partial',
        desc: `?? Node ${node} [Day ${start}-${end}] PARTIALLY overlaps query range. Recurse into children.`,
        status: 'partial',
        treeState: JSON.parse(JSON.stringify(nextTree)),
        lazyState: [...nextLazy]
      });
      const mid = Math.floor((start + end) / 2);
      const left = 2 * node + 1;
      const right = 2 * node + 2;
      const leftSum = query(left, start, mid);
      const rightSum = query(right, mid + 1, end);
      return leftSum + rightSum;
    };

    query(0, 0, expenses.length - 1);
    return steps;
  };

  // Generate Simulation steps for Lazy Range Update
  const generateUpdateSteps = () => {
    const steps = [];
    const nextTree = JSON.parse(JSON.stringify(tree));
    const nextLazy = [...lazy];

    const update = (node, start, end) => {
      // 1. Resolve pending lazy value
      if (nextLazy[node] !== 0) {
        const diff = nextLazy[node];
        nextTree[node].val += (end - start + 1) * diff;
        if (start !== end) {
          nextLazy[2 * node + 1] += diff;
          nextLazy[2 * node + 2] += diff;
        }
        steps.push({
          node,
          type: 'lazy_resolve',
          desc: `⚙️ Node ${node} [Day ${start}-${end}]: Resolved pending lazy value of +₹${diff}. Node value updated to ₹${nextTree[node].val}.`,
          status: 'partial',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        nextLazy[node] = 0;
      }

      // No overlap
      if (end < updateL || updateR < start) {
        steps.push({
          node,
          type: 'outside',
          desc: `🔴 Node ${node} [Day ${start}-${end}]: No overlap with update range [Day ${updateL}-${updateR}].`,
          status: 'outside',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        return;
      }

      // Complete overlap
      if (updateL <= start && end <= updateR) {
        nextTree[node].val += (end - start + 1) * updateVal;
        steps.push({
          node,
          type: 'inside',
          desc: `🟢 Node ${node} [Day ${start}-${end}]: Completely inside update range. Incremented value by ₹${(end - start + 1) * updateVal}.`,
          status: 'inside',
          treeState: JSON.parse(JSON.stringify(nextTree)),
          lazyState: [...nextLazy]
        });
        
        if (start !== end) {
          nextLazy[2 * node + 1] += updateVal;
          nextLazy[2 * node + 2] += updateVal;
          steps.push({
            node,
            type: 'set_lazy',
            desc: `⏳ Node ${node} [Day ${start}-${end}]: Set lazy = +₹${updateVal} on children (Nodes ${2*node+1} & ${2*node+2}) to defer update. STOP recursion.`,
            status: 'inside',
            treeState: JSON.parse(JSON.stringify(nextTree)),
            lazyState: [...nextLazy]
          });
        }
        return;
      }

      // Partial overlap
      steps.push({
        node,
        type: 'partial',
        desc: `?? Node ${node} [Day ${start}-${end}]: Partially overlaps update range. Recurse into children.`,
        status: 'partial',
        treeState: JSON.parse(JSON.stringify(nextTree)),
        lazyState: [...nextLazy]
      });

      const mid = Math.floor((start + end) / 2);
      update(2 * node + 1, start, mid);
      update(2 * node + 2, mid + 1, end);
      
      nextTree[node].val = nextTree[2 * node + 1].val + nextTree[2 * node + 2].val;
      steps.push({
        node,
        type: 'merge',
        desc: `🔄 Node ${node} [Day ${start}-${end}]: Merged child node values. Updated value to ₹${nextTree[node].val}.`,
        status: 'partial',
        treeState: JSON.parse(JSON.stringify(nextTree)),
        lazyState: [...nextLazy]
      });
    };

    update(0, 0, expenses.length - 1);
    return steps;
  };

  // Compile active simulation steps
  const activeSimSteps = useMemo(() => {
    if (activeMode === 'query') return generateQuerySteps();
    return generateUpdateSteps();
  }, [tree, lazy, queryL, queryR, updateL, updateR, updateVal, activeMode]);

  // Handle Playback Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= activeSimSteps.length - 1) {
            setIsPlaying(false);
            // Apply updates to the actual expenses if it was a range update completion
            if (activeMode === 'update') {
              const newExpenses = [...expenses];
              for (let i = updateL; i <= updateR; i++) {
                newExpenses[i] += updateVal;
              }
              // Temporarily disable trigger rebuilt, just update expenses
              setExpenses(newExpenses);
            }
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeSimSteps.length, playbackSpeed, activeMode]);

  const handleStartSim = () => {
    setCurrentStepIdx(0);
    setIsPlaying(true);
  };

  const handleResetSim = () => {
    setCurrentStepIdx(-1);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => Math.min(activeSimSteps.length - 1, prev + 1));
  };

  // Node position calculation helper
  const getNodeCoords = (index) => {
    const W = 620; // SVG Width
    const level = Math.floor(Math.log2(index + 1));
    const offset = index - ((1 << level) - 1);
    const nodesAtLevel = 1 << level;
    
    const x = (offset + 0.5) * (W / nodesAtLevel);
    const y = 30 + level * 34; // vertical spacing
    return { x, y };
  };

  // Determine active highlighting color based on step state
  const getNodeVisuals = (nodeIdx) => {
    // Current active state
    const currentStep = currentStepIdx >= 0 ? activeSimSteps[currentStepIdx] : null;
    const currentActiveTree = currentStep ? currentStep.treeState : tree;
    const currentActiveLazy = currentStep ? currentStep.lazyState : lazy;
    
    const nodeVal = currentActiveTree[nodeIdx]?.val || 0;
    const nodeLazy = currentActiveLazy[nodeIdx] || 0;

    if (currentStepIdx === -1) {
      // Find final state from logs
      const step = activeSimSteps.find(s => s.node === nodeIdx);
      return { 
        status: step ? step.status : 'unvisited', 
        val: nodeVal, 
        lazy: nodeLazy 
      };
    }

    // Step-by-step state
    for (let i = 0; i <= currentStepIdx; i++) {
      if (activeSimSteps[i].node === nodeIdx) {
        if (i === currentStepIdx) {
          return { 
            status: 'active-' + activeSimSteps[i].status, 
            val: nodeVal, 
            lazy: nodeLazy 
          };
        }
        return { 
          status: activeSimSteps[i].status, 
          val: nodeVal, 
          lazy: nodeLazy 
        };
      }
    }
    return { 
      status: 'unvisited', 
      val: nodeVal, 
      lazy: nodeLazy 
    };
  };

  const handleSaveDay = (index) => {
    const val = Math.max(0, parseInt(editValue) || 0);
    const newExpenses = [...expenses];
    newExpenses[index] = val;
    setExpenses(newExpenses);
    setEditingDay(null);
  };

  // Sum of current query range
  const currentQuerySum = useMemo(() => {
    let sum = 0;
    for (let i = queryL; i <= queryR; i++) {
      sum += expenses[i];
    }
    return sum;
  }, [expenses, queryL, queryR]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Informative Header */}
      <div className="card bg-white/3 border border-white/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">📈</span>
            Segment Tree Expense Query Engine (Lazy Prop Enabled)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Query arbitrary date-range spending totals in logarithmic time <strong className="text-cyan-400">O(log N)</strong>. 
            Supports **Lazy Propagation** which defers child node updates during bulk adjustments, keeping updates at <strong className="text-cyan-400">O(log N)</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl text-center">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Range Query</p>
            <p className="text-sm font-black font-mono">O(log N)</p>
          </div>
          <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl text-center">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Range Update (Lazy)</p>
            <p className="text-sm font-black font-mono">O(log N)</p>
          </div>
        </div>
      </div>

      {/* Mode Selectors Tab */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 max-w-md gap-1">
        <button
          onClick={() => { setActiveMode('query'); handleResetSim(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeMode === 'query' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔍 Range Query Sum
        </button>
        <button
          onClick={() => { setActiveMode('update'); handleResetSim(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeMode === 'update' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⏳ Bulk Adjust (Lazy Prop)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive SVG tree & Playback */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-300">
                🌳 Segment Tree Node Expansion
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">Playback Speed:</span>
                <select 
                  className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-cyan-400 font-mono"
                  value={playbackSpeed}
                  onChange={e => setPlaybackSpeed(Number(e.target.value))}
                >
                  <option value={1500}>0.5x (Slow)</option>
                  <option value={1000}>1.0x (Normal)</option>
                  <option value={500}>2.0x (Fast)</option>
                </select>
              </div>
            </div>

            {/* Tree Map SVG Container */}
            <div className="relative w-full overflow-x-auto bg-slate-950/40 rounded-2xl border border-white/5 py-6 flex justify-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.4)]">
              <svg width="640" height="190" viewBox="0 0 640 190" className="min-w-[640px]">
                {/* SVG Definitions for gradients and shadows */}
                <defs>
                  <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="yellow-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
                  </filter>
                  <radialGradient id="segDefault" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </radialGradient>
                  <radialGradient id="segActive" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                  </radialGradient>
                  <radialGradient id="segInsideQuery" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.85"/>
                  </radialGradient>
                  <radialGradient id="segInsideUpdate" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.85"/>
                  </radialGradient>
                  <radialGradient id="segPartial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.8"/>
                  </radialGradient>
                </defs>

                {/* Connections (Lines) */}
                {Array.from({ length: 15 }).map((_, i) => {
                  const parent = getNodeCoords(i);
                  const leftChild = getNodeCoords(2 * i + 1);
                  const rightChild = getNodeCoords(2 * i + 2);
                  
                  const leftVisuals = getNodeVisuals(2 * i + 1);
                  const rightVisuals = getNodeVisuals(2 * i + 2);
                  
                  const isLeftVisited = leftVisuals.status !== 'unvisited';
                  const isRightVisited = rightVisuals.status !== 'unvisited';
                  
                  const isLeftActive = leftVisuals.status.startsWith('active-');
                  const isRightActive = rightVisuals.status.startsWith('active-');

                  return (
                    <g key={i}>
                      {/* Left connection line */}
                      {isLeftActive && (
                        <line 
                          x1={parent.x} y1={parent.y} 
                          x2={leftChild.x} y2={leftChild.y} 
                          stroke="rgba(139, 92, 246, 0.4)" 
                          strokeWidth="4"
                          filter="url(#purple-glow)"
                        />
                      )}
                      <line 
                        x1={parent.x} y1={parent.y} 
                        x2={leftChild.x} y2={leftChild.y} 
                        stroke={isLeftActive ? '#8b5cf6' : isLeftVisited ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.04)'} 
                        strokeWidth={isLeftActive ? 2.5 : isLeftVisited ? 1.5 : 1}
                      />

                      {/* Right connection line */}
                      {isRightActive && (
                        <line 
                          x1={parent.x} y1={parent.y} 
                          x2={rightChild.x} y2={rightChild.y} 
                          stroke="rgba(139, 92, 246, 0.4)" 
                          strokeWidth="4"
                          filter="url(#purple-glow)"
                        />
                      )}
                      <line 
                        x1={parent.x} y1={parent.y} 
                        x2={rightChild.x} y2={rightChild.y} 
                        stroke={isRightActive ? '#8b5cf6' : isRightVisited ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.04)'} 
                        strokeWidth={isRightActive ? 2.5 : isRightVisited ? 1.5 : 1}
                      />
                    </g>
                  );
                })}

                {/* Nodes (Circles / Capsules) */}
                {tree.map((node, i) => {
                  if (!node) return null;
                  const { x, y } = getNodeCoords(i);
                  const visuals = getNodeVisuals(i);
                  const level = Math.floor(Math.log2(i + 1));
                  
                  const sizesConfig = [
                    { w: 54, h: 26, rFont: 8, sFont: 9.5, yOffR: -2, yOffS: 8 },
                    { w: 48, h: 24, rFont: 7.5, sFont: 8.5, yOffR: -2, yOffS: 7 },
                    { w: 42, h: 22, rFont: 7, sFont: 8, yOffR: -2, yOffS: 6 },
                    { w: 36, h: 20, rFont: 6.5, sFont: 7.5, yOffR: -2, yOffS: 5 },
                    { w: 28, h: 18, rFont: 5.5, sFont: 6.5, yOffR: -1, yOffS: 5 }
                  ];
                  const size = sizesConfig[level] || sizesConfig[4];
                  
                  let fill = 'url(#segDefault)';
                  let stroke = 'rgba(255, 255, 255, 0.08)';
                  let strokeWidth = 1;
                  let nodeGlow = '';
                  let isCurrentActive = false;

                  if (visuals.status.startsWith('active-')) {
                    fill = 'url(#segActive)';
                    stroke = '#8b5cf6';
                    strokeWidth = 2;
                    nodeGlow = 'url(#purple-glow)';
                    isCurrentActive = true;
                  } else if (visuals.status === 'inside') {
                    fill = activeMode === 'query' ? 'url(#segInsideQuery)' : 'url(#segInsideUpdate)';
                    stroke = activeMode === 'query' ? '#06b6d4' : '#10b981';
                    strokeWidth = 1.5;
                    nodeGlow = activeMode === 'query' ? 'url(#cyan-glow)' : '';
                  } else if (visuals.status === 'partial') {
                    fill = 'url(#segPartial)';
                    stroke = '#fbbf24';
                    strokeWidth = 1.5;
                    nodeGlow = 'url(#yellow-glow)';
                  } else if (visuals.status === 'outside') {
                    fill = 'rgba(15, 23, 42, 0.4)';
                    stroke = 'rgba(255, 255, 255, 0.02)';
                  }

                  const isLazyActive = visuals.lazy > 0;
                  if (isLazyActive && visuals.status === 'unvisited') {
                    stroke = '#f97316';
                    strokeWidth = 1.5;
                  }

                  return (
                    <g key={i} className="transition-all duration-200" filter={nodeGlow}>
                      {/* Pulse ring for active node */}
                      {isCurrentActive && (
                        <rect
                          x={x - size.w / 2 - 4}
                          y={y - size.h / 2 - 4}
                          width={size.w + 8}
                          height={size.h + 8}
                          rx="8"
                          fill="none"
                          stroke="rgba(139, 92, 246, 0.2)"
                          strokeWidth="2"
                          className="animate-ping"
                          style={{ animationDuration: '2s' }}
                        />
                      )}
                      <rect 
                        x={x - size.w / 2} 
                        y={y - size.h / 2} 
                        width={size.w} 
                        height={size.h} 
                        rx="6" 
                        fill={fill} 
                        stroke={isLazyActive ? '#f97316' : stroke} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={isLazyActive ? "2.2 2.2" : "none"}
                        filter="url(#nodeShadow)"
                        className="transition-all duration-200 hover:stroke-slate-400"
                      />
                      {/* Range Text */}
                      <text 
                        x={x} 
                        y={y + size.yOffR} 
                        textAnchor="middle" 
                        fontSize={size.rFont} 
                        fontWeight="black"
                        fill={visuals.status === 'outside' ? '#475569' : '#64748b'}
                        className="font-mono select-none pointer-events-none"
                      >
                        {node.start === node.end ? `${node.start}` : `${node.start}-${node.end}`}
                      </text>
                      {/* Sum Text */}
                      <text 
                        x={x} 
                        y={y + size.yOffS} 
                        textAnchor="middle" 
                        fontSize={size.sFont} 
                        fontWeight="bold"
                        fill={visuals.status === 'outside' ? '#334155' : visuals.status === 'inside' ? (activeMode === 'query' ? '#22d3ee' : '#34d399') : '#e2e8f0'}
                        className="font-mono select-none pointer-events-none"
                      >
                        ₹{visuals.val >= 1000 ? `${(visuals.val / 1000).toFixed(0)}k` : visuals.val}
                      </text>

                      {/* Lazy Flag Badge */}
                      {isLazyActive && (
                        <g transform={`translate(${x + size.w / 2 - 4}, ${y - size.h / 2 - 6})`}>
                          <rect x="0" y="0" width="20" height="9" rx="2" fill="#f97316" filter="url(#nodeShadow)" />
                          <text x="10" y="7" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="black" fontFamily="monospace" className="select-none pointer-events-none">
                            +{visuals.lazy}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleResetSim}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={isPlaying ? () => setIsPlaying(false) : handleStartSim}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    activeMode === 'query' 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${activeMode === 'query' ? 'fill-cyan-400' : 'fill-yellow-400'}`} />
                  {isPlaying ? 'Pause' : activeMode === 'query' ? 'Trace Query' : 'Trace Range Update'}
                </button>
                <button 
                  onClick={handleStepForward}
                  disabled={currentStepIdx >= activeSimSteps.length - 1}
                  className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-300 transition"
                  title="Step Forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">Trace Status:</span>
                <span className={`text-xs font-mono font-bold ${activeMode === 'query' ? 'text-cyan-400' : 'text-yellow-400'}`}>
                  {currentStepIdx === -1 ? 'Showing Final Result' : `Evaluating step ${currentStepIdx + 1} of ${activeSimSteps.length}`}
                </span>
              </div>
            </div>

            {/* Simulation Trace Log */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">
                💬 Step-by-Step Recursion Logs
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2 font-mono text-[10.5px]">
                {currentStepIdx === -1 ? (
                  <div className="text-slate-500 italic">Click the trace button to step through the O(log N) tree traversal.</div>
                ) : (
                  activeSimSteps.slice(0, currentStepIdx + 1).map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`p-1.5 rounded transition ${idx === currentStepIdx ? 'bg-purple-950/20 border-l-2 border-purple-500 text-purple-200' : 'text-slate-400'}`}
                    >
                      {step.desc}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Query Controls & Daily Ledger */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Settings Selector */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            {activeMode === 'query' ? (
              <>
                <h4 className="font-bold text-xs uppercase tracking-widest text-cyan-400">
                  🔍 Range Query Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-300">Start Day:</span>
                      <span className="text-cyan-400 font-mono">Day {queryL}</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" value={queryL}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setQueryL(val);
                        if (val > queryR) setQueryR(val);
                        handleResetSim();
                      }}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-300">End Day:</span>
                      <span className="text-cyan-400 font-mono">Day {queryR}</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" value={queryR}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setQueryR(val);
                        if (val < queryL) setQueryL(val);
                        handleResetSim();
                      }}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Range Expense Sum</span>
                      <span className="text-lg font-black font-mono text-cyan-400">₹{currentQuerySum.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded-md border border-white/5">
                      Index {queryL} to {queryR}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-bold text-xs uppercase tracking-widest text-yellow-400">
                  ⚡ Bulk Adjust Range (Lazy)
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-300">Start Day:</span>
                      <span className="text-yellow-400 font-mono">Day {updateL}</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" value={updateL}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setUpdateL(val);
                        if (val > updateR) setUpdateR(val);
                        handleResetSim();
                      }}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-300">End Day:</span>
                      <span className="text-yellow-400 font-mono">Day {updateR}</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" value={updateR}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setUpdateR(val);
                        if (val < updateL) setUpdateL(val);
                        handleResetSim();
                      }}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1.5">Adjustment Amount (₹)</label>
                    <input 
                      type="number" 
                      className="input-dark text-xs py-2 bg-black/40 text-slate-200 border border-white/5 px-3 rounded-xl w-full"
                      value={updateVal}
                      onChange={e => {
                        setUpdateVal(Number(e.target.value) || 0);
                        handleResetSim();
                      }}
                    />
                  </div>

                  <div className="p-4 bg-yellow-950/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Lazy Delta</span>
                      <span className="text-lg font-black font-mono text-yellow-400">+₹{updateVal.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded-md border border-white/5">
                      Days {updateL} to {updateR}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Daily Ledger List */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              📝 16-Day Expense Ledger
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal font-sans">
              Click on any day card to edit values directly. In Lazy Mode, range changes take effect upon completing the playback simulation.
            </p>
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {expenses.map((exp, idx) => {
                const isSelected = activeMode === 'query' 
                  ? (idx >= queryL && idx <= queryR)
                  : (idx >= updateL && idx <= updateR);
                const isEditing = editingDay === idx;

                return (
                  <div 
                    key={idx}
                    className={`p-2 rounded-xl text-center border transition relative group cursor-pointer ${
                      isSelected 
                        ? (activeMode === 'query' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-yellow-500/10 border-yellow-500/30')
                        : 'bg-white/3 border-white/5 hover:border-white/15'
                    }`}
                    onClick={() => {
                      if (!isEditing) {
                        setEditingDay(idx);
                        setEditValue(exp.toString());
                      }
                    }}
                  >
                    <span className="text-[8px] text-slate-500 block font-mono font-black">DAY {idx}</span>
                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1 relative z-10" onClick={e => e.stopPropagation()}>
                        <input 
                          type="number"
                          className="w-full bg-black border border-cyan-500 text-[10px] font-mono text-white text-center py-0.5 rounded"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveDay(idx);
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveDay(idx)} className="text-green-400 hover:text-green-300">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block">
                        ₹{exp >= 1000 ? `${(exp / 1000).toFixed(0)}k` : exp}
                      </span>
                    )}
                    <Edit2 className="w-2.5 h-2.5 text-slate-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
