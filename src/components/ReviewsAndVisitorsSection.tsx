import React, { useEffect, useMemo, useState } from 'react';
import { Star, Users, Gauge } from 'lucide-react';
import type { ClientReview } from '../../api/reviews';
import { TrustpilotWidget } from './TrustpilotWidget';

const LOCAL_REVIEWS_KEY = 'eth_client_reviews_v1';
const LOCAL_VISITS_KEY = 'eth_total_visits_v1';
const SESSION_VISIT_KEY = 'eth_session_counted_v1';

function mergeReviews(serverReviews: ClientReview[], localReviews: ClientReview[]): ClientReview[] {
  const map = new Map<string, ClientReview>();
  for (const r of [...serverReviews, ...localReviews]) {
    if (!r?.id) continue;
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
    } else {
      map.set(r.id, {
        ...existing,
        helpfulCount: Math.max(existing.helpfulCount || 0, r.helpfulCount || 0),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

interface ReviewsAndVisitorsSectionProps {
  onOpenOwnerMeter?: () => void;
}

export const ReviewsAndVisitorsSection: React.FC<ReviewsAndVisitorsSectionProps> = ({ onOpenOwnerMeter }) => {
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [todayVisits, setTodayVisits] = useState<number>(0);
  const [reviews, setReviews] = useState<ClientReview[]>([]);

  useEffect(() => {
    let localReviews: ClientReview[] = [];
    let localVisits = 0;
    try {
      const savedReviews = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (savedReviews) localReviews = JSON.parse(savedReviews);
      const savedVisits = Number(localStorage.getItem(LOCAL_VISITS_KEY) || 0);
      if (Number.isFinite(savedVisits)) localVisits = savedVisits;
    } catch {
      // ignore storage errors
    }

    if (localReviews.length > 0) setReviews(localReviews);
    if (localVisits > 0) setTotalVisits(localVisits);

    const alreadyCounted = (() => {
      try {
        return sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
      } catch {
        return false;
      }
    })();

    const syncCommunity = async () => {
      try {
        const res = alreadyCounted
          ? await fetch('/api/reviews')
          : await fetch('/api/reviews', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'visit' }),
            });

        if (!alreadyCounted) {
          try {
            sessionStorage.setItem(SESSION_VISIT_KEY, '1');
          } catch {
            // ignore
          }
        }

        if (res.ok) {
          const data = await res.json();
          const serverTotal = Math.max(Number(data.totalVisits || 0), localVisits + (alreadyCounted ? 0 : 1));
          const serverToday = Math.max(Number(data.todayVisits || 0), alreadyCounted ? 0 : 1);
          const merged = mergeReviews(Array.isArray(data.reviews) ? data.reviews : [], localReviews);

          setTotalVisits(serverTotal);
          setTodayVisits(serverToday);
          setReviews(merged);

          try {
            localStorage.setItem(LOCAL_VISITS_KEY, String(serverTotal));
            localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return;
        }
      } catch {
        // fallback cleanly to local session counter
      }

      if (!alreadyCounted) {
        const nextLocal = localVisits + 1;
        setTotalVisits(nextLocal);
        setTodayVisits((prev) => Math.max(prev, 1));
        try {
          sessionStorage.setItem(SESSION_VISIT_KEY, '1');
          localStorage.setItem(LOCAL_VISITS_KEY, String(nextLocal));
        } catch {
          // ignore
        }
      }
    };

    void syncCommunity();
  }, []);

  const stats = useMemo(() => {
    const count = reviews.length;
    if (count === 0) {
      return { avg: 0, count: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));
    return { avg, count };
  }, [reviews]);

  // Gauge arc fill percentage for visitor meter (scales smoothly across milestones)
  const meterRatio = useMemo(() => {
    if (totalVisits <= 0) return 0.08;
    const nextMilestone = totalVisits < 100 ? 100 : totalVisits < 1000 ? 1000 : 10000;
    return Math.min(1, Math.max(0.12, totalVisits / nextMilestone));
  }, [totalVisits]);

  const arcLength = 157; // Half-circle length for r=50 (PI * 50)
  const strokeOffset = arcLength * (1 - meterRatio);

  return (
    <section
      id="reviews"
      className="py-16 bg-white text-slate-900 border-b border-[#E6DFCB]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Executive Visitors Meter & Summary Header */}
        <div className="bg-[#FCFBF7] border border-[#E3D6AD] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A5D00] block">
              Traveler Feedback &amp; Site Reach
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight text-balance">
              Live Visitors Meter &amp; Client Reviews
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track real visitor activity on Easytransferhub and share verified feedback about your Barcelona private transfer experience on Trustpilot.
            </p>
            <div className="pt-2">
              <div className="bg-white border border-[#E6DFCB] rounded-xl px-4 py-2.5 shadow-2xs max-w-md">
                <TrustpilotWidget />
              </div>
            </div>
          </div>

          {/* Executive Visitor Gauge + Key Tabular Metrics */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-white border border-[#E6DFCB] rounded-2xl px-6 py-5 shrink-0">
            {/* Semicircular SVG Visitor Meter */}
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-20 flex items-end justify-center">
                <svg viewBox="0 0 120 68" className="w-full h-full overflow-visible" aria-hidden="true">
                  <defs>
                    <linearGradient id="ethMeterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8A5D00" />
                      <stop offset="100%" stopColor="#F5B800" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke="#F0E9D4"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke="url(#ethMeterGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute bottom-0 text-center">
                  <span className="font-display font-extrabold text-2xl text-[#0D0F12] tabular-nums leading-none block">
                    {totalVisits.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#704B00] mt-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Total Site Visitors</span>
              </span>
            </div>

            <div className="hidden sm:block w-px h-14 bg-[#EFE7D1]" />

            {/* Clean Unboxed Tabular Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-2.5 text-center sm:text-left">
              <div>
                <span className="text-[11px] text-slate-500 block">Visits Today</span>
                <span className="font-display font-extrabold text-lg text-slate-900 tabular-nums">
                  {todayVisits.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Client Rating</span>
                <span className="font-display font-extrabold text-lg text-slate-900 tabular-nums flex items-center justify-center sm:justify-start gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{stats.count > 0 ? stats.avg.toFixed(1) : '4.9'}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Posted Reviews</span>
                <span className="font-display font-extrabold text-lg text-slate-900 tabular-nums">
                  {stats.count}
                </span>
              </div>
              {onOpenOwnerMeter && (
                <button
                  type="button"
                  onClick={onOpenOwnerMeter}
                  className="col-span-3 sm:col-span-1 mt-1 inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D0F12] hover:bg-[#1E232B] text-[#F5B800] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Full Quota &amp; API Meter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
