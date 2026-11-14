import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

interface FloatingActionsProps {
  onOpenAssistant: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenAssistant }) => {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* 24/7 AI Concierge Floating Button */}
      <button
        onClick={onOpenAssistant}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#e6fdff] text-[#042f40] text-xs font-bold shadow-lg border border-[#67efff] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Ask 24/7 AI Transfer Concierge"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#008da1]" />
        <span className="hidden sm:inline">Ask AI Concierge</span>
        <span className="sm:hidden">AI Concierge</span>
      </button>

      {/* WhatsApp Floating Pill */}
      <a
        href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
          'Hello Easytransferhub, I would like to book a private transfer in Barcelona.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00f0ff] hover:bg-[#00d8eb] text-slate-950 text-xs sm:text-sm font-extrabold shadow-[0_8px_24px_-4px_rgba(0,240,255,0.65)] transition-all hover:scale-105 active:scale-95 group"
      >
        <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
        <span>WhatsApp Mr. Mir</span>
      </a>
    </div>
  );
};
