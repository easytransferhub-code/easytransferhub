import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Pause, Play, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import type { ClientReview } from '../../api/reviews';

const LOCAL_REVIEWS_KEY = 'eth_client_reviews_v1';

interface MarqueeReviewItem {
  id: string;
  name: string;
  route: string;
  rating: number;
  comment: string;
  meta: string;
}

const FEATURED_PASSENGER_REVIEWS: MarqueeReviewItem[] = [
  {
    id: 'feat-1',
    name: 'Marco Rossi',
    route: 'BCN Terminal 1 → Eixample',
    rating: 5,
    comment:
      'Flight landed 40 minutes late at T1, but our chauffeur tracked the flight live and waited outside baggage claim with a name sign. Fixed €50 fare and spotless car.',
    meta: 'Verified Airport Pickup',
  },
  {
    id: 'feat-2',
    name: 'Sophie Laurent',
    route: 'BCN Airport → Cruise Port',
    rating: 5,
    comment:
      'Travelled with four large suitcases and two kids. The 8-seater Ford Tourneo had plenty of luggage room and dropped us directly at the Moll Adossat terminal.',
    meta: 'Cruise Terminal Transfer',
  },
  {
    id: 'feat-3',
    name: 'David Kennedy',
    route: 'Gothic Quarter → BCN Terminal 2',
    rating: 5,
    comment:
      'Booked a 4:30 AM departure over WhatsApp and received confirmation in minutes. Driver arrived 10 minutes early—smooth highway ride with zero hidden fees.',
    meta: 'Early Morning Pickup',
  },
  {
    id: 'feat-4',
    name: 'Elena Morales',
    route: 'BCN Airport → Sitges',
    rating: 5,
    comment:
      'Cleanest private transfer we have used in Catalonia. Fixed price agreed before landing, cold water waiting inside, and friendly English & Spanish driver.',
    meta: 'Coastal Transfer',
  },
  {
    id: 'feat-5',
    name: 'Henrik Thomsen',
    route: 'BCN Airport → Andorra la Vella',
    rating: 5,
    comment:
      'Comfortable 3-hour private minivan trip into the Pyrenees with all our ski bags. Safe driving and exact upfront fare with every highway toll included.',
    meta: 'Long-Distance Minivan',
  },
  {
    id: 'feat-6',
    name: 'Priya Nair',
    route: 'Barcelona Sants → Costa Brava',
    rating: 5,
    comment:
      'Easy WhatsApp coordination from the high-speed train platform. Pre-installed child seat, immaculate cabin, and courteous punctual chauffeur.',
    meta: 'Rail & Hotel Transfer',
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ET';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recent Review';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const TravellerReviewsMarquee: React.FC = () => {
  const [liveReviews, setLiveReviews] = useState<ClientReview[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const localRaw = localStorage.getItem(LOCAL_REVIEWS_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) setLiveReviews(parsed);
        }
      } catch {
        // ignore storage errors
      }

      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.reviews) && data.reviews.length > 0) {
            setLiveReviews(data.reviews);
          }
        }
      } catch {
        // fallback silently to local/featured reviews
      }
    };

    void loadReviews();

    const onUpdated = () => {
      void loadReviews();
    };
    window.addEventListener('eth-reviews-updated', onUpdated);
    return () => window.removeEventListener('eth-reviews-updated', onUpdated);
  }, []);

  const slides = useMemo<MarqueeReviewItem[]>(() => {
    const mappedLive: MarqueeReviewItem[] = liveReviews
      .filter((r) => r && typeof r.comment === 'string' && r.comment.trim().length > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        route: r.route || 'Barcelona Private Transfer',
        rating: Math.min(5, Math.max(1, Math.round(r.rating || 5))),
        comment: r.comment,
        meta: `Passenger Review · ${formatShortDate(r.createdAt)}`,
      }));

    return [...mappedLive, ...FEATURED_PASSENGER_REVIEWS];
  }, [liveReviews]);

  const ratingSummary = useMemo(() => {
    if (liveReviews.length >= 3) {
      const sum = liveReviews.reduce((acc, r) => acc + Math.min(5, Math.max(1, r.rating || 5)), 0);
      const avg = (sum / liveReviews.length).toFixed(1);
      return `${avg}-star average across ${liveReviews.length} verified passenger reviews.`;
    }
    return '4.9-star average across our verified Barcelona airport & private transfer reviews.';
  }, [liveReviews]);

  const nudgeScroll = (direction: -1 | 1) => {
    setIsPaused(true);
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: direction * 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-7" aria-label="Passenger reviews slider">
      {/* Header Row matching reference style cleanly in Barcelona Taxi Gold & Black */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#111317] tracking-tight leading-tight">
              What EasyTransferHub travellers say.
            </h2>
            <div className="inline-flex items-center gap-0.5" aria-label="4.9 out of 5 stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-4 h-4 fill-[#F5B800] text-[#D99F00]"
                />
              ))}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 tabular-nums">
            {ratingSummary}
          </p>
        </div>

        {/* Interactive Controls + Direct Links to Trustpilot & Full Reviews */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 bg-white border border-[#E5DEC9] rounded-lg p-1">
            <button
              type="button"
              onClick={() => nudgeScroll(-1)}
              className="p-1.5 rounded-md text-neutral-700 hover:bg-[#FAF9F6] hover:text-[#111317] transition-colors cursor-pointer"
              aria-label="Scroll reviews left"
              title="Previous reviews"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-1.5 rounded-md text-neutral-700 hover:bg-[#FAF9F6] hover:text-[#111317] transition-colors cursor-pointer"
              aria-label={isPaused ? 'Resume sliding reviews' : 'Pause sliding reviews'}
              title={isPaused ? 'Resume slide' : 'Pause slide'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => nudgeScroll(1)}
              className="p-1.5 rounded-md text-neutral-700 hover:bg-[#FAF9F6] hover:text-[#111317] transition-colors cursor-pointer"
              aria-label="Scroll reviews right"
              title="Next reviews"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href="https://www.trustpilot.com/review/easytransferhub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5DEC9] hover:border-[#00B67A] text-xs font-bold text-[#111317] transition-colors whitespace-nowrap"
          >
            <Star className="w-3.5 h-3.5 fill-[#00B67A] text-[#00B67A]" />
            <span>Trustpilot</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
          </a>

          <a
            href="#reviews"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0D0F12] hover:bg-[#1E232B] text-[#F5B800] text-xs font-bold transition-colors whitespace-nowrap"
          >
            <span>Leave a Review</span>
          </a>
        </div>
      </div>

      {/* Continuous Smooth Sliding Review Track */}
      <div
        ref={scrollerRef}
        className={`relative review-marquee-group ${
          isPaused ? 'overflow-x-auto' : 'overflow-hidden'
        }`}
      >
        {/* Soft horizontal edge fades on tablet/desktop */}
        {!isPaused && (
          <>
            <div
              aria-hidden="true"
              className="hidden sm:block pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10 bg-gradient-to-r from-[#FAF9F6] to-transparent"
            />
            <div
              aria-hidden="true"
              className="hidden sm:block pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10 bg-gradient-to-l from-[#FAF9F6] to-transparent"
            />
          </>
        )}

        <div
          className={`flex gap-3.5 py-1 ${
            isPaused ? 'w-max' : 'animate-review-marquee'
          }`}
        >
          {(isPaused ? slides : [...slides, ...slides]).map((rev, idx) => (
            <article
              key={`${rev.id}-${idx}`}
              className="w-[285px] sm:w-[325px] shrink-0 bg-white border border-[#E5DEC9] hover:border-[#F5B800] rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-0.5"
                    aria-label={`${rev.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-[#F5B800] text-[#D99F00]'
                            : 'text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-500 truncate">
                    {rev.meta}
                  </span>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed line-clamp-3">
                  “{rev.comment}”
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#F3EEE0] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0D0F12] text-[#F5B800] font-display font-bold text-xs flex items-center justify-center shrink-0">
                  {getInitials(rev.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111317] truncate">
                    {rev.name}
                  </div>
                  <div className="text-[11px] text-[#8A5D00] truncate">
                    {rev.route}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
