import { Loader2, X, CheckCircle2, RotateCcw } from 'lucide-react';
import type { ProductContentResponse } from '../api/aiApi';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '11px',
      color: over ? '#B14A2D' : '#2F6F4F',
      fontWeight: 500,
    }}>
      {len}/{max}
    </span>
  );
}

type Props = {
  open: boolean;
  generated: ProductContentResponse | null;
  isRegenerating: boolean;
  onClose: () => void;
  onUseContent: (content: ProductContentResponse) => void;
  onRegenerate: () => void;
};

export function GenerateContentDrawer({
  open,
  generated,
  isRegenerating,
  onClose,
  onUseContent,
  onRegenerate,
}: Props) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(31,42,36,0.32)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61,
        width: '480px', maxWidth: '100vw',
        background: '#FFFFFF',
        borderLeft: '1px solid #E4DCC9',
        boxShadow: '-8px 0 40px rgba(31,42,36,0.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E4DCC9',
          background: '#FBF7F0', flexShrink: 0,
        }}>
          <div>
            <div style={{ ...labelMono, color: '#7B5EA7', marginBottom: '4px' }}>✨ AI Generated</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0, color: '#1F2A24' }}>
              Generated Content
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A8273' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {isRegenerating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 0' }}>
              <Loader2 size={28} className="animate-spin" color="#7B5EA7" />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8A8273' }}>
                Generating with AI...
              </span>
            </div>
          ) : generated ? (
            <>
              {/* Description */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={labelMono}>Description</div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#8A8273' }}>
                    {generated.description.split(' ').length} words
                  </span>
                </div>
                <div style={{
                  padding: '14px', borderRadius: '12px',
                  background: '#F7FAF8', border: '1px solid #cfe2d5',
                  fontSize: '13.5px', lineHeight: 1.6, color: '#1F2A24',
                }}>
                  {generated.description}
                </div>
              </div>

              {/* Key Features */}
              <div>
                <div style={{ ...labelMono, marginBottom: '8px' }}>Key Features</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {generated.features.map((feat, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                      padding: '10px 12px', borderRadius: '10px',
                      background: '#F7FAF8', border: '1px solid #cfe2d5',
                      fontSize: '13.5px', color: '#1F2A24',
                    }}>
                      <CheckCircle2 size={15} color="#2F6F4F" style={{ flexShrink: 0, marginTop: '2px' }} />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Title */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={labelMono}>SEO Title</div>
                  <CharCounter value={generated.seoTitle} max={60} />
                </div>
                <div style={{
                  padding: '12px 14px', borderRadius: '12px',
                  background: '#F7FAF8', border: '1px solid #cfe2d5',
                  fontSize: '13.5px', color: '#1F2A24', fontWeight: 500,
                }}>
                  {generated.seoTitle}
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={labelMono}>Meta Description</div>
                  <CharCounter value={generated.metaDescription} max={155} />
                </div>
                <div style={{
                  padding: '12px 14px', borderRadius: '12px',
                  background: '#F7FAF8', border: '1px solid #cfe2d5',
                  fontSize: '13px', lineHeight: 1.6, color: '#5c5648',
                }}>
                  {generated.metaDescription}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: '#FBF3DE', border: '1px solid #ecd9a3',
                fontSize: '12px', color: '#9A7B16',
                fontFamily: "'Inter', sans-serif",
              }}>
                ⚠️ AI-generated content should be reviewed before saving.
              </div>
            </>
          ) : null}
        </div>

        {/* Footer actions */}
        {generated && !isRegenerating && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #E4DCC9',
            display: 'flex', gap: '10px', flexShrink: 0,
            background: '#FFFFFF',
          }}>
            <button
              onClick={onRegenerate}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '11px 16px', borderRadius: '10px',
                border: '1px solid #E4DCC9', background: '#FFFFFF',
                fontFamily: "'Inter', sans-serif", fontSize: '13.5px', fontWeight: 500,
                color: '#1F2A24', cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              Regenerate
            </button>
            <button
              onClick={() => onUseContent(generated)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '11px 16px', borderRadius: '10px',
                border: 'none', background: '#7B5EA7',
                fontFamily: "'Inter', sans-serif", fontSize: '13.5px', fontWeight: 600,
                color: '#FFFFFF', cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={14} />
              Use This Content
            </button>
          </div>
        )}
      </div>
    </>
  );
}