import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { AuthLayout } from '../components/AuthLayout';

const inputStyle = {
  fontFamily: "'Inter', sans-serif",
  borderColor: '#E4DCC9',
};

const labelClass = 'text-[11px] uppercase tracking-[0.1em]';
const labelStyle = { fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' };

// Mirrors the backend ResetPasswordRequestValidator so users get instant feedback.
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
}

// The backend returns either a { message } object or an array of validation strings.
function extractErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (Array.isArray(data)) return data.join(' ');
  const message = data?.message ?? data;
  return typeof message === 'string' ? message : fallback;
}

function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Two-step flow: 'request' asks for the email, 'reset' takes the emailed code + new password.
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);

    setLoading(true);
    try {
      await axiosInstance.post('/api/v1/auth/forgot-password', { email });
      toast.success('If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();

    let valid = true;
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from your email.');
      valid = false;
    } else {
      setCodeError(null);
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (!valid) return;

    setLoading(true);
    try {
      await axiosInstance.post('/api/v1/auth/reset-password', {
        email,
        code,
        newPassword: password,
      });
      toast.success('Your password has been reset. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Could not reset your password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Reset password">
      <h2
        className="text-2xl mb-2"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: '#1F2A24' }}
      >
        {step === 'request' ? 'Forgot your password?' : 'Enter your code'}
      </h2>
      <p className="text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif", color: '#8A8273' }}>
        {step === 'request'
          ? "Enter your email and we'll send you a 6-digit code to reset your password."
          : `We sent a code to ${email}. Enter it below along with your new password.`}
      </p>

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="forgot-email" className={labelClass} style={labelStyle}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'forgot-email-error' : undefined}
              className="border rounded px-3 py-2 outline-none focus:ring-2"
              style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
            />
            {emailError && (
              <p id="forgot-email-error" className="text-sm" style={{ color: '#D97B3F' }}>
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded px-3 py-2.5 text-white mt-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
          >
            {loading ? 'Sending...' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="reset-code" className={labelClass} style={labelStyle}>
              Reset code
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!!codeError}
              aria-describedby={codeError ? 'reset-code-error' : undefined}
              className="border rounded px-3 py-2 outline-none focus:ring-2 tracking-[0.3em]"
              style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
            />
            {codeError && (
              <p id="reset-code-error" className="text-sm" style={{ color: '#D97B3F' }}>
                {codeError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="reset-password" className={labelClass} style={labelStyle}>
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'reset-password-error' : undefined}
              className="border rounded px-3 py-2 outline-none focus:ring-2"
              style={{ ...inputStyle, '--tw-ring-color': '#2F6F4F' } as React.CSSProperties}
            />
            {passwordError && (
              <p id="reset-password-error" className="text-sm" style={{ color: '#D97B3F' }}>
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded px-3 py-2.5 text-white mt-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>

          <button
            type="button"
            onClick={() => setStep('request')}
            className="text-sm underline self-start"
            style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}
          >
            ← Use a different email
          </button>
        </form>
      )}

      <div
        className="mt-6 pt-5 text-center"
        style={{ borderTop: '1px solid #E4DCC9', fontFamily: "'Inter', sans-serif" }}
      >
        <p className="text-sm" style={{ color: '#1F2A24' }}>
          Remembered it?{' '}
          <Link to="/login" className="font-medium underline" style={{ color: '#2F6F4F' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
