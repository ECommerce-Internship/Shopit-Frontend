import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminTabs } from '../components/AdminTabs';
import axiosInstance from '../api/axiosInstance';
import { adminDeleteReview } from '../api/reviewsApi';
import type { Review } from '../types/review';

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
        <span key={star} style={{ fontSize: '14px', color: star <= rating ? '#D97B3F' : '#D9CFC0' }}>★</span>
      ))}
    </div>
  );
}

function DeleteModal({ review, onConfirm, onCancel, isPending }: {
  review: Review;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B14A2D', fontSize: '22px' }}>🗑</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Delete Review</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', lineHeight: 1.1, margin: '0 0 12px', color: '#1F2A24' }}>Delete this review?</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 26px', maxWidth: '300px' }}>
          By <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>{review.reviewerFirstName} {review.reviewerLastName}</span>. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

type AllReviewsResponse = {
  reviews: Review[];
  totalCount: number;
};

async function fetchAllReviews(page: number): Promise<AllReviewsResponse> {
  const response = await axiosInstance.get<AllReviewsResponse>('/api/v1/reviews', {
    params: { PageNumber: page, PageSize: 10 },
  });
  return response.data;
}

function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: () => fetchAllReviews(page),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => adminDeleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
      toast.success('Review deleted.');
    },
    onError: () => {
      toast.error('Could not delete review.');
    },
  });

  const reviews = data?.reviews ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      {selectedReview && (
        <DeleteModal
          review={selectedReview}
          onConfirm={() => deleteMutation.mutate(selectedReview.id)}
          onCancel={() => setSelectedReview(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Reviews" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '8px' }}>Shopit Admin</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Reviews</h1>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Head row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.2fr 1fr 1fr 0.8fr', gap: '16px', padding: '14px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', ...labelMono }}>
            <div>Review ID</div>
            <div>Product</div>
            <div>Reviewer</div>
            <div>Rating</div>
            <div>Date</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={24} className="animate-spin" color="#8A8273" />
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <p style={{ color: '#8A8273' }}>No reviews found.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.2fr 1fr 1fr 0.8fr', gap: '16px', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #F1EAD9' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273' }}>#RV-{review.id.toString().padStart(4, '0')}</div>
                <div style={{ fontSize: '13.5px', color: '#1F2A24', fontWeight: 600 }}>Product #{review.productId}</div>
                <div>
                  <div style={{ fontSize: '13.5px', color: '#1F2A24', fontWeight: 600 }}>{review.reviewerFirstName} {review.reviewerLastName}</div>
                </div>
                <div><StarDisplay rating={review.rating} /></div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{formatDate(review.createdAt)}</div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedReview(review)}
                    style={{ border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B14A2D', borderRadius: '9px', padding: '8px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px' }}>
            <div style={{ fontSize: '12.5px', color: '#8A8273' }}>Showing {reviews.length} of {totalCount} reviews</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page === 1 ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page >= totalPages ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReviewsPage;