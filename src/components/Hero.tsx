import React from 'react';
import { ShieldCheck, Radar, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { BUSINESS_INFO, TRANSLATIONS } from '../data/transferData';
import { BookingCalculator } from './BookingCalculator';
import { HeroSkyPlanes, TransitCorridorScene } from './TravelMotionBackdrop';
import { TravellerReviewsMarquee } from './TravellerReviewsMarquee';

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
  mapsEnabled = false,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section id="eth-hero-section" className="relative bg-gradient-to-b from-[#0D0F12] via-[#15181E] to-[#FAF9F6] text-white overflow-hidden pt-2.5 sm:pt-3.5 pb-8 border-b border-[#E5DEC9]">
      {/* Subtle warm Barcelona Taxi Gold ambient light behind hero */}
      <div data-hero-orb="true" className="absolute -top-28 right-1/4 w-[520px] h-[420px] bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Flying Vueling & Ryanair Airplanes across the upper Barcelona sky */}
      <HeroSkyPlanes />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Compact Single-Line Hero Headline + Fair-Price-Sized Green WhatsApp Badge */}
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2.5">
          <h1
            className="font-display font-bold text-[#FAF9F6] tracking-tight leading-snug sm:whitespace-nowrap min-w-0 m-0"
            style={{ fontSize: 'clamp(13.5px, 2.25vw, 24px)' }}
          >
            {t.heroTitle}
          </h1>

          <a
            href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
              'Hello Easytransferhub, I would like to book a private transfer in Barcelona.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            data-whatsapp-btn="true"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1FB858] border border-[#1EA952] text-white shadow-2xs whitespace-nowrap shrink-0 transition-colors"
            title="Chat on WhatsApp +34 666 744 440"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-white shrink-0" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* 1. CALCULATOR — Positioned cleanly on the dark-gold split */}
        <BookingCalculator
          language={language}
          prefilledRoute={prefilledRoute}
          onOpenVoucher={onOpenVoucher}
          mapsEnabled={mapsEnabled}
        />
      </div>

      {/* 2. LIVE AIR, RAIL & ROAD CORRIDOR */}
      <TransitCorridorScene />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 3. Guarantee Strip */}
        <div className="pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#E5DEC9] hover:border-[#F5B800] rounded-xl p-4 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-[#8A5D00] mb-1.5">
                <Radar className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-[#111317]">Flight Tracking</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Driver schedule adjusts if flight is delayed.
              </p>
            </div>

            <div className="bg-white border border-[#E5DEC9] hover:border-[#F5B800] rounded-xl p-4 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-[#8A5D00] mb-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-[#111317]">60 Min Free Waiting</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Free waiting time after landing at BCN.
              </p>
            </div>

            <div className="bg-white border border-[#E5DEC9] hover:border-[#F5B800] rounded-xl p-4 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-[#8A5D00] mb-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-[#111317]">Fixed Price Guarantee</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                All highway tolls and parking included.
              </p>
            </div>

            <div className="bg-white border border-[#E5DEC9] hover:border-[#F5B800] rounded-xl p-4 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-[#8A5D00] mb-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-[#111317]">Meet &amp; Greet</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Driver waits at arrivals with your name sign.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Sliding Passenger Reviews Marquee — directly beneath Flight Tracking & Guarantee Cards */}
        <TravellerReviewsMarquee />
      </div>
    </section>
  );
};
