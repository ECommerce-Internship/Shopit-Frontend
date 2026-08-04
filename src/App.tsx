import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import VisualSearchPage from './pages/VisualSearchPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SellerRoute } from './components/SellerRoute';
import { AppLayout } from './components/AppLayout';
import { ChatButton } from './components/ChatButton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

// Route pages are lazy-loaded so each becomes its own chunk, split out of the
// main bundle and fetched on demand when the route is visited.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SellerRegisterPage = lazy(() => import('./pages/SellerRegisterPage'));
const StorefrontPage = lazy(() => import('./pages/StorefrontPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const MyStoresPage = lazy(() => import('./pages/MyStoresPage'));
const SellerProductsPage = lazy(() => import('./pages/SellerProductsPage'));
const SellerProductFormPage = lazy(() => import('./pages/SellerProductFormPage'));
const SellerOrdersPage = lazy(() => import('./pages/SellerOrdersPage'));
const SellerFlaggedReviewsPage = lazy(() => import('./pages/SellerFlaggedReviewsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage'));
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminInventoryPage = lazy(() => import('./pages/AdminInventoryPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminStoresPage = lazy(() => import('./pages/AdminStoresPage'));
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage'));
const SellerCouponsPage = lazy(() => import('./pages/SellerCouponsPage'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));




const HIDDEN_NAVBAR_PATHS = ['/', '/login', '/register', '/forgot-password', '/auth/google/callback'];

// Route prefixes rendered inside AppLayout (customer + seller). These own their
// own full-height sidebar, so the global top navbar is hidden on them. Admin and
// public pages (storefront, /sell) keep the top navbar.
const SIDEBAR_LAYOUT_PREFIXES = ['/products', '/visual-search', '/account', '/dashboard', '/cart', '/checkout', '/orders', '/seller'];

function App() {
  const location = useLocation();
  const { pathname } = location;
  const inSidebarLayout = SIDEBAR_LAYOUT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showNavbar = !HIDDEN_NAVBAR_PATHS.includes(pathname) && !inSidebarLayout;
  const { user } = useAuth();

  return (
    <>
      {showNavbar && <Navbar />}
      {user && <ChatButton />}
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/sell" element={<SellerRegisterPage />} />
        <Route path="/stores/:slug" element={<StorefrontPage />} />
        {/* Admin console — sign-in + admin role required. Keeps the top navbar. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/inventory" element={<AdminInventoryPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/stores" element={<AdminStoresPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          </Route>
        </Route>

        {/* Full-height sidebar layout. Browsing the catalog is fully public;
            anything tied to a buyer account (cart, checkout, orders, account,
            seller tools) sits behind ProtectedRoute so it prompts sign-in. */}
        <Route element={<AppLayout />}>
          {/* Public — no login needed to browse or fill a cart. */}
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/visual-search" element={<VisualSearchPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Requires sign-in — checkout, orders and account areas. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route element={<SellerRoute />}>
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/seller/stores" element={<MyStoresPage />} />
              <Route path="/seller/products" element={<SellerProductsPage />} />
              <Route path="/seller/products/new" element={<SellerProductFormPage />} />
              <Route path="/seller/products/:id/edit" element={<SellerProductFormPage />} />
              <Route path="/seller/orders" element={<SellerOrdersPage />} />
              <Route path="/seller/coupons" element={<SellerCouponsPage />} />
              <Route path="/seller/reviews" element={<SellerFlaggedReviewsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;