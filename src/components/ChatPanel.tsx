import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
};

type ChatApiResponse = {
  reply: string;
  conversationId: string;
};

const panelStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E4DCC9',
};

const userBubbleStyle = {
  backgroundColor: '#2F6F4F',
  color: '#FFFFFF',
  fontFamily: "'Inter', sans-serif",
};

const botBubbleStyle = {
  backgroundColor: '#F0ECE2',
  color: '#1F2A24',
  fontFamily: "'Inter', sans-serif",
};

const timestampStyle = {
  color: '#8A8273',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10px',
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Self-contained chat widget panel (SCRUM-110). Manages its own message
 * thread, input, conversationId, and loading state. Accepts no props.
 *
 * 401 handling: axiosInstance's response interceptor already attempts a
 * token refresh and, on failure, redirects to /login automatically. So a
 * 401 here either resolves transparently (the retried request succeeds and
 * never reaches this component's catch block) or the redirect is already
 * underway by the time it does — no extra toast or navigation is added here
 * to avoid a confusing flash right before the redirect.
 */
export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await axiosInstance.post<ChatApiResponse>('/api/v1/chat', {
        message: trimmed,
        conversationId,
      });

      setConversationId(response.data.conversationId);

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        text: response.data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          toast.error('Connection failed. Please try again.');
        } else if (err.response.status === 429) {
          toast.error("You're sending messages too quickly. Please wait a moment.");
        } else if (err.response.status === 401) {
          // Handled globally by axiosInstance's interceptor (refresh + retry,
          // or redirect to /login on failure) — see component doc comment.
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="fixed bottom-24 right-6 w-96 h-[32rem] rounded-lg shadow-xl flex flex-col z-50"
      style={panelStyle}
    >
      <div
        className="px-4 py-3 rounded-t-lg"
        style={{ backgroundColor: '#2F6F4F' }}
      >
        <h2
          className="text-lg"
          style={{ color: '#FFFFFF', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          Shopit Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <div
              className="px-3 py-2 rounded-lg text-sm"
              style={msg.role === 'user' ? userBubbleStyle : botBubbleStyle}
            >
              {msg.text}
            </div>
            <span className="mt-1" style={timestampStyle}>
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
        ))}

        {isSending && (
          <div className="flex flex-col max-w-[80%] self-start items-start">
            <div className="px-3 py-2 rounded-lg text-sm" style={botBubbleStyle}>
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-3 border-t flex gap-2" style={{ borderColor: '#E4DCC9' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-md text-sm disabled:opacity-50"
          style={{
            color: '#1F2A24',
            fontFamily: "'Inter', sans-serif",
            border: '1px solid #E4DCC9',
            backgroundColor: '#FFFFFF',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="px-4 py-2 rounded-md text-sm disabled:opacity-50"
          style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}