import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  storeName: string;
  storeSlug: string;
  onDismiss: () => void;
};

export function StoreApprovedModal({ storeName, storeSlug, onDismiss }: Props) {
  const navigate = useNavigate();
  const hasMarked = useRef(false);

  useEffect(() => {
    if (hasMarked.current) return;
    hasMarked.current = true;
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(31,42,36,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @keyframes pop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
        @keyframes rise { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes confetti-fall {
          0%{transform:translateY(-10px) rotate(0deg);opacity:1}
          100%{transform:translateY(380px) rotate(720deg);opacity:0}
        }
        .approval-modal { animation: rise .35s ease both; }
        .approval-icon { animation: pop .4s cubic-bezier(.34,1.56,.64,1) .1s both; }
        .approval-title { animation: rise .35s ease .15s both; opacity: 0; }
        .approval-sub { animation: rise .35s ease .22s both; opacity: 0; }
        .approval-chip { animation: rise .35s ease .28s both; opacity: 0; }
        .approval-cta { animation: rise .35s ease .34s both; opacity: 0; }
        .approval-ghost { animation: rise .35s ease .4s both; opacity: 0; }
        .approval-note { animation: rise .35s ease .46s both; opacity: 0; }
        .confetti-dot { position: absolute; border-radius: 50%; animation: confetti-fall linear forwards; }
        .approval-cta-btn:hover { opacity: 0.9; }
        .approval-ghost-btn:hover { background: #F0ECE2 !important; }
      `}</style>

      <div
        className="approval-modal"
        style={{
          background: '#FFFFFF', border: '1px solid #E4DCC9',
          borderRadius: '20px', padding: '36px 32px',
          maxWidth: '400px', width: '100%',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Confetti */}
        {[...Array(28)].map((_, i) => {
          const colors = ['#2F6F4F', '#5DCAA5', '#D97B3F', '#7B5EA7', '#E4DCC9', '#1D9E75'];
          const size = 6 + Math.random() * 6;
          return (
            <div
              key={i}
              className="confetti-dot"
              style={{
                left: `${Math.random() * 100}%`,
                top: 0,
                width: `${size}px`,
                height: `${size}px`,
                background: colors[i % colors.length],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 1.2}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            />
          );
        })}

        {/* Icon */}
        <div
          className="approval-icon"
          style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#E3EEE6', border: '2px solid #A3CCAA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F6F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        {/* Title */}
        <h2
          className="approval-title"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', color: '#1F2A24', margin: '0 0 8px' }}
        >
          Your store is approved!
        </h2>

        {/* Subtitle */}
        <p
          className="approval-sub"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8A8273', margin: '0 0 20px', lineHeight: 1.6 }}
        >
          Congrats! <strong style={{ color: '#1F2A24' }}>{storeName}</strong> is now live on Shopit and ready to start selling.
        </p>

        {/* Store chip */}
        <div
          className="approval-chip"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#E3EEE6', border: '1px solid #A3CCAA',
            color: '#2F6F4F', borderRadius: '999px',
            padding: '5px 14px', fontSize: '12px',
            fontFamily: "'IBM Plex Mono', monospace",
            marginBottom: '24px',
          }}
        >
          🏪 /stores/{storeSlug}
        </div>

        {/* CTA button */}
        <button
          className="approval-cta approval-cta-btn"
          onClick={() => navigate('/seller/products')}
          style={{
            display: 'block', width: '100%', padding: '14px',
            borderRadius: '12px', border: 'none',
            background: '#2F6F4F', color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600,
            cursor: 'pointer', marginBottom: '10px',
            transition: 'opacity 0.15s',
          }}
        >
          Create products →
        </button>

        {/* Ghost button */}
        <button
          className="approval-ghost approval-ghost-btn"
          onClick={onDismiss}
          style={{
            display: 'block', width: '100%', padding: '12px',
            borderRadius: '12px', border: '1px solid #E4DCC9',
            background: '#FFFFFF', color: '#8A8273',
            fontFamily: "'Inter', sans-serif", fontSize: '14px',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          Go to dashboard
        </button>

        <p
          className="approval-note"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#A89F8B', marginTop: '12px' }}
        >
          Shoppers can now find your store at{' '}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>/stores/{storeSlug}</span>
        </p>
      </div>
    </div>
  );
}