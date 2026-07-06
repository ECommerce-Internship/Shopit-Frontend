type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

// Reusable animated-pulse placeholder block. Matches the warm neutral tone
// already used by ProductCardSkeleton rather than Tailwind's default gray,
// so it reads as part of the app rather than a generic placeholder.
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: '#EFE9DC', ...style }}
    />
  );
}

// A row of skeleton cells matching a CSS-grid table layout — pass the same
// gridTemplateColumns used by the real rows so placeholders line up exactly.
export function SkeletonTableRow({
  gridTemplateColumns,
  cellCount,
  padding = '16px 22px',
}: {
  gridTemplateColumns: string;
  cellCount: number;
  padding?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        gap: '14px',
        padding,
        borderBottom: '1px solid #F1EAD9',
      }}
    >
      {Array.from({ length: cellCount }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: i === 0 ? '60%' : '80%' }} />
      ))}
    </div>
  );
}
