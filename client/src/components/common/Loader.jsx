// client/src/components/common/Loader.jsx
const Loader = ({ size = 'md', text = '', fullScreen = false }) => {
  const sizes = {
    sm: { ring: 'w-6 h-6', border: 'border-2' },
    md: { ring: 'w-10 h-10', border: 'border-[3px]' },
    lg: { ring: 'w-16 h-16', border: 'border-4' }
  };
  const { ring, border } = sizes[size] || sizes.md;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Outer glow */}
        <div
          className={`${ring} rounded-full absolute inset-0 blur-sm opacity-40`}
          style={{ background: 'conic-gradient(#7C3AED, #EC4899, transparent)' }}
        />
        {/* Spinning ring */}
        <div
          className={`${ring} ${border} rounded-full`}
          style={{
            borderColor: 'rgba(124,58,237,0.25)',
            borderTopColor: '#7C3AED',
            borderRightColor: '#9333ea',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      </div>
      {text && (
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: '#A78BFA', animation: 'pulse 2s ease-in-out infinite' }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, #08080F 70%)'
        }}
      >
        <div className="text-center space-y-5">
          {/* Animated logo */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            💰
          </div>
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="flex-1 flex items-center justify-center py-20">
    <Loader size="md" text={text} />
  </div>
);

export const InlineLoader = () => (
  <div className="flex justify-center py-8">
    <Loader size="sm" />
  </div>
);

export default Loader;
