import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Shopit landing page — the public front door shown at "/".
// Visual design generated in Claude Design and converted to React here.
// CTAs are wired to the real app routes (/products, /login, /register).
// Animations (scroll reveals, magnetic buttons, hero parallax, SVG line draw)
// are driven by a single useEffect and respect prefers-reduced-motion.
// ---------------------------------------------------------------------------

const KEYFRAMES = `
@keyframes shopit-riseIn { from { opacity: 0; transform: translateY(46px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
@keyframes shopit-floatY { 0% { transform: translateY(0); } 50% { transform: translateY(-22px); } 100% { transform: translateY(0); } }
@keyframes shopit-floatYb { 0% { transform: translateY(0); } 50% { transform: translateY(18px); } 100% { transform: translateY(0); } }
@keyframes shopit-glowPulse { 0%,100% { opacity: .35; transform: scale(1); } 50% { opacity: .9; transform: scale(1.12); } }
@keyframes shopit-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes shopit-haloBreathe { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
.shopit-lp a { text-decoration: none; }
.shopit-lp [data-magnetic] { transition: transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s ease; }
@media (prefers-reduced-motion: reduce) {
  .shopit-lp *, .shopit-lp *::before, .shopit-lp *::after { animation: none !important; }
}
`;

type Tile = { name: string; cat: string; tag: string };
const BASE_TILES: Tile[] = [
  { name: 'Linen Shirt', cat: 'Fashion', tag: 'Best Seller' },
  { name: 'Wireless Buds', cat: 'Electronics', tag: '-30%' },
  { name: 'Leather Tote', cat: 'Accessories', tag: 'Hot Deal' },
  { name: 'Ceramic Vase', cat: 'Home & Lifestyle', tag: 'New' },
  { name: 'Smart Watch', cat: 'Electronics', tag: '-25%' },
  { name: 'Knit Sweater', cat: 'Fashion', tag: 'Best Seller' },
  { name: 'Desk Lamp', cat: 'Home & Lifestyle', tag: 'Hot Deal' },
];
const TILES = [...BASE_TILES, ...BASE_TILES];

type Quote = { text: string; name: string; shop: string; c1: string; c2: string; delay: number; offset: string };
const QUOTES: Quote[] = [
  { text: "Fast shipping and the prices just can't be beat.", name: 'Maya R.', shop: 'Verified buyer', c1: '#22C55E', c2: '#15803D', delay: 0, offset: '0px' },
  { text: 'My go-to store for pretty much everything now.', name: 'Devin O.', shop: 'Verified buyer', c1: '#4ADE80', c2: '#22C55E', delay: 130, offset: '32px' },
  { text: 'Checkout was instant and my order arrived early.', name: 'Tariq B.', shop: 'Verified buyer', c1: '#16A34A', c2: '#15803D', delay: 260, offset: '12px' },
];

const mono = "'IBM Plex Mono', monospace";
const serif = "'Fraunces', serif";

const revealStyle: CSSProperties = {
  opacity: 0,
  transform: 'translateY(40px)',
  filter: 'blur(6px)',
  transition: 'opacity .9s ease, transform .9s cubic-bezier(.2,.7,.2,1), filter .9s ease',
};

const eyebrow: CSSProperties = {
  fontFamily: mono,
  fontSize: '11.5px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: '#15803D',
  marginBottom: '18px',
};

function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = root.querySelectorAll<HTMLElement>('[data-reveal]');

    if (reduce) {
      reveals.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
      return;
    }

    // scroll reveals
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement;
            const d = parseFloat(el.getAttribute('data-delay') || '0');
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'none';
              el.style.filter = 'none';
            }, d);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));

    // magnetic buttons
    const magnets: Array<[HTMLElement, (e: MouseEvent) => void, () => void]> = [];
    root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
      const move = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.3}px,${y * 0.45}px)`;
      };
      const leave = () => {
        btn.style.transform = 'translate(0,0)';
      };
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      magnets.push([btn, move, leave]);
    });

    // hero pointer parallax
    const hero = root.querySelector<HTMLElement>('[data-hero]');
    const floats = root.querySelectorAll<HTMLElement>('[data-depth]');
    const heroMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      floats.forEach((f) => {
        const d = parseFloat(f.getAttribute('data-depth') || '1');
        f.style.transform = `translate(${dx * d * -16}px,${dy * d * -16}px)`;
      });
    };
    if (hero) hero.addEventListener('mousemove', heroMove);

    // SVG line draw on scroll
    const path = root.querySelector<SVGPathElement>('[data-draw]');
    const howSec = root.querySelector<HTMLElement>('[data-howitworks]');
    let onScroll: (() => void) | null = null;
    if (path && howSec) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      const draw = () => {
        const r = howSec.getBoundingClientRect();
        const vh = window.innerHeight;
        let p = (vh * 0.85 - r.top) / (vh * 0.55);
        p = Math.max(0, Math.min(1, p));
        path.style.strokeDashoffset = String(len * (1 - p));
        path.style.opacity = (0.3 + p * 0.7).toFixed(3);
      };
      onScroll = () => window.requestAnimationFrame(draw);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      draw();
    }

    return () => {
      io.disconnect();
      magnets.forEach(([btn, move, leave]) => {
        btn.removeEventListener('mousemove', move);
        btn.removeEventListener('mouseleave', leave);
      });
      if (hero) hero.removeEventListener('mousemove', heroMove);
      if (onScroll) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="shopit-lp"
      style={{
        position: 'relative',
        background:
          'radial-gradient(1200px 800px at 75% -5%, #E6F6EC 0%, rgba(230,246,236,0) 55%), radial-gradient(1000px 700px at 0% 30%, #EAF7EE 0%, rgba(234,247,238,0) 50%), #F6FAF7',
        color: '#1C3527',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowX: 'hidden',
        minWidth: '320px',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ============ NAV ============ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px clamp(20px, 5vw, 64px)',
          backdropFilter: 'blur(14px)',
          background: 'linear-gradient(180deg, rgba(246,250,247,.92), rgba(246,250,247,.55))',
          borderBottom: '1px solid rgba(34,197,94,.16)',
        }}
      >
        <Wordmark size={26} />
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 36px)',
            fontSize: '14.5px',
            fontWeight: 500,
            color: '#5B7567',
          }}
        >
          <Link to="/products" style={{ color: '#5B7567' }}>Shop</Link>
          <a href="#sellers" style={{ color: '#5B7567' }}>Why Shopit</a>
          <a href="#reviews" style={{ color: '#5B7567' }}>Reviews</a>
          <Link
            to="/login"
            style={{ color: '#5B7567' }}
          >
            Sign in
          </Link>
          <Link
            to="/products"
            data-magnetic
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #22C55E, #15803D)',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(22,163,74,.28)',
            }}
          >
            Start Shopping
          </Link>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section
        data-hero
        style={{
          position: 'relative',
          minHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px clamp(20px, 5vw, 64px) 110px',
          overflow: 'hidden',
        }}
      >
        {/* ambient glow blobs */}
        <div style={{ position: 'absolute', top: '8%', left: '12%', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,.16), transparent 65%)', filter: 'blur(20px)', animation: 'shopit-haloBreathe 7s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '4%', right: '8%', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,128,61,.14), transparent 65%)', filter: 'blur(24px)', animation: 'shopit-haloBreathe 9s ease-in-out infinite .8s', pointerEvents: 'none' }} />

        {/* floating ticket stubs (parallax) */}
        <div data-depth="2.2" style={{ position: 'absolute', top: '16%', left: '7%', width: '158px', transform: 'rotate(-9deg)', animation: 'shopit-floatY 8s ease-in-out infinite', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', padding: '14px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid rgba(34,197,94,.22)', boxShadow: '0 18px 44px rgba(20,60,38,.14), 0 0 22px rgba(34,197,94,.10)' }}>
            <div style={{ height: '78px', borderRadius: '8px', background: 'repeating-linear-gradient(45deg, rgba(34,197,94,.07) 0 7px, rgba(34,197,94,.02) 7px 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: '9px', color: '#8AA394', letterSpacing: '.5px' }}>product shot</div>
            <div style={{ marginTop: '9px', fontFamily: mono, fontSize: '9px', letterSpacing: '1px', color: '#16A34A' }}>ADMIT · ONE</div>
          </div>
        </div>
        <div data-depth="1.4" style={{ position: 'absolute', top: '22%', right: '9%', width: '140px', transform: 'rotate(7deg)', animation: 'shopit-floatYb 10s ease-in-out infinite .5s', pointerEvents: 'none' }}>
          <div style={{ padding: '13px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid rgba(52,211,153,.3)', boxShadow: '0 18px 44px rgba(20,60,38,.14), 0 0 22px rgba(21,128,61,.10)' }}>
            <div style={{ height: '64px', borderRadius: '8px', background: 'repeating-linear-gradient(45deg, rgba(34,197,94,.07) 0 7px, rgba(34,197,94,.02) 7px 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: '9px', color: '#8AA394' }}>deal card</div>
            <div style={{ marginTop: '8px', height: '5px', width: '60%', borderRadius: '3px', background: 'rgba(91,117,103,.35)' }} />
          </div>
        </div>
        <div data-depth="3" style={{ position: 'absolute', bottom: '16%', left: '13%', width: '120px', transform: 'rotate(6deg)', animation: 'shopit-floatY 11s ease-in-out infinite 1.2s', pointerEvents: 'none' }}>
          <div style={{ padding: '11px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid rgba(74,222,128,.32)', boxShadow: '0 14px 36px rgba(20,60,38,.14), 0 0 18px rgba(74,222,128,.10)' }}>
            <div style={{ height: '52px', borderRadius: '7px', background: 'repeating-linear-gradient(45deg, rgba(34,197,94,.07) 0 7px, rgba(34,197,94,.02) 7px 14px)' }} />
            <div style={{ marginTop: '7px', fontFamily: mono, fontSize: '8px', letterSpacing: '1px', color: '#16A34A' }}>№ 0042</div>
          </div>
        </div>
        <div data-depth="1.8" style={{ position: 'absolute', bottom: '22%', right: '13%', width: '96px', height: '96px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(21,128,61,.12))', border: '1px solid rgba(34,197,94,.3)', boxShadow: '0 10px 30px rgba(20,60,38,.12)', transform: 'rotate(-12deg)', animation: 'shopit-floatYb 9s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* particles */}
        <div style={{ position: 'absolute', top: '30%', left: '30%', width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px 2px rgba(34,197,94,.45)', animation: 'shopit-glowPulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', left: '22%', width: '5px', height: '5px', borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 10px 2px rgba(22,163,74,.45)', animation: 'shopit-glowPulse 5.5s ease-in-out infinite 1s', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '38%', right: '28%', width: '5px', height: '5px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px 2px rgba(74,222,128,.5)', animation: 'shopit-glowPulse 4.8s ease-in-out infinite .4s', pointerEvents: 'none' }} />

        {/* hero text */}
        <div style={{ position: 'relative', zIndex: 5, maxWidth: '980px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '7px 16px', borderRadius: '999px', border: '1px solid rgba(34,197,94,.35)', background: 'rgba(34,197,94,.08)', fontFamily: mono, fontSize: '11.5px', letterSpacing: '3px', textTransform: 'uppercase', color: '#15803D', marginBottom: '30px', animation: 'shopit-riseIn .8s cubic-bezier(.2,.7,.2,1) both' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />Your everyday store
          </div>

          <h1 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(42px, 8vw, 104px)', lineHeight: '.98', letterSpacing: '-2px', color: '#0C2417' }}>
            <span style={{ display: 'block' }}>
              <span style={{ display: 'inline-block', animation: 'shopit-riseIn .9s cubic-bezier(.2,.7,.2,1) both', animationDelay: '80ms' }}>Shop</span>{' '}
              <span style={{ display: 'inline-block', animation: 'shopit-riseIn .9s cubic-bezier(.2,.7,.2,1) both', animationDelay: '200ms', background: 'linear-gradient(135deg, #16A34A, #22C55E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>smarter.</span>
            </span>
            <span style={{ display: 'block' }}>
              <span style={{ display: 'inline-block', animation: 'shopit-riseIn .9s cubic-bezier(.2,.7,.2,1) both', animationDelay: '340ms' }}>Live</span>{' '}
              <span style={{ display: 'inline-block', animation: 'shopit-riseIn .9s cubic-bezier(.2,.7,.2,1) both', animationDelay: '460ms', fontStyle: 'italic', background: 'linear-gradient(135deg, #22C55E, #15803D)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>better.</span>
            </span>
          </h1>

          <p style={{ maxWidth: '560px', margin: '28px auto 0', fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.6, color: '#5B7567', animation: 'shopit-riseIn 1s cubic-bezier(.2,.7,.2,1) both', animationDelay: '620ms' }}>
            Your one-stop store for fashion, electronics, and everything in between — at prices you'll love.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '18px', marginTop: '40px', animation: 'shopit-riseIn 1s cubic-bezier(.2,.7,.2,1) both', animationDelay: '740ms' }}>
            <Link to="/products" data-magnetic style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '17px 34px', borderRadius: '999px', background: 'linear-gradient(135deg, #22C55E, #15803D)', color: '#fff', fontWeight: 600, fontSize: '16.5px', boxShadow: '0 10px 28px rgba(22,163,74,.32)' }}>
              Start Shopping <span style={{ fontSize: '18px' }}>→</span>
            </Link>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '17px 28px', borderRadius: '999px', border: '1px solid rgba(34,197,94,.4)', color: '#15803D', fontWeight: 600, fontSize: '16px' }}>
              Browse Deals
            </Link>
          </div>
        </div>
      </section>

      {/* ============ VALUE PROPOSITION ============ */}
      <section id="sellers" style={{ position: 'relative', padding: 'clamp(80px, 12vw, 150px) clamp(20px, 5vw, 64px)', maxWidth: '1240px', margin: '0 auto' }}>
        <div data-reveal style={{ ...revealStyle, textAlign: 'center', maxWidth: '760px', margin: '0 auto 64px' }}>
          <div style={eyebrow}>Why Shopit</div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(34px, 6vw, 68px)', lineHeight: 1.02, letterSpacing: '-1.5px', color: '#0C2417' }}>
            Shopping made <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #16A34A, #22C55E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>simple.</span>
          </h2>
          <p style={{ margin: '22px auto 0', maxWidth: '540px', fontSize: '18px', lineHeight: 1.6, color: '#5B7567' }}>Everything you need, nothing you don't.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '26px' }}>
          {[
            { icon: '⚡', title: 'Fast delivery', body: 'At your door in days, not weeks.', border: 'rgba(34,197,94,.2)', iconBg: 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(34,197,94,.04))', iconBorder: 'rgba(34,197,94,.4)', dash: 'rgba(34,197,94,.4)', stub: 'STUB · 01', delay: 0 },
            { icon: '★', title: 'Best prices', body: "Everyday low prices you won't beat.", border: 'rgba(52,211,153,.26)', iconBg: 'linear-gradient(135deg, rgba(52,211,153,.2), rgba(52,211,153,.04))', iconBorder: 'rgba(52,211,153,.45)', dash: 'rgba(52,211,153,.45)', stub: 'STUB · 02', delay: 100 },
            { icon: '🔒', title: 'Secure checkout', body: 'Pay safely with encrypted, one-tap checkout.', border: 'rgba(74,222,128,.28)', iconBg: 'linear-gradient(135deg, rgba(74,222,128,.2), rgba(74,222,128,.04))', iconBorder: 'rgba(74,222,128,.45)', dash: 'rgba(74,222,128,.45)', stub: 'STUB · 03', delay: 200 },
            { icon: '◆', title: 'Wide selection', body: 'Thousands of products across every category.', border: 'rgba(34,197,94,.22)', iconBg: 'linear-gradient(135deg, rgba(21,128,61,.22), rgba(34,197,94,.05))', iconBorder: 'rgba(34,197,94,.45)', dash: 'rgba(34,197,94,.4)', stub: 'STUB · 04', delay: 300 },
          ].map((c) => (
            <div key={c.stub} data-reveal data-delay={c.delay} style={{ ...revealStyle, transform: 'translateY(48px)' }}>
              <div style={{ position: 'relative', padding: '30px 28px 34px', borderRadius: '20px', background: '#FFFFFF', border: `1px solid ${c.border}`, boxShadow: '0 20px 50px rgba(20,60,38,.10)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: c.iconBg, border: `1px solid ${c.iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{c.icon}</div>
                <h3 style={{ margin: '22px 0 10px', fontFamily: serif, fontWeight: 600, fontSize: '23px', color: '#0C2417' }}>{c.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#5B7567' }}>{c.body}</p>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '78px', borderTop: `2px dashed ${c.dash}` }} />
                <div style={{ position: 'absolute', left: '28px', bottom: '28px', fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: '#16A34A' }}>{c.stub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" data-howitworks style={{ position: 'relative', padding: 'clamp(70px, 10vw, 130px) clamp(20px, 5vw, 64px)', maxWidth: '1240px', margin: '0 auto' }}>
        <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '70px' }}>
          <div style={eyebrow}>How it works</div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 1.02, letterSpacing: '-1.5px', color: '#0C2417' }}>From cart to door in three steps</h2>
        </div>

        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 1000 160" preserveAspectRatio="none" style={{ position: 'absolute', top: '40px', left: 0, width: '100%', height: '120px', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <linearGradient id="shopit-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="55%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
            </defs>
            <path data-draw d="M 90 80 C 280 0, 380 150, 500 80 S 740 0, 910 80" fill="none" stroke="url(#shopit-line)" strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,.4))', opacity: 0.3 }} />
          </svg>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px' }}>
            {[
              { n: '1', title: 'Browse', body: 'Explore thousands of products across every category.', color: '#16A34A', border: 'rgba(34,197,94,.55)', delay: 0 },
              { n: '2', title: 'Add to cart', body: 'Save your favorites and check out in seconds.', color: '#22C55E', border: 'rgba(34,197,94,.6)', delay: 160 },
              { n: '3', title: 'Delivered', body: 'Fast, tracked shipping right to your door.', color: '#15803D', border: 'rgba(21,128,61,.6)', delay: 320 },
            ].map((s) => (
              <div key={s.n} data-reveal data-delay={s.delay} style={{ ...revealStyle, textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '92px', height: '92px', margin: '0 auto 24px', borderRadius: '50%', background: '#FFFFFF', border: `2px dashed ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: '34px', fontWeight: 600, color: s.color, boxShadow: '0 10px 28px rgba(20,60,38,.10), 0 0 20px rgba(34,197,94,.15)' }}>{s.n}</div>
                <h3 style={{ margin: '0 0 8px', fontFamily: serif, fontSize: '25px', fontWeight: 600, color: '#0C2417' }}>{s.title}</h3>
                <p style={{ margin: '0 auto', maxWidth: '260px', fontSize: '15px', lineHeight: 1.6, color: '#5B7567' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MARQUEE / TRENDING ============ */}
      <section id="market" style={{ position: 'relative', padding: 'clamp(60px, 9vw, 110px) 0' }}>
        <div data-reveal style={{ ...revealStyle, textAlign: 'center', padding: '0 clamp(20px, 5vw, 64px)', marginBottom: '52px' }}>
          <div style={eyebrow}>Trending now</div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 1.02, letterSpacing: '-1.5px', color: '#0C2417' }}>
            What everyone's <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #16A34A, #22C55E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>buying.</span>
          </h2>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
          <div style={{ display: 'flex', gap: '22px', width: 'max-content', animation: 'shopit-marquee 36s linear infinite', padding: '14px 11px' }}>
            {TILES.map((t, i) => (
              <div key={i} style={{ position: 'relative', flex: '0 0 auto', width: '230px', padding: '18px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid rgba(34,197,94,.18)', boxShadow: '0 16px 40px rgba(20,60,38,.10)' }}>
                <div style={{ height: '132px', borderRadius: '12px', background: 'repeating-linear-gradient(45deg, rgba(34,197,94,.07) 0 9px, rgba(34,197,94,.02) 9px 18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: '10px', letterSpacing: '1px', color: '#8AA394' }}>product shot</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                  <div>
                    <div style={{ fontFamily: serif, fontWeight: 600, fontSize: '18px', color: '#0C2417' }}>{t.name}</div>
                    <div style={{ fontSize: '12.5px', color: '#5B7567', marginTop: '2px' }}>{t.cat}</div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: '11px', color: '#15803D', padding: '4px 9px', borderRadius: '999px', border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.06)', whiteSpace: 'nowrap' }}>{t.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF ============ */}
      <section id="reviews" style={{ position: 'relative', padding: 'clamp(70px, 10vw, 130px) clamp(20px, 5vw, 64px)', maxWidth: '1240px', margin: '0 auto' }}>
        <div data-reveal style={{ ...revealStyle, textAlign: 'center', marginBottom: '60px' }}>
          <div style={eyebrow}>Loved by shoppers</div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 1.02, letterSpacing: '-1.5px', color: '#0C2417' }}>Trusted by thousands of shoppers.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', alignItems: 'start' }}>
          {QUOTES.map((q) => (
            <div key={q.name} data-reveal data-delay={q.delay} style={{ ...revealStyle, transform: 'translateY(46px)', marginTop: q.offset }}>
              <div style={{ position: 'relative', padding: '32px 30px 30px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid rgba(34,197,94,.2)', boxShadow: '0 20px 50px rgba(20,60,38,.10)', animation: 'shopit-floatY 9s ease-in-out infinite' }}>
                <div style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: '#16A34A', marginBottom: '16px' }}>ADMIT · ONE</div>
                <p style={{ margin: 0, fontFamily: serif, fontSize: '21px', lineHeight: 1.4, color: '#0C2417' }}>"{q.text}"</p>
                <div style={{ position: 'relative', marginTop: '28px', paddingTop: '28px', borderTop: '2px dashed rgba(34,197,94,.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${q.c1}, ${q.c2})`, boxShadow: '0 6px 16px rgba(22,163,74,.25)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#0C2417' }}>{q.name}</div>
                      <div style={{ fontSize: '13px', color: '#5B7567' }}>{q.shop}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section id="start" style={{ position: 'relative', padding: 'clamp(40px, 6vw, 70px) clamp(20px, 5vw, 64px) clamp(80px, 10vw, 130px)' }}>
        <div data-reveal style={{ ...revealStyle, transition: 'opacity 1s ease, transform 1s cubic-bezier(.2,.7,.2,1), filter 1s ease', position: 'relative', maxWidth: '1080px', margin: '0 auto', textAlign: 'center', padding: 'clamp(56px, 8vw, 96px) clamp(24px, 5vw, 72px)', borderRadius: '32px', overflow: 'hidden', background: 'radial-gradient(700px 400px at 30% 0%, rgba(34,197,94,.18), transparent 60%), radial-gradient(700px 500px at 80% 100%, rgba(21,128,61,.16), transparent 60%), linear-gradient(160deg, #EAF7EE, #FFFFFF)', border: '1px solid rgba(34,197,94,.28)', boxShadow: '0 40px 90px rgba(20,60,38,.14)' }}>
          <div style={{ position: 'relative', width: '70%', maxWidth: '420px', margin: '0 auto 36px', borderTop: '2px dashed rgba(34,197,94,.6)', boxShadow: '0 0 12px rgba(34,197,94,.3)' }} />
          <div style={eyebrow}>Limited-time offers</div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 600, fontSize: 'clamp(36px, 7vw, 82px)', lineHeight: 1, letterSpacing: '-2px', color: '#0C2417' }}>
            Deals ending <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #16A34A, #22C55E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>soon.</span>
          </h2>
          <p style={{ margin: '24px auto 40px', maxWidth: '480px', fontSize: '18px', lineHeight: 1.6, color: '#5B7567' }}>Offers across every category — don't miss out.</p>
          <Link to="/products" data-magnetic style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '19px 40px', borderRadius: '999px', background: 'linear-gradient(135deg, #22C55E, #15803D)', color: '#fff', fontWeight: 600, fontSize: '17.5px', boxShadow: '0 12px 32px rgba(22,163,74,.35)' }}>
            Start Shopping Now <span style={{ fontSize: '19px' }}>→</span>
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ position: 'relative', borderTop: '1px solid rgba(34,197,94,.18)', background: 'linear-gradient(180deg, rgba(246,250,247,0), rgba(236,245,239,.7))', padding: 'clamp(50px, 7vw, 80px) clamp(20px, 5vw, 64px) 44px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: '40px' }}>
          <div>
            <Wordmark size={28} />
            <p style={{ margin: '18px 0 0', maxWidth: '280px', fontSize: '14.5px', lineHeight: 1.6, color: '#5B7567' }}>Your everyday store for everything you love.</p>
          </div>
          <FooterCol title="Shop" links={[['Categories', '/products'], ['Deals', '/products'], ['New arrivals', '/products']]} />
          <FooterCol title="Help" links={[['Support', '#'], ['Returns', '#'], ['Shipping', '#']]} />
          <FooterCol title="Company" links={[['About', '#'], ['Privacy Policy', '#'], ['Contact', '#']]} />
        </div>
        <div style={{ maxWidth: '1240px', margin: '48px auto 0', paddingTop: '24px', borderTop: '1px solid rgba(34,197,94,.14)', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', fontSize: '13px', color: '#8AA394' }}>
          <span>© 2026 Shopit. Shop anywhere, anytime.</span>
          <span style={{ fontFamily: mono, letterSpacing: '1px' }}>ADMIT · ONE</span>
        </div>
      </footer>
    </div>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontFamily: serif, fontWeight: 600, fontSize: `${size}px`, letterSpacing: '-.5px', color: '#0C2417' }}>
      <span>Shop</span>
      <span style={{ display: 'inline-flex', alignItems: 'stretch', height: '22px', margin: '0 3px', borderLeft: '2px dashed rgba(34,197,94,.85)', boxShadow: '0 0 8px rgba(34,197,94,.4)', alignSelf: 'center' }} />
      <span style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>it</span>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: '10.5px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8AA394', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14.5px' }}>
        {links.map(([label, to]) =>
          to.startsWith('/') ? (
            <Link key={label} to={to} style={{ color: '#5B7567' }}>{label}</Link>
          ) : (
            <a key={label} href={to} style={{ color: '#5B7567' }}>{label}</a>
          )
        )}
      </div>
    </div>
  );
}

export default LandingPage;
