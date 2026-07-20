export type Review = {
  id: number;
  productId: number;
  userId: number;
  reviewerFirstName: string;
  reviewerLastName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  status: string;
  moderationReason: string | null;
  moderatedAt: string | null;
  moderationScore: number | null;
};
export type ProductReviews = {
  productId: number;
  averageRating: number;
  totalCount: number;
  reviews: Review[];
};