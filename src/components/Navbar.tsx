import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <nav
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4DCC9' }}
    >
      <Link
        to="/products"
        className="text-2xl"
        style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
      >
        Shopit
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/products"
          className="text-sm"
          style={{ color: '#1F2A24', fontFamily: "'Inter', sans-serif" }}
        >
          Products
        </Link>

        <Link
          to="/sell"
          className="text-sm"
          style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        >
          Sell on Shopit
        </Link>

        <Link to="/cart" className="relative" aria-label="Cart">
          <ShoppingCart size={22} color="#1F2A24" />
          {itemCount > 0 && (
            <span
              className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: '#D97B3F',
                color: '#FFFFFF',
                width: '18px',
                height: '18px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {itemCount}
            </span>
          )}
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            {user.role === 'Seller' && (
              <Link
                to="/seller/stores"
                className="text-sm"
                style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif", marginRight: '16px' }}
              >
                My Stores
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={`${user.firstName} ${user.lastName}`}
              className="flex items-center justify-center rounded-full"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#2F6F4F',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: 500,
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {user.firstName.charAt(0)}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="admin-menu-enter absolute right-0 mt-2 rounded-xl overflow-hidden"
                style={{
                  minWidth: '220px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4DCC9',
                  boxShadow: '0 8px 24px rgba(31, 42, 36, 0.12)',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E4DCC9' }}>
                  <div style={{ color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500 }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif", fontSize: '12px', marginTop: '2px' }}>
                    {user.email}
                  </div>
                </div>
                <Link
                  to="/account"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block hover:bg-[#F7F3EC]"
                  style={{ padding: '11px 16px', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}
                >
                  Account
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  role="menuitem"
                  className="block w-full text-left hover:bg-[#F7F3EC]"
                  style={{ padding: '11px 16px', color: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm"
            style={{ color: '#1F2A24', fontFamily: "'Inter', sans-serif" }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
