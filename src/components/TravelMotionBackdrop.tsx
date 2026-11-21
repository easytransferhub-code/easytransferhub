import React, { useState } from 'react';

const MOTION_ASSETS = {
  skyline: '/images/motion/barcelona-skyline.jpg',
  vueling: '/images/motion/plane-vueling.png',
  iberia: '/images/motion/plane-iberia.png',
  ryanair: '/images/motion/plane-ryanair.png',
  easyjet: '/images/motion/plane-easyjet.png',
  renfeAve: '/images/motion/train-renfe-ave.png',
  taxiBcn: '/images/motion/taxi-bcn.png',
  vipVan: '/images/motion/van-vip-mercedes.png',
  silverCar: '/images/motion/car-silver-hatch.png',
  vespaScooter: '/images/motion/scooter-vespa.png',
  sportMoto: '/images/motion/motorbike-sport.png',
};

interface MotionSpriteProps {
  src: string;
  alt: string;
  className?: string;
  flipped?: boolean;
  contrail?: 'right' | 'left';
}

const MotionSprite: React.FC<MotionSpriteProps> = ({
  src,
  alt,
  className = '',
  flipped = false,
  contrail,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div className="relative flex items-center">
      {contrail === 'right' && (
        <div
          className="absolute left-[88%] top-[54%] w-24 sm:w-36 h-[2px] rounded-full pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.22) 55%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}
      {contrail === 'left' && (
        <div
          className="absolute right-[88%] top-[54%] w-24 sm:w-36 h-[2px] rounded-full pointer-events-none"
          style={{
            background:
              'linear-gradient(270deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.22) 55%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
        className={`block select-none pointer-events-none ${
          flipped ? '-scale-x-100' : ''
        } ${className}`}
      />
    </div>
  );
};

/**
 * Real Airline Jetliners cruising the upper Hero Sky (Vueling & Iberia)
 */
export const HeroSkyPlanes: React.FC = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-[1]"
      aria-hidden="true"
    >
      {/* Drifting atmospheric clouds */}
      <div className="absolute top-2 left-0 animate-cloud-slow opacity-15">
        <svg width="180" height="46" viewBox="0 0 180 46" fill="none">
          <path
            d="M28 38 H150 C161 38 168 31 168 23 C168 15.5 161 10 152 10 C149 10 146 11 143 12.5 C139 5 130 1 120 1 C107 1 97 8 94 17.5 C90 15 84 13.5 78 13.5 C64 13.5 53 21.5 51 31 C49 30 46 29.5 43 29.5 C34 29.5 28 33 28 38 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Real Vueling A320 gliding smoothly across top sky */}
      <div className="absolute top-1 left-0 animate-hero-jet-1 will-change-transform">
        <MotionSprite
          src={MOTION_ASSETS.vueling}
          alt="Vueling Airbus A320"
          contrail="right"
          className="w-28 sm:w-36 h-auto drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        />
      </div>

      {/* Real Iberia A320 cruising higher */}
      <div className="absolute top-7 left-0 animate-hero-jet-2 will-change-transform">
        <MotionSprite
          src={MOTION_ASSETS.iberia}
          alt="Iberia Airbus A320"
          contrail="right"
          className="w-24 sm:w-32 h-auto opacity-90 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
        />
      </div>
    </div>
  );
};

/**
 * Full-Width Photorealistic Barcelona Skyline, Airlines, Renfe AVE Rail, Taxis, Cars & Bikes Panorama
 */
export const TransitCorridorScene: React.FC = () => {
  const [skylineFailed, setSkylineFailed] = useState(false);

  return (
    <div
      id="eth-transit-corridor"
      className="relative w-full h-[215px] sm:h-[265px] lg:h-[295px] mt-5 overflow-hidden pointer-events-none select-none border-y border-[#F5B800]/40 bg-gradient-to-b from-[#3A7CA5] via-[#87B3CE] to-[#E6C78B]"
      aria-hidden="true"
    >
      {/* 1. Full-Color Real Barcelona Landmarks Skyline Backdrop (Sagrada Família, Torre Glòries, Hotel W, Tibidabo, Mediterranean Sea) */}
      {!skylineFailed && (
        <img
          src={MOTION_ASSETS.skyline}
          alt="Barcelona skyline panorama with Sagrada Familia, Torre Glories, and W Hotel"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setSkylineFailed(true)}
          className="absolute inset-x-0 top-0 w-full h-[175px] sm:h-[215px] lg:h-[242px] object-cover object-[50%_38%]"
        />
      )}

      {/* Subtle golden atmospheric depth mist over lower skyline horizon */}
      <div
        className="absolute inset-x-0 top-0 h-[175px] sm:h-[215px] lg:h-[242px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,15,18,0.16) 0%, rgba(13,15,18,0) 24%, rgba(255,244,214,0.06) 72%, rgba(20,23,29,0.28) 100%)',
        }}
      />

      {/* 2. Real Commercial Airplanes Fleet (Vueling, Iberia, Ryanair, easyJet) */}
      <div className="absolute top-3 sm:top-4 left-0 animate-jet-vueling will-change-transform z-10">
        <MotionSprite
          src={MOTION_ASSETS.vueling}
          alt="Vueling Airbus A320 flying over Barcelona"
          contrail="right"
          className="w-28 sm:w-40 lg:w-44 h-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="absolute top-10 sm:top-12 left-0 animate-jet-iberia will-change-transform z-10">
        <MotionSprite
          src={MOTION_ASSETS.iberia}
          alt="Iberia Airbus A320 approaching Barcelona Airport"
          contrail="right"
          className="w-24 sm:w-34 lg:w-38 h-auto drop-shadow-[0_5px_10px_rgba(0,0,0,0.32)]"
        />
      </div>

      <div className="absolute top-2 sm:top-3 left-0 animate-jet-ryanair will-change-transform z-10">
        <MotionSprite
          src={MOTION_ASSETS.ryanair}
          alt="Ryanair Boeing 737 over Barcelona"
          contrail="right"
          className="w-24 sm:w-32 lg:w-36 h-auto drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
        />
      </div>

      <div className="absolute top-16 sm:top-20 left-0 animate-jet-easyjet will-change-transform z-10">
        <MotionSprite
          src={MOTION_ASSETS.easyjet}
          alt="easyJet Airbus A320 over Barcelona"
          contrail="right"
          className="w-24 sm:w-34 lg:w-36 h-auto drop-shadow-[0_5px_10px_rgba(0,0,0,0.32)]"
        />
      </div>

      {/* 3. Overhead Electric Railway Catenary System */}
      <div className="absolute inset-x-0 bottom-[82px] sm:bottom-[98px] lg:bottom-[108px] h-11 z-15">
        <div className="absolute inset-x-0 top-1.5 h-[1px] bg-slate-800/35" />
        <div className="absolute inset-x-0 top-3.5 h-[1.5px] bg-slate-900/45" />
        <div
          className="absolute inset-x-0 top-0 h-11 opacity-55"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #1e293b 0px, #1e293b 2.5px, transparent 2.5px, transparent 190px)',
          }}
        />
      </div>

      {/* 4. Real Renfe AVE High-Speed Train Track Layer */}
      <div className="absolute inset-x-0 bottom-[62px] sm:bottom-[74px] lg:bottom-[82px] h-14 sm:h-16 z-20">
        <div className="absolute bottom-0 left-0 animate-ave-primary will-change-transform flex items-end">
          <MotionSprite
            src={MOTION_ASSETS.renfeAve}
            alt="Renfe AVE Spanish high-speed train"
            className="w-[380px] sm:w-[520px] lg:w-[600px] h-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
          />
          <div
            className="w-16 sm:w-24 h-5 -ml-2 mb-1.5 rounded-r-full opacity-55"
            style={{
              background:
                'linear-gradient(90deg, rgba(254,240,138,0.85) 0%, rgba(254,240,138,0) 100%)',
            }}
          />
        </div>

        <div className="hidden md:flex absolute bottom-0 left-0 animate-ave-secondary will-change-transform items-end">
          <MotionSprite
            src={MOTION_ASSETS.renfeAve}
            alt="Renfe AVE Spanish high-speed train"
            className="w-[520px] lg:w-[600px] h-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
          />
          <div
            className="w-24 h-5 -ml-2 mb-1.5 rounded-r-full opacity-55"
            style={{
              background:
                'linear-gradient(90deg, rgba(254,240,138,0.85) 0%, rgba(254,240,138,0) 100%)',
            }}
          />
        </div>
      </div>

      {/* 5. Elevated Concrete & Steel Railway Viaduct Deck */}
      <div className="absolute inset-x-0 bottom-[48px] sm:bottom-[58px] lg:bottom-[64px] h-[16px] sm:h-[18px] z-20">
        {/* Polished steel rail */}
        <div className="w-full h-[2.5px] bg-gradient-to-b from-slate-200 to-slate-500" />
        {/* Wooden/concrete sleepers */}
        <div
          className="w-full h-[4px] bg-slate-800/80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #475569 0px, #475569 5px, #1e293b 5px, #1e293b 13px)',
          }}
        />
        {/* Architectural concrete viaduct parapet */}
        <div
          data-rail-bed="true"
          className="w-full h-[9px] sm:h-[11px] bg-gradient-to-b from-[#D6CFC2] via-[#BEB5A4] to-[#7D7568] border-y border-[#5B554B]/60 shadow-sm"
        />
      </div>

      {/* 6. Mediterranean Urban Boulevard Asphalt (2 Real Traffic Lanes: Taxis, VIP Vans, Cars & Bikes) */}
      <div
        data-road-surface="true"
        className="absolute inset-x-0 bottom-0 h-[48px] sm:h-[58px] lg:h-[64px] bg-gradient-to-b from-[#232730] via-[#171A21] to-[#0D0F12] border-t-2 border-[#94A3B8]/50 z-30"
      >
        {/* Top sunlit concrete curb & sidewalk line */}
        <div className="w-full h-[3px] bg-gradient-to-r from-stone-400/50 via-stone-300/60 to-stone-400/50" />

        {/* Subtle streetlamp warm pools */}
        <div
          className="absolute inset-x-0 top-0 h-full opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0px, transparent 220px, rgba(245,184,0,0.35) 260px, transparent 300px)',
          }}
        />

        {/* Center dashed yellow/gold lane divider */}
        <div
          className="absolute inset-x-0 top-[54%] -translate-y-1/2 h-[2.5px] opacity-85"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #F5B800 0px, #F5B800 22px, transparent 22px, transparent 44px)',
          }}
        />

        {/* FAR LANE (Driving Right -> Left): Official BCN Taxis, VIP Minivan & Silver Car */}
        <div className="absolute bottom-[19px] sm:bottom-[24px] lg:bottom-[27px] left-0 animate-lane-rtl-1 will-change-transform z-31">
          <MotionSprite
            src={MOTION_ASSETS.taxiBcn}
            alt="Official Barcelona black and yellow taxi"
            className="w-20 sm:w-28 lg:w-32 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]"
          />
        </div>

        <div className="absolute bottom-[19px] sm:bottom-[24px] lg:bottom-[27px] left-0 animate-lane-rtl-2 will-change-transform z-31">
          <MotionSprite
            src={MOTION_ASSETS.vipVan}
            alt="Mercedes V-Class black VIP transfer minivan"
            className="w-24 sm:w-32 lg:w-36 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]"
          />
        </div>

        <div className="absolute bottom-[19px] sm:bottom-[24px] lg:bottom-[27px] left-0 animate-lane-rtl-3 will-change-transform z-31">
          <MotionSprite
            src={MOTION_ASSETS.silverCar}
            alt="Silver European passenger car"
            className="w-20 sm:w-26 lg:w-30 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]"
          />
        </div>

        <div className="hidden sm:block absolute bottom-[19px] sm:bottom-[24px] lg:bottom-[27px] left-0 animate-lane-rtl-4 will-change-transform z-31">
          <MotionSprite
            src={MOTION_ASSETS.taxiBcn}
            alt="Official Barcelona taxi"
            className="w-28 lg:w-32 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]"
          />
        </div>

        {/* NEAR LANE (Driving Left -> Right): Red Vespa Scooter, Sport Motorbike, Normal Car & VIP Minivan */}
        <div className="absolute bottom-[3px] sm:bottom-[4px] left-0 animate-lane-ltr-1 will-change-transform z-35">
          <MotionSprite
            src={MOTION_ASSETS.vespaScooter}
            alt="Barcelona city red scooter rider"
            className="w-11 sm:w-14 lg:w-16 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.75)]"
          />
        </div>

        <div className="absolute bottom-[2px] sm:bottom-[3px] left-0 animate-lane-ltr-2 will-change-transform z-35">
          <MotionSprite
            src={MOTION_ASSETS.silverCar}
            alt="Barcelona commuter hatchback car"
            flipped
            className="w-22 sm:w-30 lg:w-34 h-auto drop-shadow-[0_4px_5px_rgba(0,0,0,0.75)]"
          />
        </div>

        <div className="absolute bottom-[3px] sm:bottom-[4px] left-0 animate-lane-ltr-3 will-change-transform z-35">
          <MotionSprite
            src={MOTION_ASSETS.sportMoto}
            alt="Sport road motorcycle rider"
            className="w-12 sm:w-16 lg:w-18 h-auto drop-shadow-[0_3px_4px_rgba(0,0,0,0.75)]"
          />
        </div>

        <div className="hidden sm:block absolute bottom-[2px] sm:bottom-[3px] left-0 animate-lane-ltr-4 will-change-transform z-35">
          <MotionSprite
            src={MOTION_ASSETS.vipVan}
            alt="Executive black transfer van"
            flipped
            className="w-32 lg:w-38 h-auto drop-shadow-[0_4px_5px_rgba(0,0,0,0.75)]"
          />
        </div>
      </div>
    </div>
  );
};
