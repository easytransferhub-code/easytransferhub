import React, { useState } from 'react';
import { MoreVertical, Globe, Phone, MessageCircle } from 'lucide-react';
import { BUSINESS_INFO, TRANSLATIONS } from '../data/transferData';

interface NavbarProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  setLanguage: (lang: 'en' | 'es' | 'ca' | 'ur') => void;
  onOpenAssistant: () => void;
  onOpenOwnerMeter?: () => void;
  onOpenMoreDetails: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  onOpenMoreDetails,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ca', label: 'Català', flag: '🚩' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  ] as const;

  const phoneHref = `tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`;
  const whatsappHref = `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
    'Hello Easytransferhub, I would like to book a private transfer in Barcelona.'
  )}`;

  return (
    <header className="relative lg:sticky lg:top-0 z-40 bg-[#0D0F12]/95 text-white border-b border-[#F5B800]/30 shadow-sm backdrop-blur-md">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Wordmark (Compact Adjusted Size) */}
        <a href="#top" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F5B800] border border-[#FFD24C] flex items-center justify-center font-display font-bold text-[#0D0F12] text-xs sm:text-sm tracking-tight shrink-0">
            ET
          </div>
          <span className="font-display font-bold text-[15px] sm:text-[19px] tracking-tight text-[#FAF9F6] whitespace-nowrap">
            EasyTransfer<span className="text-[#F5B800]">Hub</span>
          </span>
        </a>

        {/* Clean Essential Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-300">
          <a href="#calculator" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {language === 'ur' ? 'کرایہ کیلکولیٹر' : 'Calculator'}
          </a>
          <a href="#fleet" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navFleet}
          </a>
          <a href="#reviews" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            Reviews
          </a>
          <a href="#contact" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navContact}
          </a>
        </nav>

        {/* Right Cluster: Translation Div -> Green WhatsApp -> Direct Call -> 3-Dots Details Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language / Translation Switcher */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#171A21] border border-neutral-700 text-[11px] font-medium text-neutral-200 hover:border-[#F5B800] transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Change language"
            >
              <Globe className="w-3 h-3 text-[#F5B800]" />
              <span>{languages.find((l) => l.code === language)?.flag}</span>
              <span className="uppercase text-[10px] font-bold">{language}</span>
            </button>
            <div
              className={`absolute right-0 mt-1 w-32 py-1 bg-[#14171D] border border-neutral-700 rounded-lg shadow-xl z-50 ${
                langMenuOpen ? 'block' : 'hidden group-hover:block'
              }`}
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[#1F242D] transition-colors cursor-pointer ${
                    language === l.code ? 'text-[#F5B800] font-bold bg-[#1B1F27]' : 'text-neutral-200'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Green WhatsApp Direct Icon (Right next to Translation) */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Mr. Mir"
            title="WhatsApp +34 666 744 440"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] hover:bg-[#1FB858] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
          </a>

          {/* Compact Direct Phone Call Icon (Same Number) */}
          <a
            href={phoneHref}
            aria-label="Call +34 666 744 440 directly"
            title={`Call ${BUSINESS_INFO.phoneDisplay}`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5B800] hover:bg-[#E0A600] text-[#0D0F12] flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0D0F12]" />
          </a>

          {/* 3-Dots Details & Menu Button (Desktop + Mobile) */}
          <button
            type="button"
            onClick={onOpenMoreDetails}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-neutral-200 hover:text-[#F5B800] hover:border-[#F5B800] rounded-lg bg-[#171A21] border border-neutral-700 transition-colors cursor-pointer shrink-0"
            aria-label="Open menu, 10-zone fares and more details"
            title="Menu, Zone Fares & More Details"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
