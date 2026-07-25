import { useEffect, useRef } from 'react';
import { recordProductClick, recordTimeSpent } from '../api/productAnalyticsApi';

// Drives the two record-side analytics signals for a product page:
//   • a single click/view when the page is opened, and
//   • the dwell time when the visitor leaves it.
//
// Dwell time is flushed once — whichever comes first: the tab being hidden
// (pagehide / visibility change, which catches tab close and mobile
// backgrounding) or the component unmounting (in-app navigation). A guard keeps
// those paths from double-counting the same visit.
export function useProductPageAnalytics(productId: number | undefined): void {
  const startedAtRef = useRef(0);
  const flushedRef = useRef(false);

  useEffect(() => {
    if (!productId) return;

    startedAtRef.current = Date.now();
    flushedRef.current = false;
    recordProductClick(productId);

    const flush = () => {
      if (flushedRef.current) return;
      flushedRef.current = true;
      const durationMs = Date.now() - startedAtRef.current;
      if (durationMs > 0) recordTimeSpent(productId, durationMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
      flush();
    };
  }, [productId]);
}
