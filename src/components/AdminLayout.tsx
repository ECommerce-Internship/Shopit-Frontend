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
  Boxes,
  FolderTree,
  CreditCard,
  Star,
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from './ui/sidebar';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { pageIn } from '../lib/motion';

const INK = '#1F2A24';
const GREEN = '#2F6F4F';
const iconClass = 'h-5 w-5 shrink-0';

type NavItem = { label: string; href: string; icon: React.ElementType };

// Mirrors the admin sections. Settings is intentionally omitted — it never had a
// route or a screen behind it.
const adminLinks: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Stores', href: '/admin/stores', icon: Store },
  { label: 'Coupons', href: '/admin/coupons', icon: TicketPercent },
];

// Brand mark — matches AppLayout: a compact green logomark that stays visible in
// both folded + expanded states, with the "Shop·it" wordmark revealing when open.
function Brand({ href, suffix }: { href: string; suffix?: string }) {
  const { open, animate } = useSidebar();
  const show = animate ? open : true;
  return (
    <Link to={href} className="relative z-20 flex items-center gap-2 py-1">
      <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: GREEN }} />
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

  const isActive = (href: string) => location.pathname.startsWith(href);

  const initial = user?.firstName?.charAt(0).toUpperCase() ?? 'U';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Account';

  return (
    <SidebarBody className="justify-between gap-10 bg-[#F2FFDF] border-r border-[#E4DCC9]">
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Brand href="/admin/dashboard" suffix="Admin" />
        <div className="mt-8 flex flex-col gap-1">
          {adminLinks.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const iconColor = active ? GREEN : '#5c5648';
            return (
              <SidebarLink
                key={item.href}
                link={{
                  label: item.label,
                  href: item.href,
                  icon: <Icon className={iconClass} style={{ color: iconColor }} />,
                }}
                className={cn(
                  'rounded-lg px-2 transition-colors',
                  active ? 'bg-[#E7F0EA] font-semibold' : 'hover:bg-[#F2ECDD]',
                )}
                style={{ color: active ? GREEN : INK }}
              />
            );
          })}

          {/* Logout — an action rather than navigation. */}
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

      {/* Profile pinned to the bottom, linking to the account page. */}
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
    </SidebarBody>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn('flex w-full flex-1 flex-col md:flex-row bg-[#FBF7F0]', 'min-h-screen')}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarContent />
      </Sidebar>
      <main className="flex-1 min-w-0 overflow-y-auto">
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

export default AdminLayout;
