import React, { useState } from 'react';
import { Menu, X, Globe, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../data/transferData';

interface NavbarProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  setLanguage: (lang: 'en' | 'es' | 'ca' | 'ur') => void;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ language, setLanguage, onOpenAssistant }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ca', label: 'Català', flag: '🚩' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  ] as const;

  return (
    <header className="relative lg:sticky lg:top-0 z-40 bg-[#0D0F12]/95 text-white border-b border-[#F5B800]/30 shadow-sm backdrop-blur-md">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-6">
        {/* Brand Wordmark */}
        <a href="#top" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#F5B800] border border-[#FFD24C] flex items-center justify-center font-display font-bold text-[#0D0F12] text-base tracking-tight shrink-0">
            ET
          </div>
          <span className="font-display font-bold text-[21px] sm:text-[23px] tracking-tight text-[#FAF9F6] whitespace-nowrap">
            EasyTransfer<span className="text-[#F5B800]">Hub</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-neutral-300">
          <a href="#calculator" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {language === 'ur' ? 'کرایہ کیلکولیٹر' : 'Calculator'}
          </a>
          <a href="#fleet" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navFleet}
          </a>
          <a href="#how" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navHow}
          </a>
          <a href="#faq" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navFaq}
          </a>
          <a href="#contact" className="hover:text-[#F5B800] transition-colors whitespace-nowrap shrink-0">
            {t.navContact}
          </a>
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAssistant}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5B800] hover:bg-[#E0A600] text-[#0D0F12] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Ask EasyTransferHub Concierge"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0D0F12]" />
            <span>24/7 Concierge</span>
          </button>

          {/* Language Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#171A21] border border-neutral-700 text-xs font-medium text-neutral-200 hover:border-[#F5B800] transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>{languages.find((l) => l.code === language)?.flag}</span>
              <span className="uppercase text-[11px] font-bold">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 py-1 bg-[#14171D] border border-neutral-700 rounded-lg shadow-xl hidden group-hover:block z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-200 hover:text-[#F5B800] rounded-lg bg-[#171A21] border border-neutral-700"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#12151A] border-t border-neutral-800 px-4 py-4 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-neutral-200">
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#1D2129] hover:text-[#F5B800]"
            >
              Calculator
            </a>
            <a
              href="#fleet"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#1D2129] hover:text-[#F5B800]"
            >
              {t.navFleet}
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#1D2129] hover:text-[#F5B800]"
            >
              {t.navHow}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#1D2129] hover:text-[#F5B800]"
            >
              {t.navFaq}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#1D2129] hover:text-[#F5B800]"
            >
              {t.navContact}
            </a>
          </nav>

          <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAssistant();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#F5B800] text-[#0D0F12] text-xs font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#0D0F12]" />
              <span>Ask 24/7 Concierge</span>
            </button>
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs rounded-md border text-center ${
                    language === l.code
                      ? 'bg-[#F5B800] text-[#0D0F12] border-[#FFD24C] font-bold'
                      : 'bg-[#171A21] text-neutral-300 border-neutral-700'
                  }`}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
