import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Seller from './pages/Seller';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SellerRoute } from './components/SellerRoute';

const HIDDEN_NAVBAR_PATHS = ['/login', '/register'];

function App() {
  const location = useLocation();
  const showNavbar = !HIDDEN_NAVBAR_PATHS.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
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