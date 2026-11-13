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
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#ecfdf5] text-emerald-950 text-xs font-bold shadow-lg border border-emerald-200 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Ask 24/7 AI Transfer Concierge"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
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
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95 group"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <MessageCircle className="w-4 h-4 fill-white" />
        <span>WhatsApp Mr. Mir</span>
      </a>
    </div>
  );
};
