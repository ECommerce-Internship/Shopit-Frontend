import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import AccountPage from './pages/AccountPage';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Seller from './pages/Seller';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SellerRoute } from './components/SellerRoute';
import CartPage from './pages/CartPage';
import { ChatButton } from './components/ChatButton';
import { useAuth } from './context/AuthContext';

const HIDDEN_NAVBAR_PATHS = ['/', '/login', '/register', '/auth/google/callback'];

function App() {
  const location = useLocation();
  const showNavbar = !HIDDEN_NAVBAR_PATHS.includes(location.pathname);
  const { user } = useAuth();

  return (
    <>
      {showNavbar && <Navbar />}
      {user && <ChatButton />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cart" element={<CartPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route element={<SellerRoute />}>
            <Route path="/seller" element={<Seller />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;