export type Store = {
  id: number;
  name: string;
  ownerId: number;
  ownerName: string;
};

// Store moderation states, mirroring the backend StoreStatus enum (string over the wire).
export type StoreStatus = 'Pending' | 'Approved' | 'Suspended' | 'Rejected';

// Full store projection for the admin moderation UI (matches AdminStoreDetailResponse).
export type AdminStore = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: StoreStatus;
  ownerId: number;
  ownerName: string;
  createdAt: string;
};
