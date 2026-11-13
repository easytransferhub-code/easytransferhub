import React from 'react';

type AirlineId = 'vueling' | 'ryanair' | 'easyjet';

interface AirplaneSvgProps {
  idSuffix: string;
  airline: AirlineId;
  flipped?: boolean;
  className?: string;
}

const AIRLINE_STYLES: Record<
  AirlineId,
  {
    label: string;
    tailPrimary: string;
    tailAccent: string;
    bellyColor: string;
    engineColor: string;
    engineLip: string;
    wingletColor: string;
    textColor: string;
    stripeColor: string;
  }
> = {
  vueling: {
    label: 'vueling',
    tailPrimary: '#334155',
    tailAccent: '#facc15',
    bellyColor: '#475569',
    engineColor: '#facc15',
    engineLip: '#334155',
    wingletColor: '#facc15',
    textColor: '#1e293b',
    stripeColor: '#facc15',
  },
  ryanair: {
    label: 'RYANAIR',
    tailPrimary: '#073590',
    tailAccent: '#f5c518',
    bellyColor: '#073590',
    engineColor: '#073590',
    engineLip: '#f5c518',
    wingletColor: '#f5c518',
    textColor: '#073590',
    stripeColor: '#f5c518',
  },
  easyjet: {
    label: 'easyJet',
    tailPrimary: '#ff6600',
    tailAccent: '#ffffff',
    bellyColor: '#ff6600',
    engineColor: '#ff6600',
    engineLip: '#e2e8f0',
    wingletColor: '#ff6600',
    textColor: '#ff6600',
    stripeColor: '#ff6600',
  },
};

const RealisticAirplaneSvg: React.FC<AirplaneSvgProps> = ({
  idSuffix,
  airline,
  flipped = false,
  className = 'w-28 sm:w-36 h-auto',
}) => {
  const s = AIRLINE_STYLES[airline];

  return (
    <svg
      viewBox="0 0 280 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`contrail-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d1fae5" stopOpacity="0" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id={`body-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#f8fafc" />
          <stop offset="85%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={`wing-${idSuffix}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Directional aircraft geometry group (flipped cleanly for right-to-left cruise) */}
      <g transform={flipped ? 'translate(280, 0) scale(-1, 1)' : undefined}>
        {/* Dual realistic engine vortex contrails */}
        <path
          d="M2 41 L82 40"
          stroke={`url(#contrail-${idSuffix})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M14 45 L88 44"
          stroke={`url(#contrail-${idSuffix})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Far wing silhouette behind fuselage */}
        <path
          d="M158 34 L126 16 L142 16 L180 33 Z"
          fill="#94a3b8"
          opacity="0.72"
        />

        {/* Realistic vertical stabilizer / tailfin with airline livery */}
        <path
          d="M96 34 L77 6 L96 6 L123 33 Z"
          fill={s.tailPrimary}
          stroke="#475569"
          strokeWidth="0.5"
        />

        {/* Brand-specific tail motif */}
        {airline === 'vueling' && (
          <g fill={s.tailAccent}>
            <circle cx="92" cy="14" r="2.1" />
            <circle cx="97.5" cy="18.5" r="2.5" />
            <circle cx="90.5" cy="20.5" r="1.8" />
            <circle cx="95" cy="24.5" r="2.2" />
            <circle cx="101.5" cy="23.5" r="1.6" />
          </g>
        )}
        {airline === 'ryanair' && (
          <path
            d="M88 26 C88 18 93 13 99 12 C96 17 98 22 103 25 L94 27 Z"
            fill={s.tailAccent}
          />
        )}
        {airline === 'easyjet' && (
          <>
            <path d="M96 34 L132 34 L118 46 L94 45 Z" fill="#ff6600" />
            <rect x="85" y="16" width="17" height="3.5" rx="1.5" fill="#ffffff" opacity="0.9" />
          </>
        )}

        {/* Horizontal rear tailplane */}
        <path d="M92 38 L78 31.5 L89 31.5 L108 38 Z" fill="#64748b" />

        {/* Sleek Airbus/Boeing fuselage */}
        <path
          d="M92 38.5 C92 33 101 29 116 29 L224 29 C244 29 258 34 265 39.5 C260 44 244 46.5 222 46.5 L110 46.5 C98 46.5 92 43 92 38.5 Z"
          fill={`url(#body-${idSuffix})`}
          stroke="#94a3b8"
          strokeWidth="0.7"
        />

        {/* Lower belly / airline livery swoosh */}
        {airline === 'easyjet' ? (
          <path
            d="M95 40.5 L154 29.2 L144 46.3 L109 46.3 C99 46.3 95 43.8 95 40.5 Z"
            fill={s.bellyColor}
          />
        ) : (
          <path
            d="M98 42.2 L249 42.2 C243 45 232 46.2 219 46.2 L110 46.2 C102 46.2 98.5 44.5 98 42.2 Z"
            fill={s.bellyColor}
          />
        )}

        {/* Accent cheatline stripe */}
        {airline === 'ryanair' && (
          <line x1="112" y1="41.6" x2="250" y2="41.6" stroke={s.stripeColor} strokeWidth="1.5" />
        )}
        {airline === 'vueling' && (
          <line x1="110" y1="41.8" x2="246" y2="41.8" stroke={s.stripeColor} strokeWidth="1.4" />
        )}

        {/* Realistic wrap-around cockpit glazing */}
        <path d="M242 32.2 L252 33.4 L257 36.8 L244 36.8 Z" fill="#0f172a" />
        <path d="M237 32.6 L240.8 32.3 L242 36.8 L237.5 36.8 Z" fill="#1e293b" />

        {/* Passenger doors & cabin window strip */}
        <rect x="122" y="34.5" width="3" height="6" rx="1" stroke="#94a3b8" strokeWidth="0.6" fill="#e2e8f0" />
        <rect x="229" y="34.5" width="3.2" height="6" rx="1" stroke="#94a3b8" strokeWidth="0.6" fill="#e2e8f0" />
        <g fill="#0f172a" opacity="0.82">
          {[132, 138, 144, 150, 156, 162, 168, 174, 180, 186, 192, 198, 204, 210, 216, 222].map((wx) => (
            <rect key={wx} x={wx} y="37" width="3.1" height="2.4" rx="0.9" />
          ))}
        </g>

        {/* Near swept wing with flap fairings & airline winglet */}
        <path
          d="M167 41 L126 62 L141 62 L191 41 Z"
          fill={`url(#wing-${idSuffix})`}
          stroke="#94a3b8"
          strokeWidth="0.7"
        />
        {/* Winglet / Sharklet */}
        <path d="M126 62 L120 55.5 L128 56.5 L133 62 Z" fill={s.wingletColor} />
        {/* Under-wing flap track fairings */}
        <ellipse cx="146" cy="54" rx="3.5" ry="1.1" fill="#64748b" />
        <ellipse cx="158" cy="49" rx="3.5" ry="1.1" fill="#64748b" />

        {/* Detailed Turbofan Jet Engine */}
        <rect x="159" y="43.5" width="21" height="8.5" rx="4" fill={s.engineColor} stroke="#334155" strokeWidth="0.5" />
        <rect x="176" y="44" width="4.5" height="7.5" rx="2" fill={s.engineLip} />
        <ellipse cx="180.2" cy="47.7" rx="1.6" ry="3" fill="#0f172a" />
        <circle cx="180.4" cy="47.7" r="0.8" fill="#cbd5e1" />

        {/* Wingtip green/amber beacon light */}
        <circle cx="123.5" cy="58" r="1.7" fill="#10b981" />
      </g>

      {/* Upright Forward-Readable Airline Color Logo directly on the fuselage */}
      <text
        x={flipped ? 105 : 176}
        y="34.8"
        textAnchor="middle"
        fill={s.textColor}
        fontSize={airline === 'ryanair' ? '6.6' : '7.2'}
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing={airline === 'ryanair' ? '0.6' : '0.2'}
      >
        {s.label}
      </text>
    </svg>
  );
};

interface TrainSvgProps {
  idSuffix: string;
  flipped?: boolean;
  variant?: 'highspeed' | 'commuter';
  className?: string;
}

const TrainSvg: React.FC<TrainSvgProps> = ({
  idSuffix,
  flipped = false,
  variant = 'highspeed',
  className = 'w-[340px] sm:w-[440px] h-auto',
}) => {
  const isHighSpeed = variant === 'highspeed';
  const bodyPrimary = isHighSpeed ? '#ffffff' : '#ecfdf5';
  const stripeColor = isHighSpeed ? '#059669' : '#047857';
  const noseAccent = isHighSpeed ? '#065f46' : '#064e3b';

  return (
    <svg
      viewBox="0 0 540 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`beam-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Subtle forward headlight glow */}
      <polygon points="528,31 540,26 540,39 528,36" fill={`url(#beam-${idSuffix})`} />

      {/* Pantographs touching overhead wire */}
      <path d="M138 14 L145 5 L155 5 L148 14" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="141" y1="4.5" x2="159" y2="4.5" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M388 14 L395 5 L405 5 L398 14" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="391" y1="4.5" x2="409" y2="4.5" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />

      {/* Coach 1 (Rear) */}
      <rect x="8" y="14" width="122" height="23" rx="3" fill={bodyPrimary} stroke="#94a3b8" strokeWidth="0.9" />
      <rect x="8" y="29.5" width="122" height="3.8" fill={stripeColor} />
      <rect x="8" y="14" width="122" height="3.2" rx="1.5" fill="#cbd5e1" />
      {[18, 34, 50, 66, 82, 98, 114].map((x) => (
        <rect key={x} x={x} y="19.5" width="11" height="7.5" rx="1.5" fill="#0f172a" opacity="0.85" />
      ))}

      {/* Accordion Connector 1 */}
      <rect x="130" y="16" width="5" height="20" fill="#475569" />

      {/* Coach 2 */}
      <rect x="135" y="14" width="124" height="23" rx="2" fill={bodyPrimary} stroke="#94a3b8" strokeWidth="0.9" />
      <rect x="135" y="29.5" width="124" height="3.8" fill={stripeColor} />
      <rect x="135" y="14" width="124" height="3.2" fill="#cbd5e1" />
      {[145, 161, 177, 193, 209, 225, 241].map((x) => (
        <rect key={x} x={x} y="19.5" width="11" height="7.5" rx="1.5" fill="#0f172a" opacity="0.85" />
      ))}

      {/* Accordion Connector 2 */}
      <rect x="259" y="16" width="5" height="20" fill="#475569" />

      {/* Coach 3 */}
      <rect x="264" y="14" width="124" height="23" rx="2" fill={bodyPrimary} stroke="#94a3b8" strokeWidth="0.9" />
      <rect x="264" y="29.5" width="124" height="3.8" fill={stripeColor} />
      <rect x="264" y="14" width="124" height="3.2" fill="#cbd5e1" />
      {[274, 290, 306, 322, 338, 354, 370].map((x) => (
        <rect key={x} x={x} y="19.5" width="11" height="7.5" rx="1.5" fill="#0f172a" opacity="0.85" />
      ))}

      {/* Accordion Connector 3 */}
      <rect x="388" y="16" width="5" height="20" fill="#475569" />

      {/* Lead Aerodynamic Locomotive Head */}
      <path
        d="M393 14 L486 14 C505 14 524 23 531 32 C533 34.5 530 37 524 37 L393 37 Z"
        fill={bodyPrimary}
        stroke="#94a3b8"
        strokeWidth="0.9"
      />
      {/* Nose aerodynamic stripe */}
      <path d="M393 29.5 L527 29.5 C530 31.5 530 33.3 526 33.3 L393 33.3 Z" fill={stripeColor} />
      <path d="M393 14 L484 14 C490 14 494 15.8 498 17.2 L393 17.2 Z" fill={noseAccent} opacity="0.85" />

      {/* Cab windshield */}
      <path d="M487 17.5 L505 19.5 L517 26.5 L491 26.5 Z" fill="#0f172a" />
      {/* Passenger windows on lead car */}
      {[404, 420, 436, 452, 468].map((x) => (
        <rect key={x} x={x} y="19.5" width="11" height="7.5" rx="1.5" fill="#0f172a" opacity="0.85" />
      ))}

      {/* Headlight & red tail indicator */}
      <circle cx="524" cy="31.5" r="2.2" fill="#fef08a" />
      <rect x="9" y="29" width="2.5" height="4" rx="1" fill="#ef4444" />

      {/* Underbody bogies & steel wheels resting on rail */}
      {[28, 102, 154, 232, 282, 360, 412, 488].map((bx) => (
        <g key={bx}>
          <rect x={bx} y="37" width="22" height="3.2" rx="1" fill="#334155" />
          <circle cx={bx + 5} cy="41.5" r="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
          <circle cx={bx + 17} cy="41.5" r="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
};

interface TaxiCarSvgProps {
  variant: 'bcn-taxi' | 'emerald-sedan' | 'vip-van';
  flipped?: boolean;
  className?: string;
}

const TaxiCarSvg: React.FC<TaxiCarSvgProps> = ({
  variant,
  flipped = false,
  className = 'w-24 sm:w-28 h-auto',
}) => {
  const wheelAnimClass = flipped ? 'animate-wheel-rev' : 'animate-wheel';

  if (variant === 'vip-van') {
    return (
      <svg
        viewBox="0 0 156 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={flipped ? { transform: 'scaleX(-1)' } : undefined}
        aria-hidden="true"
      >
        <ellipse cx="78" cy="49" rx="64" ry="3.2" fill="#0f172a" opacity="0.3" />
        <polygon points="145,29 156,25 156,37 145,35" fill="#fef08a" opacity="0.55" />

        <path
          d="M12 37 L12 16 C12 11 16 8 23 8 L106 8 C117 8 128 14 137 22 L144 26 C147 28 148 31 148 35 L148 40 L12 40 Z"
          fill="#ffffff"
          stroke="#059669"
          strokeWidth="1.2"
        />
        <rect x="13" y="29" width="134" height="5" fill="#059669" />

        <rect x="16" y="12" width="26" height="12" rx="2" fill="#0f172a" />
        <rect x="46" y="12" width="28" height="12" rx="1.5" fill="#0f172a" />
        <rect x="78" y="12" width="26" height="12" rx="1.5" fill="#0f172a" />
        <path d="M108 12 L120 12 L132 23 L108 23 Z" fill="#0f172a" />

        <rect x="142" y="28" width="5" height="4" rx="1" fill="#fef08a" />
        <rect x="12" y="27" width="3.5" height="5" rx="1" fill="#ef4444" />

        {[38, 118].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="41" r="8.2" fill="#0f172a" />
            <g className={wheelAnimClass}>
              <circle cx={cx} cy="41" r="4.6" fill="#e2e8f0" />
              <line x1={cx - 4} y1="41" x2={cx + 4} y2="41" stroke="#475569" strokeWidth="1.2" />
              <line x1={cx} y1="37" x2={cx} y2="45" stroke="#475569" strokeWidth="1.2" />
            </g>
          </g>
        ))}
      </svg>
    );
  }

  const isBcnTaxi = variant === 'bcn-taxi';
  const bodyColor = isBcnTaxi ? '#111827' : '#065f46';
  const doorColor = isBcnTaxi ? '#facc15' : '#10b981';

  return (
    <svg
      viewBox="0 0 144 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <ellipse cx="72" cy="43.5" rx="58" ry="3" fill="#0f172a" opacity="0.32" />
      <polygon points="134,27 144,23 144,34 134,32" fill="#fef08a" opacity="0.55" />

      {isBcnTaxi && (
        <g>
          <rect x="61" y="4.5" width="18" height="6" rx="1.8" fill="#fef08a" stroke="#111827" strokeWidth="0.9" />
          <rect x="64" y="6.2" width="12" height="2.4" rx="0.8" fill="#10b981" />
        </g>
      )}

      <path
        d="M10 34 L12 22 L32 20 L48 10.5 L92 10.5 L112 21 L133 24 C136 25 138 28 138 32 L138 35.5 L10 35.5 Z"
        fill={bodyColor}
        stroke={isBcnTaxi ? '#334155' : '#34d399'}
        strokeWidth="0.9"
      />

      {isBcnTaxi ? (
        <path d="M40 22 L99 22 L97 34.5 L38 34.5 Z" fill={doorColor} />
      ) : (
        <rect x="34" y="25.5" width="76" height="2.6" rx="1" fill={doorColor} />
      )}

      <path d="M36 20.5 L50 12.5 L68 12.5 L68 20.5 Z" fill="#0f172a" opacity="0.9" />
      <path d="M72 12.5 L90 12.5 L107 20.5 L72 20.5 Z" fill="#0f172a" opacity="0.9" />

      <rect x="132" y="25.5" width="5" height="3.8" rx="1.2" fill="#fef08a" />
      <rect x="10.5" y="24.5" width="3.5" height="4.5" rx="1" fill="#ef4444" />

      {[34, 108].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="36" r="7.5" fill="#0f172a" />
          <g className={wheelAnimClass}>
            <circle cx={cx} cy="36" r="4.2" fill="#e2e8f0" />
            <line x1={cx - 3.6} y1="36" x2={cx + 3.6} y2="36" stroke="#475569" strokeWidth="1.2" />
            <line x1={cx} y1="32.4" x2={cx} y2="39.6" stroke="#475569" strokeWidth="1.2" />
          </g>
        </g>
      ))}
    </svg>
  );
};

/**
 * Animated Airplane & Soft Mint Cloud Layer for the Upper Sky of the Hero
 */
export const HeroSkyPlanes: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-[1]" aria-hidden="true">
      {/* Drifting soft clouds */}
      <div className="absolute top-2 left-0 animate-cloud-slow opacity-55">
        <svg width="180" height="46" viewBox="0 0 180 46" fill="none">
          <path
            d="M28 38 H150 C161 38 168 31 168 23 C168 15.5 161 10 152 10 C149 10 146 11 143 12.5 C139 5 130 1 120 1 C107 1 97 8 94 17.5 C90 15 84 13.5 78 13.5 C64 13.5 53 21.5 51 31 C49 30 46 29.5 43 29.5 C34 29.5 28 33 28 38 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
      <div className="absolute top-14 left-0 animate-cloud-mid opacity-40">
        <svg width="140" height="36" viewBox="0 0 180 46" fill="none">
          <path
            d="M28 38 H150 C161 38 168 31 168 23 C168 15.5 161 10 152 10 C149 10 146 11 143 12.5 C139 5 130 1 120 1 C107 1 97 8 94 17.5 C90 15 84 13.5 78 13.5 C64 13.5 53 21.5 51 31 C49 30 46 29.5 43 29.5 C34 29.5 28 33 28 38 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Vueling Yellow/Grey Jet cruising top sky */}
      <div className="absolute top-0.5 left-0 animate-fly-ltr will-change-transform">
        <RealisticAirplaneSvg
          idSuffix="sky-vueling"
          airline="vueling"
          className="w-28 sm:w-36 h-auto drop-shadow-xs"
        />
      </div>

      {/* Ryanair Blue/Gold Jet flying opposite direction */}
      <div className="absolute top-6 left-0 animate-fly-rtl will-change-transform">
        <RealisticAirplaneSvg
          idSuffix="sky-ryanair"
          airline="ryanair"
          flipped
          className="w-24 sm:w-32 h-auto opacity-95 drop-shadow-xs"
        />
      </div>
    </div>
  );
};

/**
 * Full-Width Live Transit Panorama placed directly right below the Booking Calculator & "Get Price" button:
 * Realistic Vueling, Ryanair & easyJet flying jets in open sky + High-Speed Trains on Rail Track + Moving Barcelona Taxis on Road
 */
export const TransitCorridorScene: React.FC = () => {
  return (
    <div
      className="relative w-full h-40 sm:h-48 mt-3 overflow-hidden pointer-events-none select-none border-y border-emerald-200/70 bg-gradient-to-b from-[#ecfdf5]/80 via-[#f4fbf7] to-white"
      aria-hidden="true"
    >
      {/* Subtle drifting sky clouds */}
      <div className="absolute top-2 left-0 animate-cloud-mid opacity-65">
        <svg width="150" height="38" viewBox="0 0 180 46" fill="none">
          <path
            d="M28 38 H150 C161 38 168 31 168 23 C168 15.5 161 10 152 10 C149 10 146 11 143 12.5 C139 5 130 1 120 1 C107 1 97 8 94 17.5 C90 15 84 13.5 78 13.5 C64 13.5 53 21.5 51 31 C49 30 46 29.5 43 29.5 C34 29.5 28 33 28 38 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Distant soft green Catalan hills & Barcelona landmark silhouettes */}
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[34px] sm:bottom-[42px] w-full h-24 sm:h-28 text-emerald-200/50"
        fill="currentColor"
      >
        <path d="M0,120 Q180,68 380,96 T780,84 T1160,98 T1440,76 L1440,160 L0,160 Z" />
        <g className="text-emerald-300/45">
          <rect x="190" y="72" width="12" height="36" rx="1" />
          <rect x="206" y="64" width="16" height="44" rx="1" />
          <rect x="330" y="68" width="5" height="36" />
          <path d="M323 64 L342 64 L339 70 L326 70 Z" />
          <rect x="942" y="54" width="5" height="52" rx="2" />
          <rect x="950" y="46" width="6" height="60" rx="2.5" />
          <rect x="959" y="54" width="5" height="52" rx="2" />
          <path d="M1110,105 L1110,68 C1110,56 1126,56 1126,68 L1126,105 Z" />
        </g>
      </svg>

      {/* Open-Sky Realistic Airline Fleet directly visible right beneath "Get Price" */}
      {/* 1. Vueling (Yellow & Slate) flying Left-to-Right */}
      <div className="absolute top-1.5 sm:top-2 left-0 animate-fly-ltr will-change-transform z-10">
        <RealisticAirplaneSvg
          idSuffix="corridor-vueling"
          airline="vueling"
          className="w-28 sm:w-36 h-auto drop-shadow-xs"
        />
      </div>

      {/* 2. easyJet (Vibrant Orange & White) flying Left-to-Right at staggered phase */}
      <div className="absolute top-6 sm:top-7 left-0 animate-fly-high will-change-transform z-10">
        <RealisticAirplaneSvg
          idSuffix="corridor-easyjet"
          airline="easyjet"
          className="w-28 sm:w-36 h-auto drop-shadow-xs"
        />
      </div>

      {/* 3. Ryanair (Royal Blue & Gold Harp) flying Right-to-Left */}
      <div className="absolute top-3.5 sm:top-4 left-0 animate-fly-rtl will-change-transform z-10">
        <RealisticAirplaneSvg
          idSuffix="corridor-ryanair"
          airline="ryanair"
          flipped
          className="w-28 sm:w-36 h-auto drop-shadow-xs"
        />
      </div>

      {/* Overhead Electric Railway Catenary Wire + Poles */}
      <div className="absolute inset-x-0 bottom-[66px] sm:bottom-[80px] h-10 z-10">
        <div className="absolute inset-x-0 top-2 h-[1px] bg-emerald-700/25" />
        <div className="absolute inset-x-0 top-4 h-[1px] bg-emerald-700/35" />
        <div
          className="absolute inset-x-0 top-0 h-10 opacity-45"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #065f46 0px, #065f46 2px, transparent 2px, transparent 180px)',
          }}
        />
      </div>

      {/* Moving Trains Track Layer */}
      <div className="absolute inset-x-0 bottom-[50px] sm:bottom-[60px] h-12 z-20">
        <div className="absolute bottom-[3px] left-0 animate-rail-rtl will-change-transform opacity-85">
          <TrainSvg
            idSuffix="rail-rtl"
            flipped
            variant="commuter"
            className="w-[260px] sm:w-[320px] h-auto"
          />
        </div>
        <div className="absolute bottom-0 left-0 animate-rail-ltr will-change-transform">
          <TrainSvg
            idSuffix="rail-ltr"
            variant="highspeed"
            className="w-[330px] sm:w-[440px] h-auto drop-shadow-xs"
          />
        </div>
      </div>

      {/* Elevated Steel Rail Track & Sleepers Bar */}
      <div className="absolute inset-x-0 bottom-[38px] sm:bottom-[46px] h-[14px] z-20">
        <div className="w-full h-[2px] bg-slate-500" />
        <div className="w-full h-[2px] bg-slate-400 mt-[2px]" />
        <div
          className="w-full h-[4px]"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #065f46 0px, #065f46 6px, transparent 6px, transparent 14px)',
            opacity: 0.45,
          }}
        />
        <div className="w-full h-[5px] bg-emerald-100 border-y border-emerald-200" />
      </div>

      {/* Greenery median strip separating rail viaduct & avenue */}
      <div className="absolute inset-x-0 bottom-[33px] sm:bottom-[40px] h-[7px] bg-gradient-to-r from-emerald-500/25 via-emerald-400/35 to-emerald-500/25 z-20" />

      {/* Boulevard Asphalt Road with Dashed Lanes & Moving Taxis / Chauffeur Cars */}
      <div className="absolute inset-x-0 bottom-0 h-[34px] sm:h-[40px] bg-slate-800 border-t-2 border-emerald-500/60 z-30">
        <div className="w-full h-[2px] bg-slate-600/80" />
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] opacity-65"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #ecfdf5 0px, #ecfdf5 18px, transparent 18px, transparent 36px)',
          }}
        />

        {/* Far Lane (Right-to-Left Traffic) */}
        <div className="absolute bottom-[13px] sm:bottom-[16px] left-0 animate-drive-rtl-fast will-change-transform">
          <TaxiCarSvg variant="bcn-taxi" flipped className="w-20 sm:w-24 h-auto" />
        </div>
        <div className="absolute bottom-[13px] sm:bottom-[16px] left-0 animate-drive-rtl-slow will-change-transform">
          <TaxiCarSvg variant="vip-van" flipped className="w-24 sm:w-28 h-auto" />
        </div>

        {/* Near Lane (Left-to-Right Traffic) */}
        <div className="absolute bottom-[2px] left-0 animate-drive-ltr-fast will-change-transform">
          <TaxiCarSvg variant="bcn-taxi" className="w-24 sm:w-28 h-auto" />
        </div>
        <div className="absolute bottom-[2px] left-0 animate-drive-ltr-slow will-change-transform">
          <TaxiCarSvg variant="emerald-sedan" className="w-24 sm:w-28 h-auto" />
        </div>
      </div>
    </div>
  );
};
