import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product } from '../types/product';

type ProductCardProps = {
  product: Product;
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

export function ProductCard({ product }: ProductCardProps) {
  const stockBadge = getStockBadge(product.stockQuantity);

  return (
    <Link
      to={`/products/${product.id}`}
      className="rounded-lg overflow-hidden flex flex-col"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
    >
      {/* Image or placeholder */}
      <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: '#F0ECE2' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: '#A8A092', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            No Image
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.storeName && (
          <span
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ color: '#D97B3F', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Sold by {product.storeName}
          </span>
        )}

        <h3
          className="text-base leading-snug"
          style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-1">
          <Star size={14} fill="#D97B3F" color="#D97B3F" />
          <span className="text-sm" style={{ color: '#1F2A24', fontFamily: "'Inter', sans-serif" }}>
            {product.averageRating.toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
            ({product.reviewCount})
          </span>
        </div>

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
      </div>
    </Link>
  );
}