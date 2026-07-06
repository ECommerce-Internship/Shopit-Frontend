import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

/**
 * Floating button that toggles the chat panel open/closed (SCRUM-110).
 * Rendered in the main app layout, gated on the logged-in user there —
 * this component itself doesn't check auth, it's simply not mounted for
 * unauthenticated users.
 */
export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={isOpen ? "" : "hidden"}>
        <ChatPanel />
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-50"
        style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF' }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
