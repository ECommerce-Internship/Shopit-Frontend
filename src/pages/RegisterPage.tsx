import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { registerSeller } from '../api/SellerApi';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { AuthModeSwitch, authAccent, type AuthMode } from '../components/AuthModeSwitch';

const inputStyle = {
  fontFamily: "'Inter', sans-serif",
  borderColor: '#E4DCC9',
};

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  storeName?: string;
};

function Field({
  label,
  error,
  accent = '#2F6F4F',
  id,
  type,
  ...props
}: { label: string; error?: string; accent?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[11px] uppercase tracking-[0.1em]"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`border rounded px-3 py-2 outline-none focus:ring-2 w-full ${isPassword ? 'pr-10' : ''}`}
          style={{ ...inputStyle, '--tw-ring-color': accent } as React.CSSProperties}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={{ color: '#8A8273' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm" style={{ color: '#D97B3F' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('customer');
  const { login } = useAuth();
  const navigate = useNavigate();

  const accent = authAccent(mode);

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (mode === 'seller' && !storeName.trim()) {
      newErrors.storeName = 'Store name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'seller') {
        const data = await registerSeller({
          firstName,
          lastName,
          email,
          password,
          storeName,
          storeDescription: storeDescription || undefined,
        });
        const authUser = login(data);
        toast.success('Welcome! Your store is pending approval.');
        navigate(getRedirectPathForRole(authUser.role));
      } else {
        const response = await axiosInstance.post('/api/v1/auth/register', {
          firstName,
          lastName,
          email,
          password,
        });
        const authUser = login(response.data);
        navigate(getRedirectPathForRole(authUser.role));
      }
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data ?? 'Registration failed. Please try again.';
      toast.error(typeof message === 'string' ? message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow={mode === 'seller' ? 'Create account · Seller' : 'Create account · Customer'}>
      <AuthModeSwitch mode={mode} onChange={setMode} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            accent={accent}
          />
          <Field
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            accent={accent}
          />
        </div>

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          accent={accent}
        />

        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          accent={accent}
        />

        <Field
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          accent={accent}
        />

        {mode === 'seller' && (
          <div className="auth-swap flex flex-col gap-4">
            <Field
              label="Store name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              error={errors.storeName}
              accent={accent}
            />

            <div className="flex flex-col gap-1">
              <label
                htmlFor="register-store-description"
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
              >
                Store description (optional)
              </label>
              <textarea
                id="register-store-description"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Tell customers what you sell..."
                rows={3}
                className="border rounded px-3 py-2 outline-none focus:ring-2 resize-y"
                style={{ ...inputStyle, '--tw-ring-color': accent } as React.CSSProperties}
              />
            </div>
          </div>
        )}

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
          {loading
            ? 'Creating account...'
            : mode === 'seller'
              ? 'Create seller account'
              : 'Create account'}
        </button>
      </form>

      <div
        className="mt-6 pt-5 flex flex-col gap-2"
        style={{ borderTop: '1px solid #E4DCC9', fontFamily: "'Inter', sans-serif" }}
      >
        <p className="text-sm text-center" style={{ color: '#1F2A24' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium underline"
            style={{ color: accent, transition: 'color 0.3s ease' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
