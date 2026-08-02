import type { Product } from '../types/product';

// Extracts the most meaningful words from a product's name + category to use as
// LoremFlickr tags — drops punctuation and short filler so the photo actually
// resembles the product rather than a generic grey box.
function productKeywords(product: Pick<Product, 'name' | 'categoryName'>): string {
  const words = `${product.name} ${product.categoryName ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);

  return words.length > 0 ? words.join(',') : 'product';
}

// Builds a keyword-based photo URL for products that have no uploaded image.
// LoremFlickr returns a real Flickr photo matching the given keywords. The
// `lock` seed keeps the same image stable across reloads instead of shuffling
// on every render.
function keywordImage(
  product: Pick<Product, 'id' | 'name' | 'categoryName'>,
  seed: number = product.id,
  size: number = 400,
): string {
  return `https://loremflickr.com/${size}/${size}/${encodeURIComponent(productKeywords(product))}?lock=${seed}`;
}

// Returns the product's own image when it has one, otherwise a photo that looks
// like the product based on its name and category.
export function getProductImageUrl(
  product: Pick<Product, 'id' | 'name' | 'categoryName' | 'imageUrl'>,
): string {
  return product.imageUrl?.trim() ? product.imageUrl : keywordImage(product);
}

// Builds a small image gallery for the detail page. The backend stores a single
// image per product, so extra angles aren't available — we fill the gallery with
// keyword-based variants (distinct seeds) from the same LoremFlickr source the
// rest of the app uses, so shoppers have multiple images to browse. The real
// uploaded image, when present, stays first as the primary shot.
export function getProductGallery(
  product: Pick<Product, 'id' | 'name' | 'categoryName' | 'imageUrl'>,
  count: number = 4,
): string[] {
  const images: string[] = [];
  const real = product.imageUrl?.trim();
  if (real) images.push(real);

  // Distinct seeds derived from the product id keep the set stable per product
  // while differing from the listing thumbnail's seed (which is the bare id).
  let seed = product.id * 100;
  while (images.length < count) {
    images.push(keywordImage(product, seed, 800));
    seed += 1;
  }
  return images;
}
