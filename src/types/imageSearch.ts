import type { Product } from './product';

// One visual-search hit: the matched product plus its cosine similarity score
// against the uploaded photo (1.0 = visually identical direction, ~0 = unrelated).
export type ImageSearchMatch = {
  product: Product;
  score: number;
};

export type ImageSearchResult = {
  matches: ImageSearchMatch[];
};
