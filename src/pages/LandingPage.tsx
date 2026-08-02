import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PlaceholdersAndVanishInput } from '../components/ui/placeholders-and-vanish-input';
import { fetchCategories } from '../api/productsApi';

// ---------------------------------------------------------------------------
// Shopit landing page — the public front door shown at "/".
// Built in the DESIGN.md "Peak Design" editorial idiom: full-bleed sections
// that alternate light ↔ near-black, a 50/50 split hero with an italic serif
// headline, flat borderless product cards, hairline dividers, NO shadows and
// NO gradients — typography and (placeholder) product imagery do the work.
// The reference's single rare accent (Ember Red) is mapped to our brand green;
// dark panels use our ink, and the warm cream/sand neutrals keep the app theme.
// ---------------------------------------------------------------------------

// Palette — our green theme mapped onto Peak Design's monochrome roles.
const INK = '#1F2A24';       // carbon — primary text
const CANVAS = '#FBF7F0';    // warm paper (light canvas)
const PAPER = '#FFFFFF';     // pure white — product image ground
const FOG = '#F0ECE2';       // soft surface / image placeholder fill
const BORDER = '#E4DCC9';    // hairline divider (sand)
const MUTED = '#8A8273';     // graphite — muted/secondary text
const GREEN = '#2F6F4F';     // the single accent (stands in for Ember Red)

// Rotating placeholders for the nav search — mirrors the product page's animated bar.
const SEARCH_PLACEHOLDERS = [
  'Search for wireless headphones...',
  'A cozy knit sweater for winter',
  'Minimalist leather wallet',
  'Something to brew great coffee',
  'A gift under $50',
];

const serif = "'Fraunces', serif";              // editorial display serif
const sans = "'Inter', system-ui, sans-serif";  // grotesque body + UI

// bryant substitute: compressed, uppercase, positively tracked label voice.
const label: CSSProperties = { fontFamily: sans, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' };

const KEYFRAMES = `
/* Section-to-section scroll snapping. .peak is its own 100vh scrollport, so this
   stays scoped to the landing page and the sticky header sticks within it. Each
   section snaps to the top, offset below the sticky header via scroll-padding.
   'proximity' (not 'mandatory') keeps sections taller than the viewport from
   trapping the scroll. */
.peak {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y proximity;
  scroll-padding-top: 120px;
  scroll-behavior: smooth;
}
.peak > section, .peak > footer { scroll-snap-align: start; }
@keyframes peak-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes peak-marquee { from { transform: translateX(-50%); } to { transform: translateX(0); } }
.peak .marquee { overflow: hidden; }
.peak .marquee-track { display: flex; width: max-content; animation: peak-marquee 45s linear infinite; }
.peak .marquee:hover .marquee-track { animation-play-state: paused; }
@keyframes peak-marquee-rev { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.peak .marquee-track-rev { display: flex; width: max-content; animation: peak-marquee-rev 45s linear infinite; }
.peak .marquee:hover .marquee-track-rev { animation-play-state: paused; }
/* Sticky-story: the right card is pinned (position: sticky) while the left steps
   scroll; each step fades/rises in when it reaches the viewport centre and the
   pinned card cross-fades to that step's image. */
.peak .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: start; }
.peak .story-step { min-height: 84vh; display: flex; flex-direction: column; justify-content: center; transition: opacity .5s ease, transform .5s ease; }
.peak .story-sticky { position: sticky; top: 120px; height: calc(100vh - 120px); display: flex; align-items: center; justify-content: center; }
.peak .story-card { position: relative; width: 100%; max-width: 460px; aspect-ratio: 4 / 5; border-radius: 18px; overflow: hidden; background: ${FOG}; box-shadow: 0 40px 80px -28px rgba(20,26,23,.4); }
.peak .story-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .6s ease; }
.peak a { text-decoration: none; }
.peak .navlink { transition: color .2s ease; }
.peak .navlink:hover { color: ${INK}; }
.peak .chip { transition: background .2s ease, color .2s ease, border-color .2s ease; }
.peak .btn { transition: opacity .2s ease, background .2s ease, color .2s ease; }
.peak .btn:hover { opacity: .85; }
/* Explore CTA: outlined on the green panel, fills white with green text on hover. */
.peak .btn-explore { background: transparent; color: ${PAPER}; border: 1px solid ${PAPER}; transition: background .25s ease, color .25s ease, border-color .25s ease; }
.peak .btn-explore:hover { background: #FFFFFF; color: ${GREEN}; border-color: ${GREEN}; opacity: 1; }
/* Shop now CTA: the inverse — white fill with green text, flips to green fill + white text on hover, keeping a white border. */
.peak .btn-shopnow { background: #FFFFFF; color: ${GREEN}; border: 1px solid #FFFFFF; transition: background .25s ease, color .25s ease, border-color .25s ease; }
.peak .btn-shopnow:hover { background: ${GREEN}; color: #FFFFFF; border-color: #FFFFFF; opacity: 1; }
.peak .card img, .peak .card .ph { transition: opacity .3s ease; }
.peak .card:hover .ph { opacity: .78; }
.peak .hero { display: grid; grid-template-columns: 1fr 1fr; }
.peak .split { display: grid; grid-template-columns: 1fr 1fr; }
@media (max-width: 860px) {
  .peak .hero, .peak .split { grid-template-columns: 1fr; }
  .peak .hero .media, .peak .split .media { min-height: 320px; }
  .peak .navcenter { display: none !important; }
  /* Stacked sections get tall on mobile — free-scroll instead of snapping. */
  .peak { scroll-snap-type: none; }
  /* Story collapses to a single column; the card un-pins and sits above/with each step. */
  .peak .story-grid { grid-template-columns: 1fr; }
  .peak .story-sticky { position: static; height: auto; margin-bottom: 24px; }
  .peak .story-step { min-height: auto; padding: 32px 0; opacity: 1 !important; transform: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .peak [data-reveal] { opacity: 1 !important; transform: none !important; }
  .peak { scroll-snap-type: none; scroll-behavior: auto; }
  .peak .story-step { opacity: 1 !important; transform: none !important; transition: none !important; }
  .peak .marquee { overflow-x: auto; }
  .peak .marquee-track, .peak .marquee-track-rev { animation: none !important; }
}
`;

const container: CSSProperties = { maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 clamp(20px, 5vw, 48px)' };

// Real product photography via LoremFlickr — the same keyword-based source the
// rest of the app uses (see lib/productImage.ts). The `lock` seed keeps each
// image stable across reloads instead of shuffling every render.
function photo(keywords: string, seed: number, w = 800, h = 800): string {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(keywords)}?lock=${seed}`;
}

type Product = { id: number; keywords: string; name: string; brand: string; price: string; badge?: 'NEW' | 'SALE' };
const PRODUCTS: Product[] = [
  { id: 1, keywords: 'backpack,bag', name: 'Everyday Backpack', brand: 'Trail', price: '$219' },
  { id: 2, keywords: 'camera,case', name: 'Camera Cube', brand: 'Optic', price: '$89', badge: 'NEW' },
  { id: 3, keywords: 'sling,bag', name: 'Sling 6L', brand: 'Trail', price: '$129' },
  { id: 4, keywords: 'duffel,bag', name: 'Travel Duffel', brand: 'Voyage', price: '$179', badge: 'SALE' },
  { id: 5, keywords: 'pouch,cable', name: 'Tech Pouch', brand: 'Optic', price: '$59' },
  { id: 6, keywords: 'toiletry,bag', name: 'Wash Kit', brand: 'Voyage', price: '$69' },
  { id: 7, keywords: 'wallet,leather', name: 'Field Wallet', brand: 'Trail', price: '$49', badge: 'NEW' },
  { id: 8, keywords: 'camera,tripod', name: 'Capture Clip', brand: 'Optic', price: '$84' },
];

// Steps for the sticky-story section. Each step fades in as it hits the viewport
// centre; the pinned card on the right cross-fades to `keywords`.
type Story = { keywords: string; seed: number; tag: string; title: string; body: string };
const STORY: Story[] = [
  { keywords: 'fashion,clothing,rack', seed: 71, tag: 'Fashion', title: 'Style for every day.', body: 'A curated edit of apparel and accessories — the pieces you reach for, chosen with intent.' },
  { keywords: 'headphones,gadget,desk', seed: 72, tag: 'Electronics', title: 'Tech that keeps up.', body: 'From audio to everyday carry, gear that earns its place — quality you can actually trust.' },
  { keywords: 'delivery,parcel,doorstep', seed: 73, tag: 'Delivered', title: 'At your door, fast.', body: 'One checkout, thousands of products, brought to your doorstep — with 30-day returns, always.' },
];

function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Real catalog categories for the pill bar. Show only top-level categories so the
  // row stays concise; clicking one deep-links to the product page filtered by it.
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const topCategories = (categories ?? []).filter((c) => c.parentCategoryId === null);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate('/products');
  }

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement;
            const d = parseFloat(el.getAttribute('data-delay') || '0');
            el.style.animation = `peak-rise .7s cubic-bezier(.2,.7,.2,1) ${d}ms both`;
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.opacity = '0';
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="peak" style={{ background: CANVAS, color: INK, fontFamily: sans, overflowX: 'hidden', minWidth: '320px' }}>
      <style>{KEYFRAMES}</style>

      {/* ============ PRIMARY NAV ============ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: CANVAS, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ ...container, height: '64px', display: 'flex', alignItems: 'center', gap: 'clamp(16px, 3vw, 40px)' }}>
          <Wordmark size={22} />

          <nav className="navcenter" style={{ display: 'flex', alignItems: 'center', gap: '28px', ...label, fontSize: '14px', color: '#363537' }}>
            <Link to="/products" className="navlink" style={{ color: '#363537' }}>Shop</Link>
            <Link to="/products" className="navlink" style={{ color: '#363537' }}>New</Link>
            <Link to="/products" className="navlink" style={{ color: '#363537' }}>Deals</Link>
          </nav>

          <div style={{ flex: 1, maxWidth: '360px', marginLeft: 'auto' }}>
            <PlaceholdersAndVanishInput
              placeholders={SEARCH_PLACEHOLDERS}
              onChange={() => {}}
              onSubmit={submitSearch}
              onImageSearch={() => navigate('/visual-search')}
              className="h-10"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link to="/login" className="navlink" aria-label="Account" style={{ color: INK, display: 'inline-flex' }}><User size={20} strokeWidth={1.5} /></Link>
            <Link to="/cart" className="navlink" aria-label="Cart" style={{ color: INK, display: 'inline-flex' }}><ShoppingBag size={20} strokeWidth={1.5} /></Link>
          </div>
        </div>

        {/* Category filter pills — sourced from the catalog's categories. */}
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <div style={{ ...container, display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px clamp(20px, 5vw, 48px)' }}>
            <Link
              to="/products"
              className="chip"
              style={{
                ...label,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                padding: '8px 20px',
                borderRadius: '9999px',
                border: '1px solid transparent',
                background: GREEN,
                color: PAPER,
              }}
            >
              All
            </Link>
            {topCategories.map((c) => (
              <Link
                key={c.id}
                to={`/products?categoryId=${c.id}`}
                className="chip"
                style={{
                  ...label,
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: `1px solid ${BORDER}`,
                  background: 'transparent',
                  color: '#363537',
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ============ HERO SPLIT PANEL ============ */}
      <section className="hero" style={{ width: '100%', minHeight: '560px' }}>
        {/* Left — dark editorial panel */}
        <div style={{ background: GREEN, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 72px)' }}>
          <div style={{ maxWidth: '520px' }}>
            <div style={{ ...label, fontSize: '14px', color: PAPER, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
              New season
            </div>
            <h1 style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(44px, 6vw, 80px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: PAPER }}>
              Everything you love, all in one place.
            </h1>
            <p style={{ margin: '22px 0 0', maxWidth: '420px', fontSize: '16px', lineHeight: 1.5, color: 'rgba(255,255,255,.8)' }}>
              From fashion and electronics to home, beauty, and beyond — thousands of products, one checkout, delivered to your door.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '32px' }}>
              <Link to="/products" className="btn btn-shopnow" style={{ ...label, fontSize: '15px', padding: '13px 22px', borderRadius: '4px' }}>
                Shop now
              </Link>
              <Link to="/products" className="btn btn-explore" style={{ ...label, fontSize: '15px', padding: '13px 22px', borderRadius: '4px' }}>
                Explore
              </Link>
            </div>
          </div>
        </div>
        {/* Right — full-bleed lifestyle image (static, non-floating) */}
        <div className="media" style={{ position: 'relative', background: FOG, minHeight: '420px', overflow: 'hidden' }}>
          <img
            src="https://images.pexels.com/photos/13432286/pexels-photo-13432286.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="A happy customer receiving her delivery at the door"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </section>

      {/* ============ PRODUCT MARQUEE (auto-scrolls left → right) ============ */}
      <section style={{ background: CANVAS, padding: 'clamp(56px, 8vw, 80px) 0', overflow: 'hidden' }}>
        <div style={{ ...container, marginBottom: '40px' }}>
          <h2 data-reveal style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: INK }}>
            Explore our products —
          </h2>
        </div>

        {/* Full-bleed track: two copies of the list slide continuously; the second
            copy makes the loop seamless. Pauses on hover so items can be inspected. */}
        <div className="marquee">
          <div className="marquee-track">
            {[...PRODUCTS, ...PRODUCTS].map((p, i) => (
              <div key={`${p.id}-${i}`} style={{ flex: '0 0 auto', width: 'clamp(200px, 22vw, 260px)', paddingRight: 'clamp(24px, 3vw, 32px)' }}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MANIFESTO (dark band) ============ */}
      <section style={{ background: GREEN, padding: 'clamp(72px, 11vw, 128px) 0' }}>
        <div style={{ ...container, textAlign: 'center' }}>
          <p data-reveal style={{ ...label, fontSize: '14px', color: GREEN, marginBottom: '24px' }}>Our promise</p>
          <h2 data-reveal style={{ margin: '0 auto', maxWidth: '900px', fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(30px, 5vw, 64px)', lineHeight: 1.15, letterSpacing: '-0.025em', color: PAPER }}>
            Everything you need. Nothing you don't.
          </h2>
          <div data-reveal style={{ marginTop: '40px' }}>
            <Link to="/products" className="btn" style={{ ...label, fontSize: '15px', padding: '13px 22px', borderRadius: '4px', background: PAPER, color: GREEN, border: `1px solid ${PAPER}`, display: 'inline-block' }}>
              Read the story
            </Link>
          </div>
        </div>
      </section>

      {/* ============ STICKY STORY (pinned card + fading steps) ============ */}
      <StickyStory />

      {/* ============ BESTSELLERS MARQUEE (auto-scrolls right → left) ============ */}
      <section style={{ background: CANVAS, padding: 'clamp(56px, 8vw, 80px) 0', overflow: 'hidden' }}>
        <div style={{ ...container, marginBottom: '40px' }}>
          <h2 data-reveal style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: INK }}>
            Bestsellers —
          </h2>
        </div>

        {/* Same seamless marquee, running the opposite direction to the row above. */}
        <div className="marquee">
          <div className="marquee-track-rev">
            {[...PRODUCTS, ...PRODUCTS].map((p, i) => (
              <div key={`${p.id}-${i}`} style={{ flex: '0 0 auto', width: 'clamp(200px, 22vw, 260px)', paddingRight: 'clamp(24px, 3vw, 32px)' }}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER (dark band) ============ */}
      <footer style={{ background: GREEN, color: PAPER, padding: 'clamp(56px, 8vw, 80px) 0 40px' }}>
        <div style={container}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 'clamp(24px, 4vw, 48px)' }}>
            <div>
              <Wordmark size={24} light />
              <p style={{ margin: '18px 0 0', maxWidth: '280px', fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,.65)' }}>
                A gallery-grade store for everything you love — chosen with intent.
              </p>
            </div>
            <FooterCol title="Shop" links={[['Categories', '/products'], ['New arrivals', '/products'], ['Deals', '/products']]} />
            <FooterCol title="Help" links={[['Support', '#'], ['Returns', '#'], ['Shipping', '#']]} />
            <FooterCol title="Company" links={[['About', '#'], ['Privacy', '#'], ['Contact', '#']]} />
          </div>
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.14)', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', ...label, fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>
            <span>© 2026 Shopit</span>
            <span>Shop anywhere, anytime</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sticky-story section: pinned card on the right, fading steps on the left.
// The active step is whichever one currently crosses the viewport centre — a
// thin centre band via rootMargin. The pinned card cross-fades to its image.
function StickyStory() {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = stepsRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(Number((en.target as HTMLElement).dataset.step));
        });
      },
      // thin band across the vertical centre — a step is "active" while it overlaps it
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' },
    );
    root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section style={{ background: CANVAS, padding: 'clamp(40px, 6vw, 72px) 0' }}>
      <div style={container}>
        <div className="story-grid">
          {/* LEFT — steps that fade/rise as they reach the centre */}
          <div ref={stepsRef}>
            {STORY.map((s, i) => (
              <div
                key={s.tag}
                data-step={i}
                className="story-step"
                style={{ opacity: active === i ? 1 : 0.25, transform: active === i ? 'none' : 'translateY(24px)' }}
                aria-hidden={active !== i}
              >
                <div style={{ maxWidth: '440px' }}>
                  <p style={{ ...label, fontSize: '14px', color: GREEN, marginBottom: '16px' }}>
                    {String(i + 1).padStart(2, '0')} — {s.tag}
                  </p>
                  <h2 style={{ margin: 0, fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: INK }}>
                    {s.title}
                  </h2>
                  <p style={{ margin: '20px 0 0', fontSize: '16px', lineHeight: 1.5, color: MUTED }}>{s.body}</p>
                  {i === STORY.length - 1 && (
                    <div style={{ marginTop: '30px' }}>
                      <Link to="/products" className="btn" style={{ ...label, fontSize: '15px', padding: '13px 24px', borderRadius: '4px', background: GREEN, color: PAPER, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        Start shopping <ArrowRight size={17} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — pinned card, cross-fading between step images */}
          <div className="story-sticky">
            <div className="story-card">
              {STORY.map((s, i) => (
                <img
                  key={s.tag}
                  src={photo(s.keywords, s.seed, 900, 1100)}
                  alt={s.title}
                  loading="lazy"
                  style={{ opacity: active === i ? 1 : 0 }}
                />
              ))}
              {/* progress dots */}
              <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
                {STORY.map((s, i) => (
                  <span key={s.tag} style={{ width: active === i ? '20px' : '8px', height: '8px', borderRadius: '9999px', background: active === i ? PAPER : 'rgba(255,255,255,.55)', transition: 'width .3s ease, background .3s ease' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Flat, borderless, shadowless product card — separated by whitespace alone.
function ProductCard({ id, keywords, name, brand, price, badge }: Product) {
  return (
    <Link to="/products" className="card" style={{ display: 'block', background: 'transparent' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: FOG, borderRadius: '8px', overflow: 'hidden' }}>
        <img className="ph" src={photo(keywords, id)} alt={name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              ...label,
              fontSize: '12px',
              color: PAPER,
              background: badge === 'SALE' ? GREEN : '#4E4E4E',
              padding: '3px 8px',
              borderRadius: '9999px',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ paddingTop: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: INK }}>{name}</div>
        <div style={{ fontSize: '14px', color: MUTED, marginTop: '4px' }}>{brand}</div>
        <div style={{ fontSize: '16px', color: INK, marginTop: '8px' }}>{price}</div>
      </div>
    </Link>
  );
}

// The Shopit "Shop | it" wordmark — accent stays green.
function Wordmark({ size, light = false }: { size: number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontFamily: serif, fontWeight: 600, fontSize: `${size}px`, letterSpacing: '-.5px', color: light ? PAPER : INK, lineHeight: 1 }}>
      <span>Shop</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          height: `${size * 0.82}px`,
          margin: '0 3px',
          borderLeft: `2px dashed ${light ? 'rgba(120,197,150,.9)' : 'rgba(47,111,79,.85)'}`,
          alignSelf: 'center',
        }}
      />
      <span style={{ color: GREEN }}>it</span>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div style={{ ...label, fontSize: '13px', color: 'rgba(255,255,255,.9)', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '15px' }}>
        {links.map(([lbl, to]) =>
          to.startsWith('/') ? (
            <Link key={lbl} to={to} className="navlink" style={{ color: 'rgba(255,255,255,.65)' }}>{lbl}</Link>
          ) : (
            <a key={lbl} href={to} className="navlink" style={{ color: 'rgba(255,255,255,.65)' }}>{lbl}</a>
          ),
        )}
      </div>
    </div>
  );
}

export default LandingPage;
