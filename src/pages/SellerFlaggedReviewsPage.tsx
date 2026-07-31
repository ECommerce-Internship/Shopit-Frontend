import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { fetchMyFlaggedReviews } from '../api/reviewsApi';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ fontSize: '13px', color: star <= rating ? '#D97B3F' : '#D9CFC0' }}>★</span>
      ))}
    </div>
  );
}

function SellerFlaggedReviewsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-flagged-reviews', page],
    queryFn: () => fetchMyFlaggedReviews(page),
  });

  const reviews = data?.reviews ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link to="/seller" style={{ color: '#2F6F4F', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>← Back to Seller Dashboard</Link>

        <div style={{ marginTop: '16px', marginBottom: '24px' }}>
          <div style={{ ...labelMono, marginBottom: '8px' }}>Shopit Seller</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '30px', lineHeight: 1, margin: 0 }}>Flagged Reviews</h1>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#8A8273' }}>
            Reviews on your products that were flagged or rejected during moderation. These are hidden from public view and shown here for visibility only.
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={24} className="animate-spin" color="#8A8273" />
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px' }}>
              <AlertTriangle size={22} color="#C2BBAA" />
              <p style={{ color: '#8A8273', margin: 0 }}>No flagged or rejected reviews on your products.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={{ padding: '18px 22px', borderBottom: '1px solid #F1EAD9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>#RV-{review.id.toString().padStart(4, '0')}</span>
                    <span style={{ ...labelMono, backgroundColor: review.status === 'Flagged' ? '#FBEEE8' : '#F1EAE3', color: review.status === 'Flagged' ? '#B14A2D' : '#8A6A56', padding: '4px 10px', borderRadius: '999px' }}>{review.status}</span>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#5c5648' }}>{formatDate(review.createdAt)}</span>
                </div>
                <div style={{ marginBottom: '6px' }}><StarDisplay rating={review.rating} /></div>
                {review.comment && (
                  <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#1F2A24' }}>{review.comment}</p>
                )}
                {review.moderationReason && (
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#8A8273', fontStyle: 'italic' }}>Reason: {review.moderationReason}</p>
                )}
              </div>
            ))
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px' }}>
            <div style={{ fontSize: '12.5px', color: '#8A8273' }}>Showing {reviews.length} of {totalCount}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page === 1 ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontSize: '12.5px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page >= totalPages ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontSize: '12.5px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerFlaggedReviewsPage;
