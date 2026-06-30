import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerSeller } from '../api/SellerApi';
import { useAuth } from '../context/AuthContext';
import { getRedirectPathForRole } from '../context/AuthContext';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function SellerRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    storeName: '',
    storeDescription: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const registerMutation = useMutation({
    mutationFn: () => registerSeller({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      storeName: form.storeName,
      storeDescription: form.storeDescription || undefined,
    }),
    onSuccess: (data) => {
      const authUser = login(data);
      toast.success('Welcome! Your store is pending approval.');
      navigate(getRedirectPathForRole(authUser.role));
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    },
  });

  const isValid = form.firstName && form.lastName && form.email && form.password && form.storeName;

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 500, color: '#1F2A24', textDecoration: 'none' }}>
            Shopit
          </Link>
          <div style={{ ...labelMono, marginTop: '16px', marginBottom: '8px' }}>Seller Registration</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', color: '#1F2A24', margin: 0 }}>
            Start selling on Shopit
          </h1>
          <p style={{ ...mutedText, fontSize: '14px', marginTop: '8px' }}>
            Create your seller account and first store in one step.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '32px' }}>

          {/* Personal info section */}
          <div style={{ ...labelMono, marginBottom: '16px' }}>Personal info</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>First name</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Jane"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Last name</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Smith"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Store info section */}
          <div style={{ ...labelMono, marginBottom: '16px' }}>Your store</div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Store name</label>
            <input
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              placeholder="My Awesome Store"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Store description <span style={{ color: '#A89F8B' }}>(optional)</span></label>
            <textarea
              name="storeDescription"
              value={form.storeDescription}
              onChange={handleChange}
              placeholder="Tell customers what you sell..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <button
            onClick={() => registerMutation.mutate()}
            disabled={!isValid || registerMutation.isPending}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: isValid ? '#2F6F4F' : '#A8C4B4', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, cursor: isValid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {registerMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Create seller account
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ ...mutedText, fontSize: '13px' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500 }}>
              Sign in
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', ...mutedText, fontSize: '12px', marginTop: '16px' }}>
          Already a customer?{' '}
          <Link to="/register" style={{ color: '#2F6F4F', fontSize: '12px' }}>Create a regular account</Link>
        </p>
      </div>
    </div>
  );
}

export default SellerRegisterPage;