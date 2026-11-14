import React, { useState } from 'react';
import { Phone, MessageCircle, Menu, X, Globe, Sparkles, Copy, Check, Download } from 'lucide-react';
import { BUSINESS_INFO, TRANSLATIONS } from '../data/transferData';

interface NavbarProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  setLanguage: (lang: 'en' | 'es' | 'ca' | 'ur') => void;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ language, setLanguage, onOpenAssistant }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const t = TRANSLATIONS[language];

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ca', label: 'Català', flag: '🚩' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-[#8ceeff]/80 shadow-xs backdrop-blur-md">
      {/* Top micro bar for quick direct contact */}
      <div className="bg-[#e6fdff] px-4 py-1.5 text-xs text-[#042f40] border-b border-[#9beeff]/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-[#007c91]">Available 24/7</span>
            </span>
            <span className="hidden sm:inline text-[#67efff]">|</span>
            <span className="hidden sm:inline text-slate-700">Barcelona Airport & All Spain Chauffeur</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/BookingCalculator.txt');
                    const text = await res.text();
                    await navigator.clipboard.writeText(text);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 3000);
                  } catch (e) {
                    window.location.href = '/BookingCalculator.tsx';
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                  copiedCode
                    ? 'bg-[#00f0ff] text-slate-950 font-bold'
                    : 'bg-white text-[#042f40] border border-[#67efff] hover:bg-[#d8fbff]'
                }`}
                title="Click to copy entire BookingCalculator.tsx code to clipboard"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>✓ Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#008da1]" />
                    <span>📋 Copy Calculator Code</span>
                  </>
                )}
              </button>

              <a
                href="/BookingCalculator.tsx"
                download="BookingCalculator.tsx"
                className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#042f40] border border-[#9beeff] hover:bg-[#d8fbff] text-[11px] font-medium transition-colors"
                title="Direct download BookingCalculator.tsx"
              >
                <Download className="w-3 h-3 text-[#008da1]" />
                <span>Download File</span>
              </a>
            </div>

            <span className="text-[#67efff] hidden sm:inline">·</span>
            <a
              href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
              className="hidden sm:flex items-center gap-1.5 text-slate-700 hover:text-[#008da1] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#008da1]" />
              <span>{BUSINESS_INFO.phoneDisplay}</span>
            </a>
            <span className="text-[#67efff]">·</span>
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#007c91] hover:text-slate-950 font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#top" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#00f0ff] border border-[#00c8e8] flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(0,240,255,0.6)] font-display font-extrabold text-slate-950 text-base tracking-tight">
            ET
          </div>
          <div className="min-w-0">
            <span className="font-display font-extrabold text-[17px] sm:text-[18px] tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
              Easytransfer<span className="text-[#00a6bf]">hub</span>
            </span>
            <span className="block text-[8px] sm:text-[8.5px] text-slate-500 tracking-[0.16em] uppercase font-semibold whitespace-nowrap leading-none mt-0.5">
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

          {/* Book WhatsApp CTA */}
          <a
            href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
              'Hello Easytransferhub, I would like to inquire about a private transfer.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#00d8eb] text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_4px_16px_-4px_rgba(0,240,255,0.6)] transition-all active:scale-95 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span className="hidden md:inline">Book on WhatsApp</span>
            <span className="md:hidden">Book</span>
          </a>

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
