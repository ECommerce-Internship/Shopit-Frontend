import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCart } from '../api/cartApi';
import { placeOrder, processPayment } from '../api/orderApi';

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

const PAYMENT_METHODS = [
  { label: 'Credit Card', value: 0, icon: CreditCard },
  { label: 'Debit Card', value: 0, icon: CreditCard },
  { label: 'PayPal', value: 2, icon: Wallet },
];

type ShippingForm = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingForm>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState(0);
  const [outOfStockError, setOutOfStockError] = useState<string | null>(null);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const shippingAddress = `${form.street}, ${form.city}, ${form.state} ${form.postalCode}, ${form.country}`;
      const order = await placeOrder(shippingAddress);
      await processPayment(order.id, paymentMethod);
      return order;
    },
    onSuccess: (order) => {
      navigate(`/orders/${order.id}/confirmation`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 400) {
        const msg = err?.response?.data?.message ?? 'Some items are out of stock.';
        setOutOfStockError(msg);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid =
    form.street.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    form.country.trim();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <p style={mutedText}>Loading…</p>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1
          className="text-3xl mb-8"
          style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — shipping + payment */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Shipping address */}
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
            >
              <p style={labelMono} className="mb-4">Shipping address</p>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm mb-1" style={mutedText}>Street</label>
                  <input
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="123 Main St"
                    required
                    className="w-full px-3 py-2 text-sm rounded-md"
                    style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={mutedText}>City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="New York"
                      required
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={mutedText}>State / Region</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="NY"
                      required
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={mutedText}>Postal code</label>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      placeholder="10001"
                      required
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={mutedText}>Country</label>
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="United States"
                      required
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
            >
              <p style={labelMono} className="mb-4">Payment method</p>

              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon; 
                  return (
                    <label
                      key={method.label}
                      className="flex items-center gap-3 p-3 rounded-md cursor-pointer"
                      style={{
                        border: `1px solid ${paymentMethod === method.value && method.label !== 'Debit Card' || (method.label === 'Credit Card' && paymentMethod === 0) ? '#2F6F4F' : '#E4DCC9'}`,
                        backgroundColor: '#FBF7F0',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={
                          method.label === 'Credit Card'
                            ? paymentMethod === 0
                            : method.label === 'PayPal'
                            ? paymentMethod === 2
                            : false
                        }
                        onChange={() => setPaymentMethod(method.value)}
                        className="accent-green-700"
                      />
                      <Icon size={16} color="#8A8273" />
                      <span className="text-sm" style={inkText}>{method.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Out of stock error */}
            {outOfStockError && (
              <div
                className="p-4 rounded-md text-sm"
                style={{ backgroundColor: '#F3E1DC', color: '#B14A2D', fontFamily: "'Inter', sans-serif" }}
              >
                {outOfStockError}
              </div>
            )}
          </div>

          {/* Right — order summary */}
          <div
            className="lg:w-72 h-fit p-6 rounded-lg"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
          >
            <h2
              className="text-lg mb-4"
              style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Order summary
            </h2>

            <div className="flex flex-col gap-3 mb-4">
              {items.map((item) => (
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
              <div className="flex justify-between text-sm" style={inkText}>
                <span style={mutedText}>Subtotal</span>
                <span>{formatPrice(cart?.subtotal ?? 0)}</span>
              </div>

              {cart?.couponCode && cart.discountAmount != null && (
                <div className="flex justify-between text-sm">
                  <span style={mutedText}>Discount</span>
                  <span style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>
                    −{formatPrice(cart.discountAmount)}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between pt-3"
                style={{ borderTop: '1px solid #E4DCC9' }}
              >
                <span className="text-base font-medium" style={inkText}>Total</span>
                <span
                  className="text-lg font-medium"
                  style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif" }}
                >
                  {formatPrice(cart?.finalTotal ?? 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={!isFormValid || checkoutMutation.isPending}
              className="mt-6 w-full px-6 py-3 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              {checkoutMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {checkoutMutation.isPending ? 'Placing order…' : 'Place order'}
            </button>

            <Link
              to="/cart"
              className="block text-center text-sm mt-3 underline"
              style={mutedText}
            >
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;