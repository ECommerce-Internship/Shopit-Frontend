import { Star } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Product } from '../types/product';
import { Link, useNavigate } from 'react-router-dom';
import { fadeUp, softSpring } from '../lib/motion';

// A router Link that also accepts motion props, so the whole card can lift and
// press as one element while staying a real navigable anchor.
const MotionLink = motion.create(Link);

export type ProductView = 'grid' | 'list';

type ProductCardProps = {
  product: Product;
  view?: ProductView;
};

function getStockBadge(stockQuantity: number): { label: string; bg: string; text: string } {
  if (stockQuantity === 0) {
    return { label: 'Out of Stock', bg: '#F3E1DC', text: '#B14A2D' };
  }
  if (stockQuantity <= 10) {
    return { label: 'Low Stock', bg: '#F6EAD2', text: '#A87420' };
  }
  return { label: 'In Stock', bg: '#E3EEE6', text: '#2F6F4F' };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function ProductCard({ product, view = 'grid' }: ProductCardProps) {
  const stockBadge = getStockBadge(product.stockQuantity);
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  // Physical hover lift + press. Skipped entirely when reduced motion is asked for.
  const hover = prefersReduced ? undefined : { y: -4, boxShadow: '0 14px 30px rgba(31, 42, 36, 0.12)' };
  const tap = prefersReduced ? undefined : { scale: 0.985 };

  const image = (
    <>
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <span
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: '#A8A092', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          No Image
        </span>
      )}
    </>
  );

  const storeLink = product.storeName && product.storeSlug && (
    <span
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/stores/${product.storeSlug}`); }}
      className="text-[11px] uppercase tracking-[0.1em] hover:underline w-fit cursor-pointer"
      style={{ color: '#D97B3F', fontFamily: "'IBM Plex Mono', monospace" }}
    >
      Sold by {product.storeName}
    </span>
  );

  const title = (
    <h3
      className="text-base leading-snug"
      style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
    >
      {product.name}
    </h3>
  );

  const rating = (
    <div className="flex items-center gap-1">
      <Star size={14} fill="#D97B3F" color="#D97B3F" />
      <span className="text-sm" style={{ color: '#1F2A24', fontFamily: "'Inter', sans-serif" }}>
        {product.averageRating.toFixed(1)}
      </span>
      <span className="text-xs" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
        ({product.reviewCount})
      </span>
    </div>
  );

  const priceAndStock = (
    <div className="flex items-center justify-between mt-auto pt-2">
      <span
        className="text-lg"
        style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
      >
        {formatPrice(product.price)}
      </span>
      <span
        className="text-[11px] uppercase tracking-[0.08em] px-2 py-1 rounded-full"
        style={{ backgroundColor: stockBadge.bg, color: stockBadge.text, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {stockBadge.label}
      </span>
    </div>
  );

  if (view === 'list') {
    return (
      <MotionLink
        to={`/products/${product.id}`}
        className="group rounded-lg overflow-hidden flex"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
        variants={fadeUp}
        whileHover={hover}
        whileTap={tap}
        transition={softSpring}
      >
        <div
          className="w-32 sm:w-44 shrink-0 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: '#F0ECE2' }}
        >
          {image}
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
          {storeLink}
          {title}
          {rating}
          {product.description && (
            <p
              className="text-sm line-clamp-2"
              style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}
            >
              {product.description}
            </p>
          )}
          {priceAndStock}
        </div>
      </MotionLink>
    );
  }

  return (
    <MotionLink
      to={`/products/${product.id}`}
      className="group rounded-lg overflow-hidden flex flex-col"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
      variants={fadeUp}
      whileHover={hover}
      whileTap={tap}
      transition={softSpring}
    >
      <div className="aspect-square overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#F0ECE2' }}>
        {image}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {storeLink}
        {title}
        {rating}
        {priceAndStock}
      </div>
    </MotionLink>
  );
}
