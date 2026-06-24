import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchProfile, updateProfile, changePassword } from '../api/profileApi';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  color: '#8A8273',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};
const inputStyle = {
  ...inkText,
  border: '1px solid #E4DCC9',
  backgroundColor: '#FFFFFF',
};
const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E4DCC9',
};

// Mirrors the backend ChangePasswordRequestValidator rules.
function validateNewPassword(password: string): string | null {
  if (password.length < 8) return 'New password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'New password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'New password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'New password must contain at least one number.';
  return null;
}

// Pulls a human-readable message out of an axios error, handling both
// ProblemDetails `detail` and the validation `errors` object shapes.
function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data as
    | { detail?: string; errors?: Record<string, string[]> }
    | undefined;

  if (data?.detail) return data.detail;

  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    const firstMessage = firstKey ? data.errors[firstKey]?.[0] : undefined;
    if (firstMessage) return firstMessage;
  }

  return fallback;
}

function AccountPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhoneNumber(profile.phone ?? '');
    }
  }, [profile]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      toast.success('Profile updated!');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Could not update profile. Please try again.'));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        toast.error('Current password is incorrect.');
      } else {
        toast.error(extractErrorMessage(err, 'Could not change password. Please try again.'));
      }
    },
  });

  function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim() === '' ? null : phoneNumber.trim(),
    });
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();

    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>Loading your account…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={{ ...inkText, color: '#B14A2D' }}>Could not load your account. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1
          className="text-4xl mb-8"
          style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          My Account
        </h1>

        {/* Profile section */}
        <div className="rounded-lg p-6 mb-6" style={cardStyle}>
          <h2
            className="text-xl mb-5"
            style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Profile
          </h2>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label style={labelMono}>Email</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                disabled
                className="px-3 py-2 rounded-md text-sm cursor-not-allowed"
                style={{ ...inputStyle, backgroundColor: '#F0ECE2', color: '#8A8273' }}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label style={labelMono}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label style={labelMono}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label style={labelMono}>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Not set"
                className="px-3 py-2 rounded-md text-sm"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2.5 rounded-md text-sm w-fit disabled:opacity-50"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change password section — hidden for SSO-only users with no password */}
        {profile.hasPassword ? (
          <div className="rounded-lg p-6" style={cardStyle}>
            <h2
              className="text-xl mb-5"
              style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label style={labelMono}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label style={labelMono}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
                  At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label style={labelMono}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-5 py-2.5 rounded-md text-sm w-fit disabled:opacity-50"
                style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
              >
                {changePasswordMutation.isPending ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-lg p-6" style={cardStyle}>
            <h2
              className="text-xl mb-2"
              style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Change Password
            </h2>
            <p className="text-sm" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
              Your account uses Google sign-in, so there's no password to change.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountPage;