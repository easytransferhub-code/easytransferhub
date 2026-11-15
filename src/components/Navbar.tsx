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
    <header className="relative lg:sticky lg:top-0 z-40 bg-white/95 text-slate-900 border-b border-[#8ceeff]/80 shadow-xs backdrop-blur-md">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#top" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#00f0ff] border border-[#00c8e8] flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(0,240,255,0.65)] font-display font-black text-slate-950 text-lg tracking-tight shrink-0">
            ET
          </div>
          <div className="min-w-0">
            <span className="font-display font-black text-[21px] sm:text-[24px] tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
              Easytransfer<span className="text-[#009eb5]">hub</span>
            </span>
            <span className="block text-[9px] sm:text-[9.5px] text-[#007c91] tracking-[0.17em] uppercase font-bold whitespace-nowrap leading-none mt-0.5">
              Executive Chauffeur Service
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-600">
          <a href="#calculator" className="hover:text-[#008da1] transition-colors whitespace-nowrap">
            {language === 'ur' ? 'کرایہ کیلکولیٹر' : 'Calculator'}
          </a>
          <a href="#fleet" className="hover:text-[#008da1] transition-colors whitespace-nowrap">
            {t.navFleet}
          </a>
          <a href="#how" className="hover:text-[#008da1] transition-colors whitespace-nowrap">
            {t.navHow}
          </a>
          <a href="#faq" className="hover:text-[#008da1] transition-colors whitespace-nowrap">
            {t.navFaq}
          </a>
          <a href="#contact" className="hover:text-[#008da1] transition-colors whitespace-nowrap">
            {t.navContact}
          </a>
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2.5">
          {/* AI Concierge Trigger Button */}
          <button
            onClick={onOpenAssistant}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e6fdff] border border-[#8ceeff] text-[#042f40] text-xs font-semibold hover:bg-[#ccfbff] transition-all cursor-pointer whitespace-nowrap"
            title="Ask EasyTransferHub AI Concierge"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#008da1]" />
            <span>24/7 Concierge</span>
          </button>

          {/* Language Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:border-[#00d8eb] transition-colors cursor-pointer"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{languages.find((l) => l.code === language)?.flag}</span>
              <span className="uppercase text-[11px] font-bold">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 py-1 bg-white border border-[#8ceeff] rounded-lg shadow-xl hidden group-hover:block z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[#e6fdff] transition-colors ${
                    language === l.code ? 'text-[#007c91] font-bold bg-[#e6fdff]' : 'text-slate-700'
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
            className="lg:hidden p-2 text-slate-700 hover:text-[#008da1] rounded-lg bg-slate-50 border border-slate-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#9beeff] px-4 py-4 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#e6fdff] hover:text-[#007c91]"
            >
              Calculator
            </a>
            <a
              href="#fleet"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#e6fdff] hover:text-[#007c91]"
            >
              {t.navFleet}
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#e6fdff] hover:text-[#007c91]"
            >
              {t.navHow}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#e6fdff] hover:text-[#007c91]"
            >
              {t.navFaq}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-[#e6fdff] hover:text-[#007c91]"
            >
              {t.navContact}
            </a>
          </nav>

          <div className="pt-3 border-t border-[#9beeff] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAssistant();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#e6fdff] border border-[#8ceeff] text-[#042f40] text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4 text-[#008da1]" />
              <span>Ask 24/7 AI Concierge</span>
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
                      ? 'bg-[#00f0ff] text-slate-950 border-[#00c8e8] font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
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
