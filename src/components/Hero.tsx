import React from 'react';
import { ShieldCheck, Radar, Clock, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../data/transferData';
import { BookingCalculator } from './BookingCalculator';
import { HeroSkyPlanes, TransitCorridorScene } from './TravelMotionBackdrop';

interface HeroProps {
  language: 'en' | 'es' | 'ca' | 'ur';
  prefilledRoute?: { pickup: string; dropoff: string } | null;
  onOpenVoucher: (data: any) => void;
  onOpenAssistant: () => void;
  mapsEnabled?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  prefilledRoute,
  onOpenVoucher,
  onOpenAssistant,
  mapsEnabled = false,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section className="relative bg-gradient-to-b from-[#d8fbff] via-[#f2feff] to-white text-slate-900 overflow-hidden pt-1.5 sm:pt-2 pb-6 sm:pb-8 border-b border-[#9beeff]/70">
      {/* Luminous Electric Blue ambient glows */}
      <div className="absolute -top-24 right-1/4 w-[520px] h-[520px] bg-[#00f0ff]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#00f0ff]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Flying Vueling & Ryanair Airplanes across the Light Electric Sky */}
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
          mapsEnabled={mapsEnabled}
        />
      </div>

      {/* 2. LIVE AIR, RAIL & ROAD CORRIDOR — Placed right beneath "Get Price" button */}
      <TransitCorridorScene />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 3. Guarantee Strip */}
        <div className="pt-5 space-y-3.5">
          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-3xl m-0">
            {t.heroSubtitle}
          </p>

          {/* 4 Guarantees Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-[#9beeff] hover:border-[#00f0ff] rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-[#008da1] mb-1">
                <Radar className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Flight Tracking</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Driver schedule adjusts if flight is delayed.
              </p>
            </div>

            <div className="bg-white border border-[#9beeff] hover:border-[#00f0ff] rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-[#008da1] mb-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">60 Min Free Waiting</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Free waiting time after landing at BCN.
              </p>
            </div>

            <div className="bg-white border border-[#9beeff] hover:border-[#00f0ff] rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-[#008da1] mb-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Fixed Price Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                All highway tolls and parking included.
              </p>
            </div>

            <div className="bg-white border border-[#9beeff] hover:border-[#00f0ff] rounded-xl p-3 shadow-xs transition-all">
              <div className="flex items-center gap-1.5 text-[#008da1] mb-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold text-slate-900">Meet & Greet</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Driver waits at arrivals with your name sign.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
