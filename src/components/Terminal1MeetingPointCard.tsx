import React, { useState } from 'react';
import { MapPin, Maximize2, X } from 'lucide-react';

export const COMO_T1_PHOTO_PATH = '/images/como-t1-meeting-point.jpg';
export const HORSE_T2_PHOTO_PATH = '/images/horse-t2-meeting-point.jpg';

export function isTerminal1Pickup(pickup?: string): boolean {
  if (!pickup) return false;
  return /terminal\s*1|\bbcn\s*t1\b|\bt1\b.*(?:airport|barcelona|bcn|prat)|(?:airport|barcelona|bcn|prat).*\bt1\b/i.test(
    pickup
  );
}

export function isTerminal2Pickup(pickup?: string): boolean {
  if (!pickup) return false;
  return /terminal\s*2|\bbcn\s*t2\b|\bt2\b.*(?:airport|barcelona|bcn|prat)|(?:airport|barcelona|bcn|prat).*\bt2\b/i.test(
    pickup
  );
}

export interface AirportMeetingPointDetails {
  terminal: 'T1' | 'T2';
  badge: string;
  modalSubheader: string;
  headline: string;
  landmarkName: string;
  photoPath: string;
  photoAlt: string;
  shortLine: string;
}

export function getAirportMeetingPoint(pickup?: string): AirportMeetingPointDetails | null {
  if (isTerminal1Pickup(pickup)) {
    return {
      terminal: 'T1',
      badge: 'Terminal 1 Meeting Point',
      modalSubheader: 'Barcelona Airport (BCN) · Terminal 1',
      headline: 'In front of COMO Restaurant (T1 Arrivals Hall)',
      landmarkName: 'COMO Restaurante & Café',
      photoPath: COMO_T1_PHOTO_PATH,
      photoAlt: 'COMO Restaurante & Café meeting point inside Barcelona Airport Terminal 1 Arrivals',
      shortLine: 'In front of COMO Restaurant (T1 Arrivals Hall, Floor 1)',
    };
  }
  if (isTerminal2Pickup(pickup)) {
    return {
      terminal: 'T2',
      badge: 'Terminal 2 Meeting Point',
      modalSubheader: 'Barcelona Airport (BCN) · Terminal 2',
      headline: 'At the Horse Statue · "El Caballo" (T2 Arrivals Hall)',
      landmarkName: 'Horse Statue ("El Caballo" by Botero)',
      photoPath: HORSE_T2_PHOTO_PATH,
      photoAlt: 'Large Horse Statue El Caballo meeting point inside Barcelona Airport Terminal 2 Arrivals',
      shortLine: 'At the Horse Statue "El Caballo" (T2 Arrivals Hall)',
    };
  }
  return null;
}

interface Terminal1MeetingPointCardProps {
  pickup?: string;
  compact?: boolean;
  passengerName?: string;
}

export const Terminal1MeetingPointCard: React.FC<Terminal1MeetingPointCardProps> = ({
  pickup,
  passengerName,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const details = getAirportMeetingPoint(pickup);

  if (!details) return null;

  const signText = passengerName?.trim() ? `"${passengerName.trim()}"` : 'your name';

  return (
    <>
      <div className="rounded-xl bg-[#FBF7E6] border border-[#DFC670] p-3 sm:p-3.5 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          {/* Clickable Real Airport Landmark Photo */}
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group relative w-full sm:w-44 h-28 sm:h-28 rounded-lg overflow-hidden border border-[#DFC670] bg-slate-900 shrink-0 cursor-pointer text-left"
            title={`View full photo of ${details.landmarkName}`}
          >
            <img
              src={details.photoPath}
              alt={details.photoAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0D0F12]/85 text-[#F5B800] text-[10px] font-bold">
              <Maximize2 className="w-2.5 h-2.5" />
              <span>Zoom</span>
            </span>
          </button>

          {/* Clear Pickup / Meeting Instructions */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#8A5D00]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{details.badge}</span>
            </div>
            <h4 className="font-display font-extrabold text-sm text-[#0D0F12] leading-snug">
              {details.headline}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
              {details.terminal === 'T1' ? (
                <>
                  After collecting your luggage, exit into the main Terminal 1 public Arrivals Hall and walk toward{' '}
                  <strong className="text-[#0D0F12]">COMO Restaurante &amp; Café</strong>. Your chauffeur will be waiting right in front of COMO Restaurant holding a signboard reading{' '}
                  <strong className="text-[#704B00]">{signText}</strong>.
                </>
              ) : (
                <>
                  After collecting your luggage at Terminal 2, exit into the main Arrivals Hall and walk toward the iconic large{' '}
                  <strong className="text-[#0D0F12]">Horse Statue (&ldquo;El Caballo&rdquo;)</strong>. Your chauffeur will be waiting right beside the Horse Statue holding a signboard reading{' '}
                  <strong className="text-[#704B00]">{signText}</strong>.
                </>
              )}
            </p>
            <p className="text-[10px] font-semibold text-[#704B00]">
              This meeting point photo &amp; instructions are automatically included in your confirmation email.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Photo Preview */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setZoomed(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border border-[#DFC670] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0D0F12] text-white px-4 py-3 flex items-center justify-between border-b border-[#F5B800]/50">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F5B800] block">
                  {details.modalSubheader}
                </span>
                <h5 className="font-display font-bold text-sm sm:text-base">
                  Meeting Point: {details.headline}
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setZoomed(false)}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close meeting point photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={details.photoPath}
              alt={details.photoAlt}
              className="w-full h-auto max-h-[75vh] object-contain bg-slate-950"
            />
            <div className="px-4 py-3 bg-[#FCFBF7] text-xs text-slate-700 border-t border-[#E6DFCB]">
              {details.terminal === 'T1' ? (
                <>
                  Exit baggage claim into the public Terminal 1 Arrivals Hall. Your EasyTransferHub driver waits right outside <strong>COMO Restaurante &amp; Café</strong> with your name signboard.
                </>
              ) : (
                <>
                  Exit baggage claim into the public Terminal 2 Arrivals Hall. Your EasyTransferHub driver waits right beside the famous <strong>Horse Statue (&ldquo;El Caballo&rdquo;)</strong> with your name signboard.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
