import React, { useEffect } from 'react';
import { TrustpilotWidget } from './TrustpilotWidget';

const LOCAL_REVIEWS_KEY = 'eth_client_reviews_v1';
const LOCAL_VISITS_KEY = 'eth_total_visits_v1';
const SESSION_VISIT_KEY = 'eth_session_counted_v1';

interface ReviewsAndVisitorsSectionProps {
  onOpenOwnerMeter?: () => void;
}

export const ReviewsAndVisitorsSection: React.FC<ReviewsAndVisitorsSectionProps> = () => {
  useEffect(() => {
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
          try {
            if (typeof data.totalVisits === 'number') {
              localStorage.setItem(LOCAL_VISITS_KEY, String(data.totalVisits));
            }
            if (Array.isArray(data.reviews)) {
              localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(data.reviews));
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // silent fallback
      }
    };

    void syncCommunity();
  }, []);

  return (
    <section
      id="reviews"
      className="py-16 bg-white text-slate-900 border-b border-[#E6DFCB]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FCFBF7] border border-[#E3D6AD] rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A5D00] block">
              Traveler Feedback &amp; Site Reach
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight text-balance">
              Live Visitors Meter &amp; Client Reviews
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track real visitor activity on Easytransferhub and share verified feedback about your Barcelona private transfer experience on Trustpilot.
            </p>
            <div className="pt-2 max-w-lg">
              <div className="bg-white border border-[#E6DFCB] rounded-xl px-4 py-2.5 shadow-2xs">
                <TrustpilotWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

