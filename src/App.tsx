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
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SellerRoute } from './components/SellerRoute';
import CartPage from './pages/CartPage';
import { ChatButton } from './components/ChatButton';
import { useAuth } from './context/AuthContext';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SellerRegisterPage from './pages/SellerRegisterPage';
import StorefrontPage from './pages/StorefrontPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import MyStoresPage from './pages/MyStoresPage';


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
        <Route path="/sell" element={<SellerRegisterPage />} />
        <Route path="/stores/:slug" element={<StorefrontPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route element={<SellerRoute />}>
            <Route path="/seller" element={<SellerDashboard />} />
            <Route path="/seller/stores" element={<MyStoresPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;