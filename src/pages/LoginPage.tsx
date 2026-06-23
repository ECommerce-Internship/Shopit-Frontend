import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';

const inputStyle = {
  fontFamily: "'Inter', sans-serif",
  borderColor: '#E4DCC9',
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      navigate(getRedirectPathForRole(authUser.role));
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data ?? 'Login failed. Please try again.';
      toast.error(typeof message === 'string' ? message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Sign in">
      <h2
        className="text-2xl mb-6"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: '#1F2A24' }}
      >
        Welcome back
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2 outline-none focus:ring-2"
            style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
          />
          {emailError && <p className="text-sm" style={{ color: '#D97B3F' }}>{emailError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-3 py-2 outline-none focus:ring-2"
            style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
          />
          {passwordError && <p className="text-sm" style={{ color: '#D97B3F' }}>{passwordError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded px-3 py-2.5 text-white mt-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div
        className="mt-6 pt-5 flex flex-col gap-2"
        style={{ borderTop: '1px solid #E4DCC9', fontFamily: "'Inter', sans-serif" }}
      >
        <p className="text-sm text-center" style={{ color: '#1F2A24' }}>
          New here?{' '}
          <Link to="/register" className="font-medium underline" style={{ color: '#2F6F4F' }}>
            Create an account
          </Link>
        </p>
        <p className="text-sm text-center">
          <Link to="/seller/register" className="font-medium underline" style={{ color: '#D97B3F' }}>
            Want to sell? Become a seller →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;