import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation.
    if (hasRun.current) return;
    hasRun.current = true;

    const error = searchParams.get('error');
    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const role = searchParams.get('role');

    if (!accessToken || !refreshToken || !userId || !email) {
      toast.error('Google login failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    login({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        role: role ?? 'Customer',
      },
    });

    navigate('/', { replace: true });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
      <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>Signing you in…</p>
    </div>
  );
}

export default GoogleCallbackPage;