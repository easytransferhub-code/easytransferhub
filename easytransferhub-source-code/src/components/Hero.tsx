import React from 'react';
import { ShieldCheck, Radar, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { TRANSLATIONS, BUSINESS_INFO } from '../data/transferData';
import { BookingCalculator } from './BookingCalculator';

interface HeroProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  prefilledRoute?: { pickup: string; dropoff: string } | null;
  onOpenVoucher: (data: any) => void;
  onOpenAssistant: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  prefilledRoute,
  onOpenVoucher,
  onOpenAssistant,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section className="relative bg-[#0e2438] text-white overflow-hidden pb-8 pt-3 sm:pb-10 sm:pt-4">
      {/* Background radial subtle glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0e5c73]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#f5b301]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="space-y-3">
          {/* 1. Kicker */}
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>BARCELONA & CATALONIA LICENSED PRIVATE CHAUFFEUR</span>
          </div>

          {/* 2. Main Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight leading-tight text-white m-0">
            {t.heroTitle}
          </h1>

          {/* 3. CALCULATOR - COMES DIRECTLY UNDER PRIVATE TRANSFERS HEADLINE */}
          <div className="pt-1">
            <BookingCalculator
              language={language}
              prefilledRoute={prefilledRoute}
              onOpenVoucher={onOpenVoucher}
            />
          </div>

          {/* 4. SWAPPED BELOW CALCULATOR: Airport pickups subtitle + Guarantees down to Meet & Greet */}
          <div className="pt-3 space-y-3">
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 leading-normal max-w-3xl m-0">
              {t.heroSubtitle}
            </p>

            {/* 4 Guarantees Grid (Flight Tracking, 60 Min Waiting, Fixed Price, Meet & Greet) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-[#112331]/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <Radar className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-bold text-white">Flight Tracking</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Driver schedule adjusts if flight is delayed.
                </p>
              </div>

              <div className="bg-[#112331]/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-bold text-white">60 Min Free Waiting</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Free waiting time after landing at BCN.
                </p>
              </div>

              <div className="bg-[#112331]/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-bold text-white">Fixed Price Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  All highway tolls and parking included.
                </p>
              </div>

              <div className="bg-[#112331]/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-bold text-white">Meet & Greet</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Driver waits at arrivals with your name sign.
                </p>
              </div>
            </div>

            {/* Chauffeur Vehicle Banner & Direct Contact Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1 items-center">
              <div className="md:col-span-8 relative rounded-xl overflow-hidden border border-slate-700/80 shadow-md group h-36 sm:h-44">
                <img
                  src="/images/hero.jpg"
                  alt="EasyTransferHub executive chauffeur van in Barcelona"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                  <span className="font-bold text-amber-400 text-xs block">
                    Executive Sedans & Minivans
                  </span>
                  <span className="text-[11px] text-slate-200">
                    Barcelona Airport, Cruise Port & Intercity Transfers across Spain
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 bg-[#112331] border border-slate-700/80 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>Personal Dispatcher</span>
                  <span className="text-amber-400 font-extrabold">{BUSINESS_INFO.owner}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Direct personal support on WhatsApp. Fast replies for custom routes, groups, and inquiries.
                </p>
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    {BUSINESS_INFO.phoneDisplay}
                  </a>
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp 24/7</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
