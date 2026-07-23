import type { ReactNode } from 'react';

type AuthLayoutProps = {
  eyebrow: string;
  children: ReactNode;
};

export function AuthLayout({ eyebrow, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FBF7F0' }}>
      {/* Brand panel — sticky and viewport-height so its content (logo, tagline)
          stays put when the form side grows taller (e.g. seller registration). */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative lg:sticky lg:top-0 lg:h-screen"
        style={{
          backgroundColor: '#2F6F4F',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.12) 6px, rgba(255,255,255,0.12) 7px)',
          backgroundPosition: 'right',
          backgroundSize: '1px 13px',
          backgroundRepeat: 'repeat-y',
        }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Marketplace · Est. 2026
        </p>

        <div>
          <h1
            className="text-6xl text-white mb-4"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Shopit
          </h1>
          <p
            className="text-base max-w-xs"
            style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif" }}
          >
            Where buyers find what they need, and sellers find who needs it.
          </p>
        </div>

        <p
          className="text-[11px]"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Every transaction starts here.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm relative">
          {/* Ticket notches */}
          <div
            className="absolute rounded-full"
            style={{
              backgroundColor: '#FBF7F0',
              width: '20px',
              height: '20px',
              top: '64px',
              left: '-10px',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              backgroundColor: '#FBF7F0',
              width: '20px',
              height: '20px',
              top: '64px',
              right: '-10px',
            }}
          />

          <div
            className="rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="px-8 pt-6 pb-4">
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: '#2F6F4F', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {eyebrow}
              </p>
            </div>

            <div
              className="border-t-2 border-dashed mx-0"
              style={{ borderColor: '#E4DCC9' }}
            />

            <div className="px-8 py-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}