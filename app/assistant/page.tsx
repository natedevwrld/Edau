'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiSend,
  FiUser,
  FiCpu,
  FiZap,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi';

interface ProductResult {
  _id: string;
  id: string;
  name: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
  rating_avg: number;
  rating_count: number;
  unit_type: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductResult[];
}

const SUGGESTIONS = [
  'What honey do you recommend?',
  'Show me today’s bestsellers',
  'I need a gift under KSh 1000',
  'What’s fresh and in season?',
];

function getSessionId() {
  if (typeof window === 'undefined') return 'anonymous';
  let id = localStorage.getItem('edau_ai_session');
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem('edau_ai_session', id);
  }
  return id;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi, I’m Edau, your personal farm assistant. Tell me what you’re looking for and I’ll find it for you — products, prices, or what’s fresh today.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const history = [...messages, { role: 'user' as const, content: trimmed }];
      setMessages(history);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: getSessionId(),
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong.');
        }
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, products: data.products || [] },
        ]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: err.message || 'I had trouble responding. Please try again.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-green-50">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white shadow-lg">
            <FiZap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-800">Edau · AI Assistant</h1>
            <p className="text-sm text-primary-600">Your one-on-one farm shopping helper</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-white rounded-2xl border border-primary-100 shadow-sm p-4 space-y-4"
          style={{ maxHeight: 'calc(100vh - 230px)' }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                }`}
              >
                {m.role === 'user' ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-tr-sm'
                      : 'bg-primary-50 text-primary-900 rounded-tl-sm'
                  }`}
                >
                  {m.content}
                </div>

                {m.products && m.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {m.products.map((p) => (
                      <Link
                        key={p._id}
                        href={`/products/${p.id}`}
                        className="flex gap-3 rounded-xl border border-primary-100 bg-white p-3 hover:border-primary-300 hover:shadow transition"
                      >
                        <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiShoppingBag className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{p.name}</p>
                          <p className="text-xs text-neutral-500">
                            {p.category}
                            {p.unit_type ? ` · ${p.unit_type}` : ''}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-bold text-primary-700">
                              KSh {p.price?.toLocaleString('en-KE')}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <FiStar className="w-3 h-3" />
                              {p.rating_avg?.toFixed(1) || 'New'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white">
                <FiCpu className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-primary-50 px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs rounded-full border border-primary-200 bg-white px-3 py-1.5 text-primary-700 hover:bg-primary-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-3 flex items-center gap-2 bg-white rounded-full border border-primary-200 shadow-sm pl-4 pr-2 py-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Edau anything about our farm products…"
            className="flex-1 bg-transparent outline-none text-sm text-neutral-800"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white disabled:opacity-50 transition"
            aria-label="Send message"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
