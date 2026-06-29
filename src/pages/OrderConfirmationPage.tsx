import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { getOrderById } from 'C:/Users/User/Desktop/Internship Aspire/Shopit/Shopit-Frontend/src/api/orderApi.ts';

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

function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={mutedText}>Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={{ ...inkText, color: '#B14A2D' }}>Order not found.</p>
        <Link to="/products" style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const shortId = `#${order.id.toString().padStart(8, '0')}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Success header */}
        <div className="flex flex-col items-center text-center mb-10">
          <CheckCircle2 size={56} color="#2F6F4F" className="mb-4" />
          <h1
            className="text-3xl mb-2"
            style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Thank you for your order!
          </h1>
          <p className="text-sm" style={mutedText}>
            Order {shortId} has been placed successfully.
          </p>
          <p className="text-sm mt-1" style={mutedText}>
            A confirmation email has been sent to your inbox.
          </p>
        </div>

        {/* Order details card */}
        <div
          className="p-6 rounded-lg mb-6"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
        >
          <p style={labelMono} className="mb-4">Items ordered</p>

          <div className="flex flex-col gap-3 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm" style={inkText}>
                <span style={mutedText}>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col gap-3 pt-4"
            style={{ borderTop: '1px solid #E4DCC9' }}
          >
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={mutedText}>Discount</span>
                <span style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>
                  −{formatPrice(order.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-base font-medium" style={inkText}>Total paid</span>
              <span
                className="text-lg font-medium"
                style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif" }}
              >
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div
          className="p-6 rounded-lg mb-8"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
        >
          <p style={labelMono} className="mb-2">Shipping to</p>
          <p className="text-sm" style={inkText}>{order.shippingAddress}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/orders"
            className="flex-1 text-center px-6 py-3 rounded-md text-sm"
            style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
          >
            View my orders
          </Link>
          <Link
            to="/products"
            className="flex-1 text-center px-6 py-3 rounded-md text-sm"
            style={{ border: '1px solid #E4DCC9', backgroundColor: '#FFFFFF', ...inkText }}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;