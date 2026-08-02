import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Upload, X, Sparkles } from 'lucide-react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { searchByImage } from '../api/imageSearchApi';
import type { ImageSearchMatch } from '../types/imageSearch';

const INK = '#1F2A24';
const GREEN = '#2F6F4F';
const ORANGE = '#D97B3F';
const MAX_BYTES = 20 * 1024 * 1024; // matches the backend's 20MB limit
const gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

// Turns a 0..1 cosine score into a friendly percentage for the match badge.
function formatScore(score: number): string {
  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}% match`;
}

export default function VisualSearchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const searchMutation = useMutation({
    mutationFn: (file: File) => searchByImage(file, 12),
    onError: (err: unknown) => {
      if (err instanceof AxiosError && err.response?.status === 429) {
        toast.error('Too many searches — please wait a moment and try again.');
        return;
      }
      if (err instanceof AxiosError && err.response?.status === 502) {
        toast.error('The image recognition service is unavailable right now.');
        return;
      }
      toast.error('Could not search by image. Please try another photo.');
    },
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 20MB or less.');
      return;
    }

    // Revoke the previous object URL before replacing it, to avoid leaking blobs.
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    searchMutation.mutate(file);
  }

  function reset() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(null);
    searchMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  const matches: ImageSearchMatch[] = searchMutation.data?.matches ?? [];
  const hasSearched = searchMutation.isSuccess || searchMutation.isPending;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={26} color={GREEN} />
          <h1 className="text-4xl" style={{ color: INK, fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
            Search by Photo
          </h1>
        </div>
        <p className="mb-8" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
          Snap or upload a photo of a product and we&apos;ll find the visually closest matches in the catalog.
        </p>

        {/* Hidden inputs — one for gallery upload, one that opens the camera on mobile. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Upload panel */}
        <div
          className="rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-6"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}
        >
          {preview ? (
            <div className="relative shrink-0">
              <img
                src={preview}
                alt={fileName ?? 'Query'}
                className="rounded-xl object-cover"
                style={{ width: '160px', height: '160px', border: '1px solid #E4DCC9' }}
              />
              <button
                onClick={reset}
                aria-label="Clear image"
                className="absolute -top-2 -right-2 flex items-center justify-center rounded-full"
                style={{ width: '28px', height: '28px', background: ORANGE, color: '#FFF', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl flex items-center justify-center shrink-0"
              style={{ width: '160px', height: '160px', background: '#F7F3EC', border: '1px dashed #C9BFA8' }}
            >
              <Camera size={40} color="#C9BFA8" />
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm"
                style={{ background: GREEN, color: '#FFF', fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer' }}
              >
                <Upload size={16} /> Upload a photo
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm"
                style={{ background: '#FFF', color: GREEN, fontFamily: "'Inter', sans-serif", border: `1px solid ${GREEN}`, cursor: 'pointer' }}
              >
                <Camera size={16} /> Use camera
              </button>
            </div>
            <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
              JPG or PNG, up to 20MB. {fileName && <span style={{ color: INK }}>Selected: {fileName}</span>}
            </p>
          </div>
        </div>

        {/* Results */}
        {searchMutation.isPending ? (
          <div className={gridClass}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} view="grid" />
            ))}
          </div>
        ) : searchMutation.isSuccess && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
              No visual matches found. The catalog may not be indexed yet — an admin can run a re-index.
            </p>
          </div>
        ) : matches.length > 0 ? (
          <>
            <p className="mb-4" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {matches.length} results · ranked by visual similarity
            </p>
            <div className={gridClass}>
              {matches.map((match) => (
                <div key={match.product.id} className="relative">
                  <span
                    className="absolute z-10 flex items-center rounded-full"
                    style={{ top: '10px', left: '10px', padding: '3px 10px', background: GREEN, color: '#FFF', fontSize: '11px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                  >
                    {formatScore(match.score)}
                  </span>
                  <ProductCard product={match.product} />
                </div>
              ))}
            </div>
          </>
        ) : (
          !hasSearched && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
                Your visual matches will appear here.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
