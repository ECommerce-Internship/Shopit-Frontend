import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  const linkStyle = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
  const sellerLinkStyle = { color: '#2F6F4F', fontFamily: "'Inter', sans-serif" };

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E4DCC9' }}>
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          to="/products"
          className="text-2xl"
          style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          Shopit
        </Link>

        {/* Desktop links — hidden below md, shown as a dropdown instead */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/products" className="text-sm" style={linkStyle}>
            Products
          </Link>
          {user?.role !== 'Seller' && (
            <Link to="/sell" className="text-sm font-medium" style={sellerLinkStyle}>
              Sell on Shopit
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
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
            <Link to="/login" className="text-sm hidden md:block" style={linkStyle}>
              Sign in
            </Link>
          )}

          {/* Mobile hamburger — only visible below md */}
          <button
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            className="md:hidden flex items-center justify-center"
            style={{ width: '36px', height: '36px', background: 'none', border: 'none', cursor: 'pointer', color: '#1F2A24' }}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div
          className="md:hidden flex flex-col"
          style={{ borderTop: '1px solid #E4DCC9', backgroundColor: '#FFFFFF' }}
        >
          <Link
            to="/products"
            onClick={() => setMobileNavOpen(false)}
            className="text-sm px-6 py-3"
            style={{ ...linkStyle, borderBottom: '1px solid #F0ECE2' }}
          >
            Products
          </Link>
          {user?.role !== 'Seller' && (
            <Link
              to="/sell"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm font-medium px-6 py-3"
              style={{ ...sellerLinkStyle, borderBottom: '1px solid #F0ECE2' }}
            >
              Sell on Shopit
            </Link>
          )}
          {!user && (
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm px-6 py-3"
              style={linkStyle}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
