import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

interface FloatingActionsProps {
  onOpenAssistant: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenAssistant }) => {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      <button
        onClick={onOpenAssistant}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0D0F12] hover:bg-[#1A1D24] text-[#F5B800] text-xs font-bold shadow-lg border border-[#F5B800]/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Ask 24/7 Transfer Concierge"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
        <span className="hidden sm:inline">Ask Concierge</span>
        <span className="sm:hidden">Concierge</span>
      </button>

      <a
        href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
          'Hello Easytransferhub, I would like to book a private transfer in Barcelona.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1FB858] text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <MessageCircle className="w-4 h-4 fill-white text-white" />
        <span>WhatsApp Mr. Mir</span>
      </a>
    </div>
  );
};
