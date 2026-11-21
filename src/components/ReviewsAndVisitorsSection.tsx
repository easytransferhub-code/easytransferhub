import React, { useEffect, useMemo, useState } from 'react';
import { Star, ThumbsUp, Send, CheckCircle2, Users, MessageSquare, Compass, Gauge } from 'lucide-react';
import type { ClientReview } from '../../api/reviews';
import { TrustpilotWidget } from './TrustpilotWidget';

const LOCAL_REVIEWS_KEY = 'eth_client_reviews_v1';
const LOCAL_VISITS_KEY = 'eth_total_visits_v1';
const SESSION_VISIT_KEY = 'eth_session_counted_v1';
const HELPFUL_VOTED_KEY = 'eth_helpful_voted_v1';

const ROUTE_OPTIONS = [
  'Barcelona Airport (BCN) ↔ City Center',
  'Barcelona Airport (BCN) ↔ Cruise Port',
  'Barcelona Airport (BCN) ↔ Sants Station',
  'Barcelona ↔ Sitges',
  'Barcelona ↔ Montserrat',
  'Barcelona ↔ Girona / Costa Brava',
  'Barcelona ↔ Andorra',
  'Other Spain / Custom Transfer',
];

const RATING_LABELS: Record<number, string> = {
  5: '5 / 5 · Exceptional Service',
  4: '4 / 5 · Very Good Ride',
  3: '3 / 5 · Satisfactory',
  2: '2 / 5 · Needs Improvement',
  1: '1 / 5 · Poor Experience',
};

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface ReviewsAndVisitorsSectionProps {
  onOpenOwnerMeter?: () => void;
}

export const ReviewsAndVisitorsSection: React.FC<ReviewsAndVisitorsSectionProps> = ({ onOpenOwnerMeter }) => {
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [todayVisits, setTodayVisits] = useState<number>(0);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | 'other'>('all');

  // Review Form State
  const [name, setName] = useState('');
  const [route, setRoute] = useState(ROUTE_OPTIONS[0]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  useEffect(() => {
    let localReviews: ClientReview[] = [];
    let localVisits = 0;
    try {
      const savedReviews = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (savedReviews) localReviews = JSON.parse(savedReviews);
      const savedVisits = Number(localStorage.getItem(LOCAL_VISITS_KEY) || 0);
      if (Number.isFinite(savedVisits)) localVisits = savedVisits;
      const savedVotes = localStorage.getItem(HELPFUL_VOTED_KEY);
      if (savedVotes) setVotedIds(JSON.parse(savedVotes));
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
      return {
        avg: 0,
        count: 0,
        breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, pct: 0 })),
      };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const starCount = reviews.filter((r) => r.rating === star).length;
      return { star, count: starCount, pct: Math.round((starCount / count) * 100) };
    });
    return { avg, count, breakdown };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (ratingFilter === '5') return reviews.filter((r) => r.rating === 5);
    if (ratingFilter === '4') return reviews.filter((r) => r.rating === 4);
    if (ratingFilter === 'other') return reviews.filter((r) => r.rating <= 3);
    return reviews;
  }, [reviews, ratingFilter]);

  // Gauge arc fill percentage for visitor meter (scales smoothly across milestones)
  const meterRatio = useMemo(() => {
    if (totalVisits <= 0) return 0.08;
    const nextMilestone = totalVisits < 100 ? 100 : totalVisits < 1000 ? 1000 : 10000;
    return Math.min(1, Math.max(0.12, totalVisits / nextMilestone));
  }, [totalVisits]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanComment = comment.trim();

    if (cleanName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (cleanComment.length < 5) {
      setFormError('Please write a brief review or comment (minimum 5 characters).');
      return;
    }

    setFormError('');
    setSubmitting(true);

    let createdReview: ClientReview = {
      id: `rev-${Date.now().toString(36)}`,
      name: cleanName,
      route,
      rating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          name: cleanName,
          route,
          rating,
          comment: cleanComment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 429) {
        setFormError(data.error || 'Unable to submit review right now.');
        setSubmitting(false);
        return;
      }
      if (res.ok && data.review) {
        createdReview = data.review;
      }
    } catch {
      // keep local submission when offline
    }

    const updated = mergeReviews([createdReview], reviews);
    setReviews(updated);
    try {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setName('');
    setComment('');
    setRating(5);
    setSubmitting(false);
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 4500);
  };

  const handleHelpful = async (reviewId: string) => {
    if (votedIds.includes(reviewId)) return;

    const nextVoted = [...votedIds, reviewId];
    setVotedIds(nextVoted);
    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
    );
    setReviews(updated);

    try {
      localStorage.setItem(HELPFUL_VOTED_KEY, JSON.stringify(nextVoted));
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'helpful', reviewId }),
      });
    } catch {
      // non-fatal
    }
  };

  const activeStarPreview = hoverRating || rating;
  const arcLength = 157; // Half-circle length for r=50 (PI * 50)
  const strokeOffset = arcLength * (1 - meterRatio);

  return (
    <section
      id="reviews"
      className="py-16 bg-white text-slate-900 border-b border-[#E6DFCB]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
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
              Track real visitor activity on Easytransferhub and read or share honest passenger reviews about your Barcelona private transfer experience.
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
                  <span>{stats.count > 0 ? stats.avg.toFixed(1) : '—'}</span>
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

        {/* Main 12-Col Grid: Review Composer + Reviews Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Post a Review & Comment */}
          <div className="lg:col-span-5 bg-white border border-[#E3D6AD] rounded-2xl p-6 shadow-xs">
            <div className="mb-5 pb-4 border-b border-[#F0E9D4]">
              <h3 className="font-display font-extrabold text-lg text-[#0D0F12]">
                Leave a Review &amp; Comment
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Traveled with Mr. Mir? Share your feedback for future Barcelona passengers.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Interactive Star Rating Selector */}
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Rating
                </span>
                <div className="flex items-center justify-between gap-2 bg-[#FCFBF7] border border-[#E6DFCB] rounded-xl px-3.5 py-2">
                  <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 rounded-lg hover:bg-white transition-transform active:scale-95 cursor-pointer"
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-checked={rating === star}
                        role="radio"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            star <= activeStarPreview
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#704B00] whitespace-nowrap">
                    {RATING_LABELS[activeStarPreview]}
                  </span>
                </div>
              </div>

              {/* Passenger Name */}
              <div>
                <label htmlFor="review-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Your Name *
                </label>
                <input
                  id="review-name"
                  type="text"
                  maxLength={70}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FCFBF7] focus:bg-white border border-[#E6DFCB] focus:border-[#9A6B00] rounded-xl outline-none transition-colors"
                />
              </div>

              {/* Route Taken */}
              <div>
                <label htmlFor="review-route" className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Route
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-[#8A5D00] absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    id="review-route"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FCFBF7] focus:bg-white border border-[#E6DFCB] focus:border-[#9A6B00] rounded-xl outline-none transition-colors cursor-pointer"
                  >
                    {ROUTE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comment / Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="review-comment" className="text-xs font-bold text-slate-700">
                    Your Comment *
                  </label>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Tell others about pickup punctuality, vehicle cleanliness, or chauffeur communication..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FCFBF7] focus:bg-white border border-[#E6DFCB] focus:border-[#9A6B00] rounded-xl outline-none transition-colors resize-none"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700"
                >
                  {formError}
                </div>
              )}

              {submittedNotice && (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#FBF7E6] border border-[#D99F00] text-xs font-bold text-[#0D0F12] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8A5D00] shrink-0" />
                  <span>Thank you! Your review &amp; comment has been published.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] border border-[#D99F00] text-slate-950 font-extrabold text-sm shadow-[0_6px_18px_-4px_rgba(245,184,0,0.55)] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Post Review & Comment'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Rating Distribution + Reviews & Comments List */}
          <div className="lg:col-span-7 space-y-5">
            {/* Rating Breakdown & Filter Controls */}
            <div className="bg-[#FCFBF7] border border-[#E3D6AD] rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-4 text-center sm:text-left sm:border-r sm:border-[#EFE7D1] sm:pr-5">
                  <div className="font-display font-extrabold text-4xl text-[#0D0F12] tabular-nums">
                    {stats.count > 0 ? stats.avg.toFixed(1) : '0.0'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(stats.avg)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-600 tabular-nums">
                    Based on {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                <div className="sm:col-span-8 space-y-1.5">
                  {stats.breakdown.map((row) => (
                    <div key={row.star} className="flex items-center gap-2.5 text-xs">
                      <span className="w-7 font-bold text-slate-700 tabular-nums shrink-0">
                        {row.star}★
                      </span>
                      <div className="flex-1 h-2 bg-white border border-[#EFE7D1] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D99F00] rounded-full transition-all duration-300"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-slate-500 tabular-nums shrink-0">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Segmented Filter Tabs */}
              <div className="pt-3 border-t border-[#EFE7D1] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Filter Comments</span>
                <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#E6DFCB] rounded-lg">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: '5', label: '5 Stars' },
                      { id: '4', label: '4 Stars' },
                      { id: 'other', label: '1–3 Stars' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRatingFilter(tab.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        ratingFilter === tab.id
                          ? 'bg-[#F5B800] text-slate-950 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-[#FCFBF7]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments & Reviews Feed */}
            {filteredReviews.length === 0 ? (
              <div className="bg-white border border-[#E6DFCB] rounded-2xl p-8 text-center space-y-2">
                <div className="w-11 h-11 rounded-xl bg-[#FCFBF7] border border-[#E6DFCB] text-[#8A5D00] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  {reviews.length === 0
                    ? 'Be the first traveler to leave a review'
                    : 'No reviews match this rating filter'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {reviews.length === 0
                    ? 'Use the form on the left to rate your transfer and post a comment. Your review appears immediately.'
                    : 'Try selecting All to view every client comment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredReviews.map((rev) => {
                  const hasVoted = votedIds.includes(rev.id);
                  return (
                    <article
                      key={rev.id}
                      className="bg-white border border-[#E6DFCB] rounded-2xl p-5 space-y-3 transition-colors hover:border-[#D99F00]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#FBF7E6] border border-[#E3D6AD] text-[#0D0F12] font-display font-extrabold text-sm flex items-center justify-center shrink-0">
                            {getInitials(rev.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                              {rev.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                              <span className="truncate">{rev.route}</span>
                              <span aria-hidden="true">·</span>
                              <span className="shrink-0">{formatReviewDate(rev.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-0.5 shrink-0 pt-0.5"
                          aria-label={`${rev.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">
                        {rev.comment}
                      </p>

                      <div className="pt-2 border-t border-[#F7F3E6] flex items-center justify-between text-xs text-slate-500">
                        <span>Verified Traveler Feedback</span>
                        <button
                          type="button"
                          onClick={() => void handleHelpful(rev.id)}
                          disabled={hasVoted}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            hasVoted
                              ? 'bg-[#FBF7E6] border-[#DFC670] text-[#704B00] cursor-default'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-[#E3D6AD] hover:text-[#0D0F12]'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful</span>
                          <span className="tabular-nums">({rev.helpfulCount || 0})</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
