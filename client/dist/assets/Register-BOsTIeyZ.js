import{al as w,aa as n,ae as N,ai as C,a4 as e,e as x,aq as g}from"./index-DceS-60z.js";const A=s=>{if(!s)return{score:0,label:"",color:""};let t=0;return s.length>=8&&t++,/[A-Z]/.test(s)&&t++,/[0-9]/.test(s)&&t++,/[^A-Za-z0-9]/.test(s)&&t++,[{score:1,label:"Weak",color:"#F87171"},{score:2,label:"Fair",color:"#FB923C"},{score:3,label:"Good",color:"#FBBF24"},{score:4,label:"Strong",color:"#34D399"}].find(i=>i.score===t)||{score:0,label:"",color:""}},F=({icon:s,text:t})=>e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 rounded-xl reg-badge",children:[e.jsx("span",{className:"text-base",children:s}),e.jsx("span",{className:"text-xs font-semibold text-slate-300",children:t})]}),E=[{icon:"💰",text:"₹1,00,000 Virtual Wallet"},{icon:"📈",text:"Live Stock Trading"},{icon:"💸",text:"Smart Bill Splitting"},{icon:"🤖",text:"AI Financial Mentor"},{icon:"⚔️",text:"Friend Battle Mode"},{icon:"🔒",text:"100% Data Encrypted"}],S=()=>{const[s]=w(),[t,r]=n.useState({name:"",email:"",password:"",college:"",yearOfStudy:"",referralCode:s.get("ref")||""}),[i,p]=n.useState(!1),[c,m]=n.useState(!1),[l,u]=n.useState(1),{register:h}=N(),f=C(),o=A(t.password);n.useEffect(()=>{const a=document.documentElement.classList.contains("light");return a&&document.documentElement.classList.remove("light"),()=>{a&&document.documentElement.classList.add("light")}},[]);const j=t.name.trim().length>=2&&/\S+@\S+\.\S+/.test(t.email)&&t.password.length>=6,v=async a=>{var d,b;if(a.preventDefault(),t.password.length<6){g.error("Password must be at least 6 characters");return}p(!0);try{await h(t),f("/dashboard")}catch(y){g.error(((b=(d=y.response)==null?void 0:d.data)==null?void 0:b.message)||"Registration failed")}finally{p(!1)}},k=()=>{"397045021332-ljlfq9bf9mhhbmhmdr54h4nj62qj8lkr.apps.googleusercontent.com".includes("dummy")?(g.success("Sandbox Mode: Simulated Google Auth…",{icon:"🔑",duration:2500}),setTimeout(()=>{window.location.href="/api/auth/google/mock"},900)):window.location.href="/api/auth/google"};return e.jsxs("div",{id:"register-page",className:"min-h-screen flex",style:{background:"var(--bg-primary)",fontFamily:"'Inter', sans-serif"},children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes slide-up-reg {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes shimmer-reg {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .reg-card {
          animation: slide-up-reg 0.55s cubic-bezier(.22,1,.36,1) both;
          padding: 40px 36px;
          border-radius: 28px;
          background: rgba(13, 11, 26, 0.75);
          border: 1.5px solid rgba(139, 92, 246, 0.25);
          backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 40px rgba(124, 58, 237, 0.05);
        }
        @media (max-width: 480px) { .reg-card { padding: 28px 20px; border-radius: 20px; } }

        .reg-badge {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background .2s, border-color .2s;
        }
        .reg-badge:hover {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.3);
        }
        .reg-input {
          width: 100%;
          background: rgba(8, 8, 16, 0.6);
          border: 1.5px solid rgba(139, 92, 246, 0.2);
          border-radius: 14px;
          padding: 13px 16px;
          color: #f8fafc;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .reg-input:focus {
          border-color: rgba(139, 92, 246, 0.85);
          background: rgba(139, 92, 246, 0.08);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }
        .reg-input::placeholder { color: rgba(148, 163, 184, 0.4); }
        .reg-input:-webkit-autofill,
        .reg-input:-webkit-autofill:hover,
        .reg-input:-webkit-autofill:focus,
        .reg-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0c0a1a inset !important;
          -webkit-text-fill-color: #f8fafc !important;
          transition: background-color 9999s ease-in-out 0s;
          border-color: rgba(139, 92, 246, 0.5) !important;
        }
        .reg-select {
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .reg-select option { background: #1A1928; color: #F8FAFC; }
        .btn-reg-primary {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #7C3AED 0%, #9333ea 50%, #EC4899 100%);
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          position: relative;
          overflow: hidden;
          transition: transform .15s, box-shadow .15s, opacity .15s;
          letter-spacing: 0.3px;
        }
        .btn-reg-primary:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 32px rgba(124,58,237,0.45);
        }
        .btn-reg-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-reg-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 400px;
          animation: shimmer-reg 2.5s infinite;
        }
        .btn-reg-secondary {
          width: 100%;
          padding: 13px 24px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          color: #94A3B8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }
        .btn-reg-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .step-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: all .3s;
        }
        .step-dot.active {
          width: 24px;
          border-radius: 4px;
          background: linear-gradient(90deg, #7C3AED, #EC4899);
        }
        .strength-bar {
          height: 3px;
          border-radius: 2px;
          transition: width .4s, background .4s;
        }
        .google-reg-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          color: #E2E8F0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }
        .google-reg-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }
      `}),e.jsxs("div",{className:"hidden lg:flex lg:w-[50%] flex-col justify-between relative overflow-hidden p-12",style:{background:"radial-gradient(ellipse at 25% 50%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.16) 0%, transparent 50%), linear-gradient(135deg, #08080F 0%, #0E0D18 60%, #12111A 100%)"},children:[e.jsx("div",{className:"absolute inset-0 opacity-[0.03] pointer-events-none",style:{backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)",backgroundSize:"48px 48px"}}),e.jsx("div",{className:"absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[100px] pointer-events-none",style:{background:"rgba(124,58,237,0.16)",animation:"glow-pulse 8s ease-in-out infinite"}}),e.jsx("div",{className:"absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full blur-[80px] pointer-events-none",style:{background:"rgba(236,72,153,0.12)"}}),e.jsx("div",{className:"relative z-10",children:e.jsxs(x,{to:"/",className:"inline-flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl flex items-center justify-center text-xl",style:{background:"linear-gradient(135deg, #7C3AED, #EC4899)"},children:"💰"}),e.jsx("span",{className:"text-2xl font-black",style:{background:"linear-gradient(135deg, #A78BFA, #F472B6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:"FinBuddy"})]})}),e.jsxs("div",{className:"relative z-10 space-y-8",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4",style:{background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)"},children:[e.jsx("span",{className:"w-2 h-2 rounded-full",style:{background:"#34D399",animation:"glow-pulse 1.5s infinite"}}),e.jsx("span",{className:"text-xs font-bold uppercase tracking-widest text-emerald-400",children:"Free Forever · No Credit Card"})]}),e.jsxs("h2",{className:"text-5xl font-black leading-[1.1] text-white",children:["Join 18,000+",e.jsx("br",{}),e.jsx("span",{style:{background:"linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #22D3EE 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:"smart students."})]}),e.jsx("p",{className:"mt-4 text-slate-400 text-sm leading-relaxed max-w-sm",children:"Build real financial literacy with virtual money, live markets, AI guidance, and a community that grows your wealth IQ."})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:E.map((a,d)=>e.jsx(F,{...a},d))}),e.jsxs("div",{className:"p-5 rounded-2xl relative overflow-hidden",style:{background:"linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 100%)",border:"1px solid rgba(124,58,237,0.35)"},children:[e.jsx("div",{className:"absolute top-2 right-3 text-2xl opacity-30",children:"💰"}),e.jsx("p",{className:"text-xs font-bold uppercase tracking-widest text-purple-300 mb-1",children:"Your Starter Wallet"}),e.jsx("p",{className:"text-4xl font-black text-white",children:"₹1,00,000"}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"Virtual funds · Instantly on signup · Trade real markets"}),e.jsxs("div",{className:"mt-3 flex items-center gap-2",children:[e.jsx("div",{className:"w-2 h-2 rounded-full",style:{background:"#34D399",animation:"glow-pulse 1.5s infinite"}}),e.jsx("span",{className:"text-xs text-emerald-400 font-semibold",children:"Markets open · Live prices"})]})]})]}),e.jsxs("div",{className:"relative z-10 p-4 rounded-2xl",style:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"},children:[e.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[e.jsx("div",{className:"w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",style:{background:"linear-gradient(135deg, #7C3AED, #EC4899)",color:"#fff"},children:"A"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-bold text-white",children:"Arjun V., IIT Madras"}),e.jsx("div",{className:"text-yellow-400 text-xs",children:"★★★★★"})]})]}),e.jsx("p",{className:"text-slate-400 text-xs leading-relaxed",children:'"FinBuddy made me understand markets better than 3 years of finance classes. The AI mentor is insane!"'})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden",style:{background:"#0A0912"},children:[e.jsx("div",{className:"absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none",style:{background:"rgba(124,58,237,0.07)"}}),e.jsx("div",{className:"absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none",style:{background:"rgba(236,72,153,0.05)"}}),e.jsx("div",{className:"lg:hidden mb-6 text-center",children:e.jsxs(x,{to:"/",className:"inline-flex items-center gap-2",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl flex items-center justify-center text-lg",style:{background:"linear-gradient(135deg, #7C3AED, #EC4899)"},children:"💰"}),e.jsx("span",{className:"text-2xl font-black",style:{background:"linear-gradient(135deg, #A78BFA, #F472B6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:"FinBuddy"})]})}),e.jsxs("div",{className:"reg-card w-full max-w-[420px] relative z-10",children:[e.jsxs("div",{className:"mb-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h1",{className:"text-3xl font-black text-white",children:l===1?"Create Account 🚀":"Almost done! 🎯"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("div",{className:`step-dot ${l>=1?"active":""}`}),e.jsx("div",{className:`step-dot ${l>=2?"active":""}`})]})]}),e.jsx("p",{className:"text-slate-400 text-sm",children:l===1?"Start your financial intelligence journey":"Optional details to personalize your experience"})]}),t.referralCode&&e.jsxs("div",{className:"mb-4 p-3 rounded-xl flex items-center gap-3",style:{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)"},children:[e.jsx("span",{className:"text-lg",children:"🎁"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-emerald-400",children:"Referral Bonus Applied!"}),e.jsx("p",{className:"text-xs text-slate-400",children:"+₹10,000 extra virtual money on signup"})]})]}),l===1&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{id:"google-register-btn",onClick:k,className:"google-reg-btn mb-4",children:[e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",children:[e.jsx("path",{fill:"#4285F4",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),e.jsx("path",{fill:"#34A853",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),e.jsx("path",{fill:"#FBBC05",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),e.jsx("path",{fill:"#EA4335",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),"Sign up with Google"]}),e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx("div",{className:"flex-1 h-px",style:{background:"rgba(255,255,255,0.07)"}}),e.jsx("span",{className:"text-xs text-slate-600 font-semibold uppercase tracking-wider",children:"or email"}),e.jsx("div",{className:"flex-1 h-px",style:{background:"rgba(255,255,255,0.07)"}})]})]}),l===1&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:"Full Name"}),e.jsx("input",{id:"reg-name",className:"reg-input",placeholder:"Arjun Kumar",value:t.name,onChange:a=>r({...t,name:a.target.value}),required:!0,autoComplete:"name"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:"Email Address"}),e.jsx("input",{id:"reg-email",type:"email",className:"reg-input",placeholder:"you@college.edu",value:t.email,onChange:a=>r({...t,email:a.target.value}),required:!0,autoComplete:"email"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:"Password"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{id:"reg-password",type:c?"text":"password",className:"reg-input pr-12",placeholder:"Min 6 characters",value:t.password,onChange:a=>r({...t,password:a.target.value}),required:!0,autoComplete:"new-password"}),e.jsx("button",{type:"button",onClick:()=>m(!c),className:"absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors",children:c?"🙈":"👁️"})]}),t.password&&e.jsxs("div",{className:"mt-2",children:[e.jsx("div",{className:"flex gap-1 mb-1",children:[1,2,3,4].map(a=>e.jsx("div",{className:"strength-bar flex-1",style:{background:a<=o.score?o.color:"rgba(255,255,255,0.08)"}},a))}),e.jsx("p",{className:"text-xs font-semibold",style:{color:o.color},children:o.label})]})]}),e.jsx("button",{id:"reg-next-btn",type:"button",className:"btn-reg-primary",disabled:!j,onClick:()=>u(2),children:"Continue →"})]}),l===2&&e.jsxs("form",{id:"register-form",onSubmit:v,className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:"College"}),e.jsx("input",{id:"reg-college",className:"reg-input",placeholder:"VIT, IIT, Anna…",value:t.college,onChange:a=>r({...t,college:a.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:"Year"}),e.jsxs("select",{id:"reg-year",className:"reg-input reg-select",value:t.yearOfStudy,onChange:a=>r({...t,yearOfStudy:a.target.value}),children:[e.jsx("option",{value:"",children:"Select"}),e.jsx("option",{value:"1",children:"1st Year"}),e.jsx("option",{value:"2",children:"2nd Year"}),e.jsx("option",{value:"3",children:"3rd Year"}),e.jsx("option",{value:"4",children:"4th Year"}),e.jsx("option",{value:"5",children:"PG"})]})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2",children:["Referral Code ",e.jsx("span",{className:"text-slate-600 normal-case font-normal",children:"(optional)"})]}),e.jsx("input",{id:"reg-referral",className:"reg-input",placeholder:"e.g. AB12CD",value:t.referralCode,onChange:a=>r({...t,referralCode:a.target.value.toUpperCase()})})]}),e.jsxs("div",{className:"p-3 rounded-xl flex items-center gap-3",style:{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)"},children:[e.jsx("span",{className:"text-2xl",children:"🎁"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-bold text-purple-300",children:"₹1,00,000 Virtual Wallet"}),e.jsx("p",{className:"text-xs text-slate-500",children:"Credited instantly on signup · No strings attached"})]})]}),e.jsx("button",{id:"reg-submit-btn",type:"submit",className:"btn-reg-primary",disabled:i,children:i?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsx("span",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"Creating account..."]}):"Create Free Account 🚀"}),e.jsx("button",{type:"button",className:"btn-reg-secondary",onClick:()=>u(1),children:"← Back"})]}),e.jsxs("div",{className:"mt-6 pt-5 border-t flex flex-col items-center gap-2",style:{borderColor:"rgba(255,255,255,0.06)"},children:[e.jsxs("p",{className:"text-sm text-slate-500",children:["Already have an account?"," ",e.jsx(x,{to:"/login",className:"font-bold",style:{color:"#A78BFA"},children:"Log in"})]}),e.jsx("p",{className:"text-xs text-slate-700 text-center",children:"By continuing, you agree to our Terms of Service & Privacy Policy"})]})]})]})]})};export{S as default};
