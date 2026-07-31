import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

/**
 * Floating button that toggles the chat panel open/closed (SCRUM-110).
 * Rendered in the main app layout, gated on the logged-in user there —
 * this component itself doesn't check auth, it's simply not mounted for
 * unauthenticated users.
 *
 * The panel stays mounted across toggles so the message thread is kept;
 * open/close is animated purely via the isOpen prop (see .chat-panel in
 * index.css). Clicking anywhere outside the panel/button closes it.
 */
export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      <ChatPanel isOpen={isOpen} />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        className="chat-toggle fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl z-50"
        style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF' }}
      >
        <span className={`chat-toggle-icon ${isOpen ? 'chat-toggle-icon-hidden' : ''}`} aria-hidden="true">
          <MessageCircle size={24} />
        </span>
        <span className={`chat-toggle-icon ${isOpen ? '' : 'chat-toggle-icon-hidden'}`} aria-hidden="true">
          <X size={24} />
        </span>
      </button>
    </div>
  );
}
