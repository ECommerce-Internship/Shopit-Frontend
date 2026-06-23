export function ProductCardSkeleton() {
  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col animate-pulse"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
    >
      <div className="aspect-square" style={{ backgroundColor: '#F0ECE2' }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-1/3 rounded" style={{ backgroundColor: '#EFE9DC' }} />
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: '#EFE9DC' }} />
        <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#EFE9DC' }} />
        <div className="h-5 w-2/5 rounded mt-2" style={{ backgroundColor: '#EFE9DC' }} />
      </div>
    </div>
  );
}