import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, MessageCircle, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! 👋 Welcome to EasyTransferHub. I am your 24/7 Barcelona & Spain Transfer Concierge. 
How can I assist you today? You can ask me in English, Español, Català, Urdu, or Hindi about transfer rates, flight tracking, child seats, or custom day tours!`,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How much is BCN Airport to Barcelona City?',
    'Transfer to Sitges or Montserrat?',
    'What if my flight arrives late?',
    'Can I book a minivan for 8 passengers?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          messages: messages.map((m) => ({ role: m.role, content: m.text })),
        }),
      });

      const data = await response.json();
      const reply = data.reply || "Thank you! For fast direct confirmation, please chat with Mr. Mir on WhatsApp at +34 663 958 889.";

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `For instant assistance, you can message Mr. Mir directly on WhatsApp at ${BUSINESS_INFO.phoneDisplay} or call anytime!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#67efff] flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#e6fdff] text-slate-900 px-5 py-4 flex items-center justify-between border-b border-[#8ceeff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#67efff] flex items-center justify-center text-[#008da1]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base flex items-center gap-2 text-slate-900">
                <span>EasyTransferHub AI Concierge</span>
              </h3>
              <p className="text-[11px] text-[#007c91] font-medium">
                24/7 Barcelona Private Transfers & Route Advice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-[#ccfbff] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f5feff]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#00f0ff] border border-[#00c8e8] text-slate-950 flex items-center justify-center shrink-0 mt-0.5 text-xs font-extrabold">
                  ET
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                  m.role === 'user'
                    ? 'bg-[#00f0ff] text-slate-950 font-semibold rounded-br-xs'
                    : 'bg-white text-slate-800 border border-[#9beeff] rounded-bl-xs'
                }`}
              >
                {m.text}
                <span
                  className={`block text-[10px] mt-1 text-right ${
                    m.role === 'user' ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </span>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#e6fdff] border border-[#67efff] text-[#042f40] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-lg bg-[#00f0ff] border border-[#00c8e8] text-slate-950 flex items-center justify-center shrink-0 text-xs font-extrabold">
                ET
              </div>
              <div className="bg-white border border-[#9beeff] rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008da1]" />
                <span>Checking routes & policies...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-[#9beeff]/70 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 font-bold shrink-0">Ask:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-[#e6fdff] hover:bg-[#ccfbff] hover:text-[#042f40] text-slate-700 border border-[#8ceeff] whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#9beeff]/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about transfers, prices, or destinations..."
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#f5feff] border border-[#9beeff] rounded-xl focus:ring-2 focus:ring-[#00f0ff]/40 focus:border-[#00b8cc] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] disabled:opacity-50 text-slate-950 cursor-pointer transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick WhatsApp Escalate */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Prefer talking to Mr. Mir directly?</span>
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#008da1] font-bold hover:underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Open WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
