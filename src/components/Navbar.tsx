import React, { useState } from 'react';
import { Phone, MessageCircle, Menu, X, Globe, Sparkles } from 'lucide-react';
import { BUSINESS_INFO, TRANSLATIONS } from '../data/transferData';

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
    <header className="sticky top-0 z-40 bg-[#0e2438] text-white border-b-2 border-amber-400/80 shadow-md backdrop-blur-md">
      {/* Top micro bar for quick direct contact */}
      <div className="bg-[#081622] px-4 py-1.5 text-xs text-slate-300 border-b border-amber-400/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-emerald-400">Available 24/7</span>
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline">Barcelona Airport & All Spain Transfers</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="/easytransferhub-netlify.zip"
              download="easytransferhub-netlify.zip"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors shadow-xs"
              title="Download Netlify Ready Zip"
            >
              <span>⬇ Download Netlify ZIP</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <a
              href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
              className="hidden sm:flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{BUSINESS_INFO.phoneDisplay}</span>
            </a>
            <span className="text-slate-600">·</span>
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
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
        <a href="#top" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0e5c73] to-[#f5b301] p-0.5 flex items-center justify-center shadow-sm">
            <div className="w-full h-full bg-[#0e2438] rounded-[7px] flex items-center justify-center font-display font-extrabold text-amber-400 text-lg">
              ET
            </div>
          </div>
          <div className="min-w-0">
            <span className="font-display font-extrabold text-[17px] sm:text-[18px] tracking-tight text-white block leading-tight whitespace-nowrap">
              Easytransfer<span className="text-amber-400">hub</span>
            </span>
            <span className="block text-[8px] sm:text-[8.5px] text-slate-300 tracking-wider uppercase font-semibold whitespace-nowrap leading-none mt-0.5">
              Chauffeur & Airport Service
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
          <a href="#calculator" className="hover:text-amber-400 transition-colors">
            {language === 'ur' ? 'کرایہ کیلکولیٹر' : 'Calculator'}
          </a>
          <a href="#routes" className="hover:text-amber-400 transition-colors">
            {t.navRoutes}
          </a>
          <a href="#fleet" className="hover:text-amber-400 transition-colors">
            {t.navFleet}
          </a>
          <a href="#prices" className="hover:text-amber-400 transition-colors">
            {t.navPrices}
          </a>
          <a href="#how" className="hover:text-amber-400 transition-colors">
            {t.navHow}
          </a>
          <a href="#faq" className="hover:text-amber-400 transition-colors">
            {t.navFaq}
          </a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">
            {t.navContact}
          </a>
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2.5">
          {/* AI Concierge Trigger Button */}
          <button
            onClick={onOpenAssistant}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-500/30 text-teal-200 text-xs font-semibold hover:bg-teal-800/80 transition-all cursor-pointer"
            title="Ask EasyTransferHub AI Concierge"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>24/7 AI Helper</span>
          </button>

          {/* Language Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:border-slate-500 transition-colors cursor-pointer"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{languages.find((l) => l.code === language)?.flag}</span>
              <span className="uppercase text-[11px] font-bold">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 py-1 bg-[#112331] border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                    language === l.code ? 'text-amber-400 font-bold bg-slate-800/50' : 'text-slate-300'
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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f5b301] hover:bg-[#e5a700] text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span className="hidden md:inline">Book on WhatsApp</span>
            <span className="md:hidden">Book</span>
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1620] border-t border-slate-800 px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2.5 text-sm font-medium text-slate-200">
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              Calculator
            </a>
            <a
              href="#routes"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navRoutes}
            </a>
            <a
              href="#fleet"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navFleet}
            </a>
            <a
              href="#prices"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navPrices}
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navHow}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navFaq}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 rounded-md hover:bg-slate-800 hover:text-amber-400"
            >
              {t.navContact}
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAssistant();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-teal-900/60 border border-teal-500/40 text-teal-200 text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ask 24/7 AI Travel Assistant</span>
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
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
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
