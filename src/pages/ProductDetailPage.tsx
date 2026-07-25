import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Star, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductById } from '../api/productsApi';
import { fetchProductReviews } from '../api/reviewsApi';
import { addCartItem } from '../api/cartApi';
import { useCart } from '../context/CartContext';
import WriteReviewForm from '../components/WriteReviewForm';
import { useAuth } from '../context/AuthContext';
import { useProductPageAnalytics } from '../hooks/useProductPageAnalytics';
import { Skeleton } from '../components/Skeleton';


const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  color: '#8A8273',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStockBadge(stockQuantity: number): { label: string; bg: string; text: string } {
  if (stockQuantity === 0) {
    return { label: 'Out of Stock', bg: '#F3E1DC', text: '#B14A2D' };
  }
  if (stockQuantity <= 10) {
    return { label: `Low Stock (${stockQuantity} left)`, bg: '#F6EAD2', text: '#A87420' };
  }
  return { label: 'In Stock', bg: '#E3EEE6', text: '#2F6F4F' };
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((starIndex) => {
        const isFilled = starIndex <= Math.floor(rounded);
        const isHalf = !isFilled && starIndex - 0.5 === rounded;
        return (
          <span key={starIndex} className="relative inline-block" style={{ width: 18, height: 18 }}>
            <Star size={18} color="#D9CFC0" />
            {(isFilled || isHalf) && (
              <span
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: isHalf ? '50%' : '100%' }}
              >
                <Star size={18} fill="#D97B3F" color="#D97B3F" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setItemCount } = useCart();
  const [quantity] = useState(1);
  const { user } = useAuth();

  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchProductReviews(id!),
    enabled: !!id,
  });

  // Record a view + measure dwell time once we know the product is real.
  useProductPageAnalytics(product?.id);

  const addToCartMutation = useMutation({
    mutationFn: () => addCartItem(Number(id), quantity),
    onSuccess: (cart) => {
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalItems);
      toast.success('Added to cart!');
    },
    onError: () => {
      toast.error('Could not add to cart. Please try again.');
    },
  });

  useEffect(() => {
    if (!product) return;
    document.title = product.seoTitle || product.name;
    const metaTag = document.querySelector('meta[name="description"]');
    if (metaTag && product.metaDescription) {
      metaTag.setAttribute('content', product.metaDescription);
    }
  }, [product]);

  if (isProductLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-9 w-1/4" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-12 w-40 rounded-md mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProductError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={{ ...inkText, color: '#B14A2D' }}>Product not found.</p>
        <Link to="/products" style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>
          Back to Products
        </Link>
      </div>
    );
  }

  const stockBadge = getStockBadge(product.stockQuantity);
  const reviews = reviewsData?.reviews ?? [];
  const hasAiContent = Boolean(
    product.description ||
    (product.features && product.features.length > 0) ||
    product.seoTitle ||
    product.metaDescription
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        {/* Breadcrumb */}
        <p className="text-sm mb-8" style={mutedText}>
          <Link to="/" style={mutedText}>Home</Link>
          {' > '}
          <span>{product.categoryName}</span>
          {' > '}
          <span style={inkText}>{product.name}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div
            className="aspect-square rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#F0ECE2' }}
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span style={labelMono}>No Image</span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <h1
              className="text-3xl"
              style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              {product.name}
            </h1>


            {product.storeName && product.storeSlug &&(
              <Link
                to={`/stores/${product.storeSlug}`}
                className="text-[11px] uppercase tracking-[0.1em] hover:underline -mt-2"
                style={{ color: '#D97B3F', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Sold by {product.storeName}
              </Link>
          )}

            <div className="flex items-center gap-2">
              <StarRating rating={product.averageRating} />
              <span className="text-sm" style={mutedText}>
                {product.averageRating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            <p
              className="text-3xl"
              style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              {formatPrice(product.price)}
            </p>

            <span
              className="text-[11px] uppercase tracking-[0.08em] px-3 py-1 rounded-full inline-block w-fit"
              style={{ backgroundColor: stockBadge.bg, color: stockBadge.text, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {stockBadge.label}
            </span>

            <button
              onClick={() => addToCartMutation.mutate()}
              disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
              className="px-6 py-3 rounded-md text-sm flex items-center justify-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              {addToCartMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <p style={labelMono}>Description</p>
                {hasAiContent && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#F0ECE2', color: '#8A8273', fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <Sparkles size={10} />
                    AI-enhanced
                  </span>
                )}
              </div>
              {product.description ? (
                <p className="text-sm mt-1 whitespace-pre-line" style={inkText}>{product.description}</p>
              ) : (
                <p className="text-sm mt-1" style={mutedText}>Product details coming soon.</p>
              )}
            </div>

            {product.features && product.features.length > 0 && (
              <div className="mt-2">
                <p style={labelMono}>Key Features</p>
                <ul className="flex flex-col gap-1 text-sm mt-1" style={inkText}>
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 size={16} style={{ color: '#2F6F4F', flexShrink: 0, marginTop: 2 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2
            className="text-2xl mb-6"
            style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Reviews
          </h2>

          {reviews.length === 0 ? (
            <p style={mutedText}>No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="pb-6" style={{ borderBottom: '1px solid #E4DCC9' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ ...inkText, fontWeight: 500 }}>
                      {review.reviewerFirstName} {review.reviewerLastName}
                    </span>
                    <span className="text-xs" style={mutedText}>{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.comment && (
                    <p className="text-sm mt-2" style={inkText}>{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {user && <WriteReviewForm productId={Number(id)} />}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
