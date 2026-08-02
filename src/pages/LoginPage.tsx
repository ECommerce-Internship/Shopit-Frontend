import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { mergeGuestCartIntoServer } from '../lib/guestCart';
import { AuthLayout } from '../components/AuthLayout';
import { authAccent } from '../components/AuthModeSwitch';

const inputStyle = {
  fontFamily: "'Inter', sans-serif",
  borderColor: '#E4DCC9',
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { setItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  // Set by ProtectedRoute / the add-to-cart gate when a guest is bounced here.
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;

  // Login is role-agnostic (the role comes back in the token), so there's no
  // customer/seller choice here — the form just uses the default accent.
  const accent = authAccent('customer');

  const validate = () => {
    let valid = true;

    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError(null);
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/v1/auth/login', { email, password });
      const authUser = login(response.data);
      // Fold any guest (localStorage) cart into the real cart before moving on, so
      // checkout — the usual reason a shopper signs in — already has their items.
      const mergedCount = await mergeGuestCartIntoServer();
      if (mergedCount !== null) setItemCount(mergedCount);
      // Return the user to wherever they were headed; otherwise use the role default.
      const returnTo = from ? `${from.pathname ?? ''}${from.search ?? ''}` : null;
      navigate(returnTo || getRedirectPathForRole(authUser.role), { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data ?? 'Login failed. Please try again.';
      toast.error(typeof message === 'string' ? message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Full-page navigation to the backend, which kicks off the Google OAuth redirect.
    window.location.href = `${API_BASE_URL.replace(/\/$/, '')}/api/v1/auth/login/google`;
  };

  return (
    <AuthLayout eyebrow="Sign in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="login-email"
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'login-email-error' : undefined}
            className="border rounded px-3 py-2 outline-none focus:ring-2"
            style={{ ...inputStyle, '--tw-ring-color': accent } as React.CSSProperties}
          />
          {emailError && (
            <p id="login-email-error" className="text-sm" style={{ color: '#D97B3F' }}>
              {emailError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="login-password"
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'login-password-error' : undefined}
              className="border rounded px-3 py-2 pr-10 outline-none focus:ring-2 w-full"
              style={{ ...inputStyle, '--tw-ring-color': accent } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              style={{ color: '#8A8273' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && (
            <p id="login-password-error" className="text-sm" style={{ color: '#D97B3F' }}>
              {passwordError}
            </p>
          )}
          <Link
            to="/forgot-password"
            className="text-[11px] underline self-end mt-1"
            style={{ fontFamily: "'Inter', sans-serif", color: accent, transition: 'color 0.3s ease' }}
          >
            Forgot password?
          </Link>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="rounded px-3 py-2.5 text-white mt-2 disabled:opacity-50"
          style={{
            backgroundColor: accent,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            transition: 'background-color 0.3s ease, opacity 0.15s ease',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1" style={{ borderTop: '1px solid #E4DCC9' }} />
        <span
          className="text-[11px] uppercase tracking-[0.1em]"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8273' }}
        >
          or
        </span>
        <div className="flex-1" style={{ borderTop: '1px solid #E4DCC9' }} />
      </div>

      {/* Google login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full rounded px-3 py-2.5 flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4DCC9',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          color: '#1F2A24',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Login with Google
      </button>

        
      <div
        className="mt-6 pt-5 flex flex-col gap-2"
        style={{ borderTop: '1px solid #E4DCC9', fontFamily: "'Inter', sans-serif" }}
      >
        <p className="text-sm text-center" style={{ color: '#1F2A24' }}>
          New here?{' '}
          <Link
            to="/register"
            className="font-medium underline"
            style={{ color: accent, transition: 'color 0.3s ease' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;