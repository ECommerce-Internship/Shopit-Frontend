import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';

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
};

function Field({
  label,
  error,
  id,
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[11px] uppercase tracking-[0.1em]"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="border rounded px-3 py-2 outline-none focus:ring-2"
        style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
      />
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/v1/auth/register', {
        firstName,
        lastName,
        email,
        password,
      });
      const authUser = login(response.data);
      navigate(getRedirectPathForRole(authUser.role));
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data ?? 'Registration failed. Please try again.';
      toast.error(typeof message === 'string' ? message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Create account">
      <h2
        className="text-2xl mb-6"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: '#1F2A24' }}
      >
        Join Shopit
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
          />
          <Field
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
          />
        </div>

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <Field
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded px-3 py-2.5 text-white mt-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div
        className="mt-6 pt-5 flex flex-col gap-2"
        style={{ borderTop: '1px solid #E4DCC9', fontFamily: "'Inter', sans-serif" }}
      >
        <p className="text-sm text-center" style={{ color: '#1F2A24' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline" style={{ color: '#2F6F4F' }}>
            Sign in
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

export default RegisterPage;