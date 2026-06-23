export type Review = {
  id: number;
  productId: number;
  userId: number;
  reviewerFirstName: string;
  reviewerLastName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ProductReviews = {
  productId: number;
  averageRating: number;
  totalCount: number;
  reviews: Review[];
};