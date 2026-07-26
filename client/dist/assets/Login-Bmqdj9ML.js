import{aa as r,ae as Y,ai as $,ah as O,a4 as e,e as g,aq as f}from"./index-DceS-60z.js";const y=({style:n})=>e.jsx("div",{className:"fb-orb absolute rounded-full pointer-events-none",style:n}),q=[{value:"₹2.4Cr+",label:"Tracked Daily",icon:"📊"},{value:"18K+",label:"Students",icon:"🎓"},{value:"4.9★",label:"App Rating",icon:"⭐"},{value:"100%",label:"Data Secure",icon:"🔒"}],P=[{icon:"📈",text:"Live stock trading with ₹1L virtual wallet",color:"#34D399"},{icon:"💸",text:"Smart bill splitting with UPI settlement",color:"#60A5FA"},{icon:"🤖",text:"AI financial mentor available 24/7",color:"#A78BFA"},{icon:"⚔️",text:"Battle friends in stock market duels",color:"#F472B6"}],K=()=>{var C,A;const[n,j]=r.useState({email:"",password:""}),[v,x]=r.useState(""),[S,w]=r.useState(!1),[B,z]=r.useState(null),[c,p]=r.useState(!1),[u,D]=r.useState(!1),[H,b]=r.useState(null),[d,N]=r.useState(!1),{login:E,verify2FA:I}=Y(),k=$(),F=((A=(C=O().state)==null?void 0:C.from)==null?void 0:A.pathname)||"/dashboard";r.useEffect(()=>{const t=document.documentElement.classList.contains("light");return t&&document.documentElement.classList.remove("light"),setTimeout(()=>N(!0),60),()=>{t&&document.documentElement.classList.add("light")}},[]);const l=[r.useRef(),r.useRef(),r.useRef(),r.useRef(),r.useRef(),r.useRef()],[h,m]=r.useState(["","","","","",""]),T=(t,i)=>{var o,s;if(!/^\d?$/.test(i))return;const a=[...h];a[t]=i,m(a),x(a.join("")),i&&t<5&&((o=l[t+1].current)==null||o.focus()),!i&&t>0&&((s=l[t-1].current)==null||s.focus())},R=(t,i)=>{var a;i.key==="Backspace"&&!h[t]&&t>0&&((a=l[t-1].current)==null||a.focus())},W=async t=>{var i,a;t.preventDefault(),p(!0);try{const o=await E(n.email,n.password);o.requires2FA?(w(!0),z(o.userId),f.success("OTP sent to your email!"),setTimeout(()=>{var s;return(s=l[0].current)==null?void 0:s.focus()},300)):k(F,{replace:!0})}catch(o){f.error(((a=(i=o.response)==null?void 0:i.data)==null?void 0:a.message)||"Login failed")}finally{p(!1)}},M=async t=>{var i,a,o;t.preventDefault(),p(!0);try{await I(B,v),k(F,{replace:!0})}catch(s){f.error(((a=(i=s.response)==null?void 0:i.data)==null?void 0:a.message)||"Invalid OTP"),m(["","","","","",""]),x(""),(o=l[0].current)==null||o.focus()}finally{p(!1)}},L=()=>{"397045021332-ljlfq9bf9mhhbmhmdr54h4nj62qj8lkr.apps.googleusercontent.com".includes("dummy")?(f.success("Sandbox Mode: Simulated Google Auth…",{icon:"🔑",duration:2500}),setTimeout(()=>{window.location.href="/api/auth/google/mock"},900)):window.location.href="/api/auth/google"};return e.jsxs("div",{id:"login-page",style:{minHeight:"100vh",display:"flex",fontFamily:"'Inter', sans-serif",background:"#06050F"},children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* ── Animations ── */
        @keyframes fb-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-18px) rotate(1deg); }
          66%  { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes fb-aurora {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes fb-slide-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fb-slide-left {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fb-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes fb-pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0); }
        }
        @keyframes fb-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fb-particle {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes fb-badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(139,92,246,0.2); }
          50%       { box-shadow: 0 0 16px rgba(139,92,246,0.5); }
        }
        @keyframes fb-counter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fb-orb { filter: blur(80px); animation: fb-float linear infinite; }

        /* ── Left panel ── */
        .fb-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 52%;
          padding: 48px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse at 25% 55%, rgba(109,40,217,0.28) 0%, transparent 58%),
                      radial-gradient(ellipse at 80% 15%, rgba(236,72,153,0.2) 0%, transparent 52%),
                      radial-gradient(ellipse at 60% 85%, rgba(6,182,212,0.1) 0%, transparent 45%),
                      linear-gradient(135deg, #07060F 0%, #0D0B1A 55%, #100E1C 100%);
        }
        @media (min-width: 1024px) { .fb-left { display: flex; } }

        .fb-grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .fb-aurora {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          animation: fb-aurora 25s linear infinite;
          pointer-events: none;
          opacity: 0.12;
          background: conic-gradient(from 0deg, #7C3AED, #EC4899, #06B6D4, #7C3AED);
          top: 50%; left: 50%;
          transform-origin: center;
          margin-top: -300px; margin-left: -300px;
        }

        .fb-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.7) 0%, transparent 70%);
          pointer-events: none;
          animation: fb-particle linear infinite;
        }

        .fb-feature-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
          cursor: default;
        }
        .fb-feature-item:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.25);
          transform: translateX(4px);
        }

        .fb-stat {
          text-align: center;
          padding: 14px 10px;
          border-radius: 16px;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.12);
          transition: all 0.25s;
          animation: fb-badge-glow 3s ease-in-out infinite;
        }
        .fb-stat:hover {
          background: rgba(139,92,246,0.14);
          border-color: rgba(139,92,246,0.3);
          transform: translateY(-2px);
        }

        /* ── Right panel ── */
        .fb-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #07060F 0%, #0B0918 100%);
        }

        .fb-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
          padding: 40px 36px;
          border-radius: 28px;
          background: rgba(13, 11, 26, 0.75);
          border: 1.5px solid rgba(139, 92, 246, 0.25);
          backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 40px rgba(124, 58, 237, 0.05);
        }
        @media (max-width: 480px) { .fb-card { padding: 28px 20px; border-radius: 20px; } }

        /* ── Inputs ── */
        .fb-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(196, 181, 253, 0.8);
          margin-bottom: 8px;
        }
        .fb-input-wrap { position: relative; }
        .fb-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(8, 8, 16, 0.6);
          border: 1.5px solid rgba(139, 92, 246, 0.2);
          border-radius: 14px;
          color: #f8fafc;
          font-size: 14.5px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .fb-input:focus {
          border-color: rgba(139, 92, 246, 0.85);
          background: rgba(139, 92, 246, 0.08);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 20px rgba(139, 92, 246, 0.15);
        }
        .fb-input::placeholder { color: rgba(148, 163, 184, 0.4); font-weight: 400; }

        /* Fix browser autofill white background */
        .fb-input:-webkit-autofill,
        .fb-input:-webkit-autofill:hover,
        .fb-input:-webkit-autofill:focus,
        .fb-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0c0a1a inset !important;
          -webkit-text-fill-color: #f8fafc !important;
          transition: background-color 9999s ease-in-out 0s;
          border-color: rgba(139, 92, 246, 0.5) !important;
        }

        /* ── Buttons ── */
        .fb-btn-primary {
          width: 100%;
          padding: 15px 24px;
          background: linear-gradient(135deg, #7C3AED 0%, #9333EA 45%, #EC4899 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
        }
        .fb-btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 600px;
          animation: fb-shimmer 2.8s infinite;
        }
        .fb-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.5);
        }
        .fb-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .fb-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .fb-btn-google {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          padding: 13px 20px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #CBD5E1;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.2px;
        }
        .fb-btn-google:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }

        .fb-btn-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(100,116,139,0.7); padding: 4px; font-size: 16px;
          transition: color 0.2s; line-height: 1;
        }
        .fb-btn-eye:hover { color: #A78BFA; }

        .fb-btn-back {
          width: 100%; padding: 12px 20px; margin-top: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: rgba(100,116,139,0.8);
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .fb-btn-back:hover { color: #E2E8F0; background: rgba(255,255,255,0.07); }

        /* ── Divider ── */
        .fb-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 18px 0;
        }
        .fb-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .fb-divider-text { font-size: 11px; color: rgba(71,85,105,0.9); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── OTP ── */
        .fb-otp-box {
          width: 48px; height: 58px;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #F1F5F9;
          font-size: 22px; font-weight: 700;
          text-align: center; font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.2s; caret-color: #8B5CF6;
        }
        .fb-otp-box:focus {
          border-color: #8B5CF6;
          background: rgba(139,92,246,0.09);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.2), 0 0 24px rgba(139,92,246,0.15);
        }
        .fb-otp-box.filled { border-color: rgba(139,92,246,0.55); background: rgba(139,92,246,0.08); color: #C4B5FD; }

        /* ── Logo badge ── */
        .fb-logo-icon {
          width: 42px; height: 42px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          box-shadow: 0 4px 16px rgba(124,58,237,0.4);
        }
        .fb-logo-text {
          font-size: 24px; font-weight: 900; letter-spacing: -0.5px;
          background: linear-gradient(135deg, #A78BFA, #F472B6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .fb-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.28);
          margin-bottom: 20px;
        }

        /* ── Card slide-up ── */
        .fb-animate-card { animation: fb-slide-up 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .fb-animate-left { animation: fb-slide-left 0.65s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Security badge ── */
        .fb-security {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 10px;
          background: rgba(52,211,153,0.06);
          border: 1px solid rgba(52,211,153,0.15);
          margin-top: 8px;
        }

        /* ── Quote card ── */
        .fb-quote {
          padding: 18px 20px; border-radius: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
        }
        .fb-quote::before {
          content: '"';
          position: absolute; top: -12px; left: 14px;
          font-size: 80px; color: rgba(139,92,246,0.15);
          font-family: Georgia, serif; line-height: 1;
        }
      `}),e.jsxs("div",{className:"fb-left",children:[e.jsx("div",{className:"fb-aurora"}),e.jsx("div",{className:"fb-grid-overlay"}),e.jsx(y,{style:{width:320,height:320,top:"15%",left:"10%",background:"rgba(124,58,237,0.18)",animationDuration:"22s",animationDelay:"0s"}}),e.jsx(y,{style:{width:240,height:240,bottom:"18%",right:"8%",background:"rgba(236,72,153,0.15)",animationDuration:"28s",animationDelay:"-10s"}}),e.jsx(y,{style:{width:180,height:180,top:"60%",left:"45%",background:"rgba(6,182,212,0.1)",animationDuration:"18s",animationDelay:"-5s"}}),Array.from({length:12},(t,i)=>e.jsx("div",{className:"fb-particle",style:{width:4+i%4*4,height:4+i%4*4,left:`${(i*41+9)%95}%`,top:`${(i*67+13)%90}%`,animationDuration:`${14+i%7*3}s`,animationDelay:`${-(i*1.8)}s`}},i)),e.jsx("div",{className:`relative z-10 ${d?"fb-animate-left":"opacity-0"}`,style:{animationDelay:"0.05s"},children:e.jsxs(g,{to:"/",style:{display:"inline-flex",alignItems:"center",gap:12,textDecoration:"none"},children:[e.jsx("div",{className:"fb-logo-icon",children:"💰"}),e.jsx("span",{className:"fb-logo-text",children:"FinBuddy"})]})}),e.jsxs("div",{className:`relative z-10 ${d?"fb-animate-left":"opacity-0"}`,style:{animationDelay:"0.1s"},children:[e.jsxs("div",{className:"fb-badge",children:[e.jsx("span",{style:{width:7,height:7,borderRadius:"50%",background:"#8B5CF6",animation:"fb-pulse-border 1.5s infinite",display:"inline-block"}}),e.jsx("span",{style:{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#C4B5FD"},children:"India's Smartest Finance App"})]}),e.jsxs("h2",{style:{fontSize:52,fontWeight:900,lineHeight:1.08,color:"#F8FAFC",letterSpacing:"-1.5px",marginBottom:16},children:["Your money,",e.jsx("br",{}),e.jsx("span",{style:{background:"linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #22D3EE 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:"finally smart."})]}),e.jsxs("p",{style:{color:"rgba(148,163,184,0.75)",fontSize:15,lineHeight:1.7,maxWidth:360},children:["Trade stocks, split bills, track goals, battle friends —",e.jsx("br",{}),"all with AI-powered intelligence built for Indian students."]})]}),e.jsx("div",{className:`relative z-10 ${d?"fb-animate-left":"opacity-0"}`,style:{animationDelay:"0.18s",display:"flex",flexDirection:"column",gap:10},children:P.map((t,i)=>e.jsxs("div",{className:"fb-feature-item",children:[e.jsx("div",{style:{width:36,height:36,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,background:`${t.color}18`,border:`1px solid ${t.color}30`},children:t.icon}),e.jsx("span",{style:{fontSize:13.5,color:"#CBD5E1",fontWeight:500},children:t.text}),e.jsx("div",{style:{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:t.color,opacity:.7}})]},i))}),e.jsxs("div",{className:`relative z-10 ${d?"fb-animate-left":"opacity-0"}`,style:{animationDelay:"0.24s"},children:[e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20},children:q.map((t,i)=>e.jsxs("div",{className:"fb-stat",children:[e.jsx("div",{style:{fontSize:16,marginBottom:4},children:t.icon}),e.jsx("p",{style:{fontSize:17,fontWeight:900,margin:0,background:"linear-gradient(135deg, #A78BFA, #EC4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:t.value}),e.jsx("p",{style:{fontSize:10,color:"rgba(100,116,139,0.9)",fontWeight:600,margin:"2px 0 0",textTransform:"uppercase",letterSpacing:"0.04em"},children:t.label})]},i))}),e.jsxs("div",{className:"fb-quote",children:[e.jsx("p",{style:{color:"rgba(148,163,184,0.75)",fontSize:13.5,fontStyle:"italic",lineHeight:1.65,margin:0},children:'"The best investment you can make is in yourself — start with your money habits."'}),e.jsx("p",{style:{fontSize:11,color:"#A78BFA",fontWeight:700,margin:"10px 0 0",letterSpacing:"0.03em"},children:"— FinBuddy AI Mentor"})]})]})]}),e.jsxs("div",{className:"fb-right",children:[e.jsx("div",{style:{position:"absolute",top:0,right:0,width:400,height:400,borderRadius:"50%",filter:"blur(120px)",background:"rgba(124,58,237,0.09)",pointerEvents:"none"}}),e.jsx("div",{style:{position:"absolute",bottom:0,left:0,width:350,height:350,borderRadius:"50%",filter:"blur(100px)",background:"rgba(236,72,153,0.07)",pointerEvents:"none"}}),e.jsx("div",{style:{position:"absolute",top:"40%",left:"30%",width:200,height:200,borderRadius:"50%",filter:"blur(80px)",background:"rgba(6,182,212,0.05)",pointerEvents:"none"}}),e.jsx("div",{className:"lg:hidden",style:{marginBottom:28,textAlign:"center"},children:e.jsxs(g,{to:"/",style:{display:"inline-flex",alignItems:"center",gap:10,textDecoration:"none"},children:[e.jsx("div",{className:"fb-logo-icon",style:{width:36,height:36,fontSize:17},children:"💰"}),e.jsx("span",{className:"fb-logo-text",style:{fontSize:22},children:"FinBuddy"})]})}),e.jsx("div",{className:`fb-card ${d?"fb-animate-card":"opacity-0"}`,children:S?e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:72,height:72,borderRadius:20,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,background:"linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.18))",border:"1px solid rgba(124,58,237,0.4)",boxShadow:"0 8px 24px rgba(124,58,237,0.2)"},children:"🔐"}),e.jsx("h2",{style:{fontSize:26,fontWeight:900,color:"#F8FAFC",margin:"0 0 8px",letterSpacing:"-0.4px"},children:"Two-Factor Auth"}),e.jsx("p",{style:{color:"rgba(100,116,139,0.85)",fontSize:14,margin:"0 0 28px"},children:"Enter the 6-digit OTP sent to your email"}),e.jsxs("form",{onSubmit:M,id:"otp-form",children:[e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:28},children:h.map((t,i)=>e.jsx("input",{id:`otp-digit-${i}`,ref:l[i],type:"text",inputMode:"numeric",maxLength:1,value:t,onChange:a=>T(i,a.target.value),onKeyDown:a=>R(i,a),className:`fb-otp-box${t?" filled":""}`},i))}),e.jsx("button",{type:"submit",className:"fb-btn-primary",disabled:c||v.length!==6,children:c?e.jsxs("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10},children:[e.jsx("span",{style:{width:16,height:16,border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"fb-spin 0.7s linear infinite",display:"inline-block"}}),"Verifying..."]}):"Verify & Enter 🚀"}),e.jsx("button",{type:"button",className:"fb-btn-back",onClick:()=>{w(!1),m(["","","","","",""]),x("")},children:"← Back to Login"})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{marginBottom:28},children:[e.jsx("h1",{style:{fontSize:30,fontWeight:900,color:"#F8FAFC",letterSpacing:"-0.5px",margin:0},children:"Welcome back 👋"}),e.jsx("p",{style:{color:"rgba(100,116,139,0.9)",marginTop:6,fontSize:14,fontWeight:400},children:"Log in to your financial command center"})]}),e.jsxs("button",{id:"google-login-btn",onClick:L,className:"fb-btn-google",children:[e.jsxs("svg",{width:"19",height:"19",viewBox:"0 0 24 24",children:[e.jsx("path",{fill:"#4285F4",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),e.jsx("path",{fill:"#34A853",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),e.jsx("path",{fill:"#FBBC05",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),e.jsx("path",{fill:"#EA4335",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),"Continue with Google"]}),e.jsxs("div",{className:"fb-divider",children:[e.jsx("div",{className:"fb-divider-line"}),e.jsx("span",{className:"fb-divider-text",children:"or email"}),e.jsx("div",{className:"fb-divider-line"})]}),e.jsxs("form",{onSubmit:W,id:"login-form",style:{display:"flex",flexDirection:"column",gap:16},children:[e.jsxs("div",{children:[e.jsx("label",{className:"fb-label",htmlFor:"login-email",children:"Email Address"}),e.jsx("div",{className:"fb-input-wrap",children:e.jsx("input",{id:"login-email",type:"email",className:"fb-input",placeholder:"you@college.edu",value:n.email,onChange:t=>j({...n,email:t.target.value}),onFocus:()=>b("email"),onBlur:()=>b(null),required:!0,autoComplete:"email"})})]}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[e.jsx("label",{className:"fb-label",htmlFor:"login-password",style:{margin:0},children:"Password"}),e.jsx(g,{to:"/forgot-password",style:{fontSize:12,color:"#8B5CF6",fontWeight:600,textDecoration:"none"},onMouseOver:t=>t.target.style.color="#A78BFA",onMouseOut:t=>t.target.style.color="#8B5CF6",children:"Forgot?"})]}),e.jsxs("div",{className:"fb-input-wrap",children:[e.jsx("input",{id:"login-password",type:u?"text":"password",className:"fb-input",style:{paddingRight:48},placeholder:"••••••••",value:n.password,onChange:t=>j({...n,password:t.target.value}),onFocus:()=>b("password"),onBlur:()=>b(null),required:!0,autoComplete:"current-password"}),e.jsx("button",{type:"button",className:"fb-btn-eye",onClick:()=>D(!u),tabIndex:-1,children:u?e.jsxs("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("path",{d:"M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"}),e.jsx("path",{d:"M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"}),e.jsx("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}):e.jsxs("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),e.jsx("circle",{cx:"12",cy:"12",r:"3"})]})})]})]}),e.jsx("button",{id:"login-submit-btn",type:"submit",className:"fb-btn-primary",disabled:c,style:{marginTop:4},children:c?e.jsxs("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10},children:[e.jsx("span",{style:{width:16,height:16,border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"fb-spin 0.7s linear infinite",display:"inline-block"}}),"Signing in..."]}):e.jsxs("span",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:["Sign In",e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:e.jsx("path",{d:"M5 12h14M12 5l7 7-7 7"})})]})})]}),e.jsxs("div",{style:{marginTop:24,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.06)",textAlign:"center"},children:[e.jsxs("p",{style:{fontSize:13.5,color:"rgba(100,116,139,0.85)",margin:0},children:["No account yet?"," ",e.jsx(g,{to:"/register",style:{color:"#A78BFA",fontWeight:700,textDecoration:"none"},onMouseOver:t=>t.target.style.color="#C4B5FD",onMouseOut:t=>t.target.style.color="#A78BFA",children:"Create free account →"})]}),e.jsxs("div",{className:"fb-security",style:{justifyContent:"center",marginTop:12,display:"inline-flex"},children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"#34D399",strokeWidth:"2.5",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2"}),e.jsx("path",{d:"M7 11V7a5 5 0 0110 0v4"})]}),e.jsx("span",{style:{fontSize:11.5,color:"rgba(52,211,153,0.8)",fontWeight:600},children:"256-bit encrypted · Zero data sold"})]})]})]})})]})]})};export{K as default};
