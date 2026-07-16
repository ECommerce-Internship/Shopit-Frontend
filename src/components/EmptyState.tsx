import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCtaClick?: () => void;
};

// Shared empty-state block: icon, title, optional description, and an
// optional CTA that's either a route Link (ctaTo) or a click handler
// (onCtaClick) — e.g. "Reset Filters" is an action, "Shop Now" is a route.
export function EmptyState({ icon, title, description, ctaLabel, ctaTo, onCtaClick }: EmptyStateProps) {
  const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
  const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };

  return (
    <div
      className="flex flex-col items-center justify-center text-center gap-3"
      style={{ padding: '64px 24px' }}
    >
      <div className="mb-1">{icon}</div>
      <p className="text-lg" style={{ ...inkText, fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-sm" style={mutedText}>
          {description}
        </p>
      )}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-2 px-6 py-3 rounded-md text-sm"
          style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="mt-2 px-6 py-3 rounded-md text-sm"
          style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer' }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
