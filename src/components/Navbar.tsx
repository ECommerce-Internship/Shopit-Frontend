import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

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

        {user && (
          <div className="flex items-center gap-3">
            <span
              className="text-sm"
              style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}
            >
              {user.firstName}
            </span>
            <button
              onClick={logout}
              className="text-sm"
              style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}