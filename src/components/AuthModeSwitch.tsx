export type AuthMode = 'customer' | 'seller';

/** Accent color the auth pages theme themselves with per mode. */
export function authAccent(mode: AuthMode): string {
  return mode === 'seller' ? '#D97B3F' : '#2F6F4F';
}

/**
 * Customer / Seller segmented switch used on the sign-in and registration
 * pages: a colored pill slides between the two options. Presentation-only —
 * the page decides what changing the mode means.
 */
export function AuthModeSwitch({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="relative grid grid-cols-2 rounded-full p-1 mb-6"
      style={{ backgroundColor: '#F0ECE2' }}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full shadow-sm"
        style={{
          width: 'calc(50% - 4px)',
          backgroundColor: authAccent(mode),
          transform: mode === 'seller' ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.3s ease',
        }}
      />
      {(['customer', 'seller'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className="relative z-10 py-1.5 text-sm rounded-full"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: mode === m ? '#FFFFFF' : '#8A8273',
            transition: 'color 0.3s ease',
          }}
        >
          {m === 'customer' ? 'Customer' : 'Seller'}
        </button>
      ))}
    </div>
  );
}
