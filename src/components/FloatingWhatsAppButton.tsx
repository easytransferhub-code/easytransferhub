import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

interface FloatingActionsProps {
  onOpenAssistant: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = () => {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
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
