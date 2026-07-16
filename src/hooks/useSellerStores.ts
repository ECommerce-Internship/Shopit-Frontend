import { useQuery } from '@tanstack/react-query';
import { getMyStores } from '../api/SellerApi';

// Shared across every seller product/inventory screen: which of the seller's
// stores can currently be sold from. Only an Approved store may have its
// products/inventory managed (SCRUM-145) — Pending/Suspended/Rejected stores
// are read-only until an admin approves them.
export function useSellerStores() {
  const query = useQuery({
    queryKey: ['my-stores'],
    queryFn: getMyStores,
  });

  const stores = query.data ?? [];
  const approvedStores = stores.filter((s) => s.status === 'Approved');

  return {
    ...query,
    stores,
    approvedStores,
    hasApprovedStore: approvedStores.length > 0,
  };
}
