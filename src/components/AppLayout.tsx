import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TicketPercent,
  Store,
  ArrowLeft,
  ShoppingCart,
  PackageSearch,
  Camera,
  LogIn,
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from './ui/sidebar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { pageIn } from '../lib/motion';

const INK = '#1F2A24';
const GREEN = '#2F6F4F';
const iconClass = 'h-5 w-5 shrink-0';

type NavItem = { label: string; href: string; icon: React.ElementType };

const sellerLinks: NavItem[] = [
  { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { label: 'My Products', href: '/seller/products', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Coupons', href: '/seller/coupons', icon: TicketPercent },
  { label: 'My Stores', href: '/seller/stores', icon: Store },
];

const customerLinks: NavItem[] = [
  { label: 'Browse', href: '/products', icon: PackageSearch },
  { label: 'Search by Photo', href: '/visual-search', icon: Camera },
  { label: 'My Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Cart', href: '/cart', icon: ShoppingCart },
];

// Guests can browse and fill a cart freely; only order history (which needs a
// buyer account) is hidden until they sign in.
const guestLinks: NavItem[] = [
  { label: 'Browse', href: '/products', icon: PackageSearch },
  { label: 'Search by Photo', href: '/visual-search', icon: Camera },
  { label: 'Cart', href: '/cart', icon: ShoppingCart },
];

// Brand mark. A compact green "S" logomark stays visible in BOTH states (folded
// + expanded); when expanded, the full landing-page "Shop·it" wordmark (and any
// suffix) reveals to the right.
function Brand({ href, suffix }: { href: string; suffix?: string }) {
  const { open, animate } = useSidebar();
  const show = animate ? open : true;
  return (
    <Link to={href} className="relative z-20 flex items-center gap-2 py-1">
      {/* Logomark — always visible, fits the 70px rail */}
      <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: GREEN }} />
      {/* Wordmark — reveals only when expanded */}
      <motion.span
        animate={{ opacity: show ? 1 : 0, display: show ? 'inline-flex' : 'none' }}
        className="items-center whitespace-pre"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1 }}
      >
        <span style={{ color: INK }}>Shop</span>
        <span style={{ height: '15px', margin: '0 3px', borderLeft: '2px dashed rgba(47,111,79,.85)', alignSelf: 'center' }} />
        <span style={{ color: GREEN }}>it</span>
        {suffix && (
          <span style={{ color: '#8A8273', fontSize: '12px', fontWeight: 700, marginLeft: '8px', letterSpacing: '0.06em', textTransform: 'uppercase', alignSelf: 'center' }}>
            {suffix}
          </span>
        )}
      </motion.span>
    </Link>
  );
}

function SidebarContent() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const isSeller = user?.role === 'Seller';
  const links = isSeller ? sellerLinks : user ? customerLinks : guestLinks;
  const brand: { href: string; suffix?: string } = isSeller
    ? { href: '/seller', suffix: 'Seller' }
    : { href: '/products' };

  // A dashboard-style root ('/seller') is active only on an exact match; the
  // rest highlight when the path starts with their href.
  const isActive = (href: string) =>
    href === '/seller' ? location.pathname === '/seller' : location.pathname.startsWith(href);

  const initial = user?.firstName?.charAt(0).toUpperCase() ?? 'U';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Account';

  return (
    <SidebarBody className="justify-between gap-10 bg-[#F2FFDF] border-r border-[#E4DCC9]">
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Brand href={brand.href} suffix={brand.suffix} />
        <div className="mt-8 flex flex-col gap-1">
          {links.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const iconColor = active ? GREEN : '#5c5648';
            return (
              <SidebarLink
                key={item.href}
                link={{
                  label: item.label,
                  href: item.href,
                  icon: (
                    <div className="relative">
                      <Icon className={iconClass} style={{ color: iconColor }} />
                      {item.href === '/cart' && itemCount > 0 && (
                        <span
                          className="absolute flex items-center justify-center rounded-full text-white"
                          style={{ top: '-6px', right: '-8px', minWidth: '16px', height: '16px', padding: '0 4px', fontSize: '10px', fontWeight: 700, background: '#D97B3F', fontFamily: "'Inter', sans-serif" }}
                        >
                          {itemCount}
                        </span>
                      )}
                    </div>
                  ),
                }}
                className={cn(
                  'rounded-lg px-2 transition-colors',
                  active ? 'bg-[#E7F0EA] font-semibold' : 'hover:bg-[#F2ECDD]',
                )}
                style={{ color: active ? GREEN : INK }}
              />
            );
          })}

          {/* Logout — an action rather than navigation. Only for signed-in users. */}
          {user && (
            <SidebarLink
              link={{
                label: 'Log out',
                href: '/login',
                icon: <ArrowLeft className={iconClass} style={{ color: '#5c5648' }} />,
              }}
              onClick={() => logout()}
              className="rounded-lg px-2 transition-colors hover:bg-[#F2ECDD]"
              style={{ color: INK }}
            />
          )}
        </div>
      </div>

      {/* Pinned to the bottom: profile (→ Account) when signed in, otherwise a
          sign-in prompt for guests. */}
      {user ? (
        <SidebarLink
          link={{
            label: fullName,
            href: '/account',
            icon: (
              <div
                className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-white"
                style={{ background: GREEN, fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
              >
                {initial}
              </div>
            ),
          }}
          className="rounded-lg px-2"
          style={{ color: INK, fontWeight: 500 }}
        />
      ) : (
        <SidebarLink
          link={{
            label: 'Sign in',
            href: '/login',
            icon: (
              <div
                className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-white"
                style={{ background: GREEN }}
              >
                <LogIn className="h-4 w-4" />
              </div>
            ),
          }}
          className="rounded-lg px-2"
          style={{ color: INK, fontWeight: 500 }}
        />
      )}
    </SidebarBody>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn('flex w-full flex-1 flex-col md:flex-row bg-[#FBF7F0]', 'min-h-screen')}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarContent />
      </Sidebar>
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Re-keyed per route so each view eases in instead of hard-swapping. */}
        <motion.div
          key={location.pathname}
          variants={pageIn}
          initial={prefersReduced ? false : 'hidden'}
          animate="show"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

export default AppLayout;
