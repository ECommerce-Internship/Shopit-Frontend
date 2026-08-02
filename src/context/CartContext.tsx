import { createContext, useContext, useState, type ReactNode } from 'react';
import { guestCartCount } from '../lib/guestCart';

type CartContextType = {
  itemCount: number;
  setItemCount: (count: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Seed from any guest cart so the badge is correct on first paint / reload.
  const [itemCount, setItemCount] = useState(() => guestCartCount());

  return (
    <CartContext.Provider value={{ itemCount, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}