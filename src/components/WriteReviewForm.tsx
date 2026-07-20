import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReview } from '../api/reviewsApi';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '28px',
            color: star <= (hovered || value) ? '#D97B3F' : '#D9CFC0',
            transition: 'color 0.1s',
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
      {value === 0 && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#A89F8B', marginLeft: '4px' }}>
          Tap to rate
        </span>
      )}
    </div>
  );
}

function WriteReviewForm({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const MAX_CHARS = 500;

  const submitMutation = useMutation({
    mutationFn: () => submitReview(productId, rating, comment),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', String(productId)] });
      setRating(0);
      setComment('');
      setSubmittedStatus(created.status);
      toast.success('Review submitted!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message ?? 'Could not submit review. You may have already reviewed this product.';
      toast.error(msg);
    },
  });

  if (submittedStatus === 'Approved') {
    return (
      <div
        style={{
          padding: '28px',
          borderRadius: '16px',
          backgroundColor: '#F0F6F2',
          border: '1px solid #cfe2d5',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', backgroundColor: '#E3EEE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={18} color="#2F6F4F" />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px', color: '#1F2A24', margin: '0 0 6px' }}>
            Your review is live
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13.5px', color: '#5c5648', margin: 0, lineHeight: 1.5 }}>
            Thanks for sharing your feedback — it's now visible on this product's page.
          </p>
        </div>
      </div>
    );
  }

  if (submittedStatus) {
    return (
      <div
        style={{
          padding: '28px',
          borderRadius: '16px',
          backgroundColor: '#F7F3E9',
          border: '1px solid #E4DCC9',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', backgroundColor: '#EFE4CB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={18} color="#A87420" />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px', color: '#1F2A24', margin: '0 0 6px' }}>
            Your review is pending moderation
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13.5px', color: '#5c5648', margin: 0, lineHeight: 1.5 }}>
            Thanks for sharing your feedback. It will appear publicly once it's been reviewed, usually within a short while.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '28px',
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E4DCC9',
        marginTop: '24px',
      }}
    >
      <div style={{ ...labelMono, marginBottom: '6px' }}>Your Review</div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '22px', color: '#1F2A24', margin: '0 0 20px' }}>
        Write a Review
      </h3>

      {/* Rating */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ ...labelMono, marginBottom: '10px' }}>Rating</div>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Comment */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ ...labelMono, marginBottom: '10px' }}>Comment</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Share your thoughts..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #E4DCC9',
            backgroundColor: '#FBF7F0',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#1F2A24',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#A89F8B' }}>
          Reviews are public and tied to your verified purchase.
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#A89F8B' }}>
          {comment.length}/{MAX_CHARS}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => submitMutation.mutate()}
          disabled={rating === 0 || submitMutation.isPending}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: rating === 0 ? '#A8C4B4' : '#2F6F4F',
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: rating === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s',
          }}
        >
          {submitMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Submit Review
        </button>
      </div>
    </div>
  );
}

export default WriteReviewForm;
