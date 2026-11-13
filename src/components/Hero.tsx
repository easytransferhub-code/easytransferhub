import React from 'react';
import { ShieldCheck, Radar, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { TRANSLATIONS, BUSINESS_INFO } from '../data/transferData';
import { BookingCalculator } from './BookingCalculator';
import { HeroSkyPlanes, TransitCorridorScene } from './TravelMotionBackdrop';

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
    <section className="relative bg-gradient-to-b from-[#ecfdf5] via-[#f4fbf7] to-white text-slate-900 overflow-hidden pt-1.5 sm:pt-2 pb-8 sm:pb-10 border-b border-emerald-100">
      {/* Subtle botanical ambient glows */}
      <div className="absolute -top-24 right-1/4 w-[520px] h-[520px] bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Flying Vueling & Ryanair Airplanes across the Light Green Sky */}
      <HeroSkyPlanes />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <h1 className="sr-only">
          {t.heroTitle}
        </h1>

        {/* 1. CALCULATOR — Positioned high up right under navbar */}
        <BookingCalculator
          language={language}
          prefilledRoute={prefilledRoute}
          onOpenVoucher={onOpenVoucher}
        />
      </div>

      {/* 2. LIVE AIR, RAIL & ROAD CORRIDOR — Placed right beneath "Get Price" button */}
      <TransitCorridorScene />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 3. Guarantee Strip & Executive Showcase */}
        <div className="pt-5 space-y-3.5">
          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-3xl m-0">
            {t.heroSubtitle}
          </p>

          {/* 4 Guarantees Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                <Radar className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Flight Tracking</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Driver schedule adjusts if flight is delayed.
              </p>
            </div>

            <div className="bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">60 Min Free Waiting</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Free waiting time after landing at BCN.
              </p>
            </div>

            <div className="bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Fixed Price Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                All highway tolls and parking included.
              </p>
            </div>

            <div className="bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Meet & Greet</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Driver waits at arrivals with your name sign.
              </p>
            </div>
          </div>

          {/* Chauffeur Vehicle Banner & Direct Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1 items-center">
            <div className="md:col-span-8 relative rounded-xl overflow-hidden border border-emerald-200 shadow-sm group h-36 sm:h-44">
              <img
                src="/images/hero.jpg"
                alt="EasyTransferHub executive chauffeur van in Barcelona"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex flex-col justify-end p-4">
                <span className="font-bold text-emerald-300 text-xs block tracking-wide uppercase">
                  Executive Sedans & Minivans
                </span>
                <span className="text-[11px] text-white mt-0.5">
                  Barcelona Airport, Cruise Port & Intercity Transfers across Spain
                </span>
              </div>
            </div>

            <div className="md:col-span-4 bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-4 space-y-2 text-xs shadow-xs transition-all">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span>Personal Dispatcher</span>
                <span className="text-emerald-700 font-extrabold">{BUSINESS_INFO.owner}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Direct personal support on WhatsApp. Fast replies for custom routes, groups, and inquiries.
              </p>
              <div className="pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
                <a
                  href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                  className="text-slate-900 font-bold hover:text-emerald-700 hover:underline"
                >
                  {BUSINESS_INFO.phoneDisplay}
                </a>
                <a
                  href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp 24/7</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
