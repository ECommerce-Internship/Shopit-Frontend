import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-purple-600 text-center">Log in</h1>

        <div className="flex flex-col gap-1">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-600 underline">
            Register
          </Link>
        </p>

        <p className="text-center text-sm text-gray-600">
          Want to sell?{' '}
          <Link to="/seller/register" className="text-purple-600 underline">
            Become a seller →
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;