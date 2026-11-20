import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  ExternalLink,
  GitBranch,
  Globe,
  HardDrive,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { TelemetryStore } from '../../api/telemetry';
import {
  fetchQuotaSnapshot,
  resetMonthlyMeter,
  updateQuotaSettings,
} from '../utils/telemetryClient';

interface OwnerQuotaMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailDiagnosticStatus {
  ok: boolean;
  ready: boolean;
  provider: string | null;
  resendConfigured: boolean;
  smtpConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUserMasked: string;
  ownerEmailMasked: string;
  issueHint: string;
}

interface EmailTestResult {
  loading: boolean;
  bookingRef?: string;
  emailSent?: boolean;
  ownerEmailSent?: boolean;
  emailProvider?: string | null;
  emailError?: string;
  httpError?: string;
}

function getDaysLeftInMonth(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.max(1, lastDay - now.getUTCDate() + 1);
}

function getDaysUntilDate(isoDate: string): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatMonthName(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

interface AnalogGaugeProps {
  title: string;
  subtitle: string;
  used: number;
  limit: number;
  unitLabel: string;
  accentLabel: string;
  footerItems: { label: string; value: string | number; highlight?: boolean }[];
}

const AnalogTaximeterGauge: React.FC<AnalogGaugeProps> = ({
  title,
  subtitle,
  used,
  limit,
  unitLabel,
  accentLabel,
  footerItems,
}) => {
  const safeLimit = Math.max(1, limit);
  const ratio = Math.min(1, Math.max(0, used / safeLimit));
  const percent = Math.round(ratio * 1000) / 10;
  const remaining = Math.max(0, safeLimit - used);
  const needleAngle = -90 + ratio * 180;

  const statusColor =
    ratio >= 0.85
      ? '#EF4444'
      : ratio >= 0.6
      ? '#F59E0B'
      : '#22C55E';

  const statusBadge =
    ratio >= 0.85
      ? 'HIGH USAGE'
      : ratio >= 0.6
      ? 'MODERATE'
      : 'HEALTHY FREE';

  // Semi-circle arc radius 70, circumference half = pi * 70 ≈ 219.91
  const halfCirc = Math.PI * 70;
  const dashOffset = halfCirc * (1 - ratio);

  return (
    <div className="bg-[#14171C] border border-[#2A2F38] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5B800] block">
            {subtitle}
          </span>
          <h3 className="text-sm sm:text-base font-display font-bold text-white mt-0.5">
            {title}
          </h3>
        </div>
        <span
          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0"
          style={{
            color: statusColor,
            borderColor: `${statusColor}55`,
            backgroundColor: `${statusColor}18`,
          }}
        >
          {statusBadge}
        </span>
      </div>

      {/* Semi-Circular Analog + Digital Taximeter Dial */}
      <div className="relative flex flex-col items-center my-2">
        <svg viewBox="0 0 180 105" className="w-48 sm:w-52 h-auto overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 20 92 A 70 70 0 0 1 160 92"
            fill="none"
            stroke="#262B34"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress Colored Arc */}
          <path
            d="M 20 92 A 70 70 0 0 1 160 92"
            fill="none"
            stroke={statusColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={halfCirc}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
            const ang = (-180 + t * 180) * (Math.PI / 180);
            const x1 = 90 + Math.cos(ang) * 56;
            const y1 = 92 + Math.sin(ang) * 56;
            const x2 = 90 + Math.cos(ang) * 62;
            const y2 = 92 + Math.sin(ang) * 62;
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748B"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Analog Needle */}
          <g transform={`translate(90, 92) rotate(${needleAngle})`}>
            <polygon points="-2.5,0 0,-60 2.5,0" fill="#F5B800" />
            <circle cx="0" cy="0" r="6" fill="#F5B800" stroke="#0D0F12" strokeWidth="2" />
          </g>

          <text x="16" y="104" fill="#94A3B8" fontSize="8" fontWeight="700">
            0%
          </text>
          <text x="82" y="14" fill="#94A3B8" fontSize="8" fontWeight="700">
            50%
          </text>
          <text x="148" y="104" fill="#94A3B8" fontSize="8" fontWeight="700">
            100%
          </text>
        </svg>

        {/* Digital LED Readout Box */}
        <div className="w-full mt-1 bg-[#090B0E] border border-[#2B313B] rounded-xl px-3 py-2.5 grid grid-cols-2 gap-2 text-center">
          <div className="border-r border-[#222730] pr-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              Used ({percent}%)
            </span>
            <span className="text-lg sm:text-xl font-mono font-extrabold text-[#F5B800] tabular-nums">
              {used.toLocaleString()}
            </span>
          </div>
          <div className="pl-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              {accentLabel}
            </span>
            <span
              className="text-lg sm:text-xl font-mono font-extrabold tabular-nums"
              style={{ color: statusColor }}
            >
              {remaining.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5 font-medium tabular-nums">
          Monthly Limit: <b className="text-white">{safeLimit.toLocaleString()}</b> {unitLabel}
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="mt-2 pt-2.5 border-t border-[#262B34] space-y-1.5 text-xs">
        {footerItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-slate-400">{item.label}</span>
            <span
              className={`font-bold tabular-nums ${
                item.highlight ? 'text-[#22C55E]' : 'text-slate-200'
              }`}
            >
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OwnerQuotaMeterModal: React.FC<OwnerQuotaMeterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [store, setStore] = useState<TelemetryStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [placesLimitInput, setPlacesLimitInput] = useState('5000');
  const [routesLimitInput, setRoutesLimitInput] = useState('10000');
  const [vercelApiLimitInput, setVercelApiLimitInput] = useState('100000');
  const [vercelGbLimitInput, setVercelGbLimitInput] = useState('100');
  const [vercelGbUsedInput, setVercelGbUsedInput] = useState('0');
  const [githubMinsUsedInput, setGithubMinsUsedInput] = useState('0');
  const [gscClicksInput, setGscClicksInput] = useState('0');
  const [domainRenewalInput, setDomainRenewalInput] = useState('2027-01-15');
  const [emailDiag, setEmailDiag] = useState<EmailDiagnosticStatus | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<EmailTestResult>({ loading: false });

  const fetchEmailDiag = async () => {
    try {
      const res = await fetch('/api/booking-confirm', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as EmailDiagnosticStatus;
        setEmailDiag(data);
      }
    } catch {
      // ignore background diagnostics fetch failure
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [snap] = await Promise.all([fetchQuotaSnapshot(), fetchEmailDiag()]);
    setStore(snap);
    setPlacesLimitInput(String(snap.limits.placesMonthlyLimit));
    setRoutesLimitInput(String(snap.limits.routesMonthlyLimit));
    setVercelApiLimitInput(String(snap.limits.vercelApiMonthlyLimit));
    setVercelGbLimitInput(String(snap.limits.vercelBandwidthGbLimit));
    setVercelGbUsedInput(String(snap.manualUsage.vercelBandwidthGbUsed));
    setGithubMinsUsedInput(String(snap.manualUsage.githubActionsMinutesUsed));
    setGscClicksInput(String(snap.manualUsage.gscMonthlyClicks));
    setDomainRenewalInput(snap.limits.domainRenewalDate || '2027-01-15');
    setLoading(false);
  };

  const handleSendTestEmail = async () => {
    setEmailTestResult({ loading: true });
    try {
      const res = await fetch('/api/booking-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: 'Barcelona Airport (BCN) Terminal 1',
          dropoff: 'Sagrada Familia, Barcelona',
          dateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          passengers: 2,
          adults: 2,
          children: 0,
          luggage: 2,
          childSeats: 0,
          vehicleName: 'Standard Sedan',
          quotedPrice: 50,
          passengerName: 'Mr. Mir (Live Email Test)',
          email: 'easytransferhub@gmail.com',
          phone: '+34 666 744 440',
          paymentMethod: 'Diagnostic Test',
          driverNotes: 'Automated test triggered from #owner-meter',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailTestResult({
          loading: false,
          httpError: data?.error || `Server returned HTTP ${res.status}`,
        });
      } else {
        setEmailTestResult({
          loading: false,
          bookingRef: data.bookingRef,
          emailSent: Boolean(data.emailSent),
          ownerEmailSent: Boolean(data.ownerEmailSent),
          emailProvider: data.emailProvider || null,
          emailError: data.emailError,
        });
        void fetchEmailDiag();
      }
    } catch (err) {
      setEmailTestResult({
        loading: false,
        httpError: err instanceof Error ? err.message : 'Network error reaching /api/booking-confirm',
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadData();
    const timer = window.setInterval(() => {
      void fetchQuotaSnapshot().then(setStore);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const daysLeft = getDaysLeftInMonth();
  const domainDaysLeft = store ? getDaysUntilDate(store.limits.domainRenewalDate) : null;

  // Google Maps Places API combined calls
  const placesUsed = store ? store.placesSearchCalls + store.placesDetailCalls : 0;
  const placesLimit = store?.limits.placesMonthlyLimit || 5000;

  // Visitors target meter (shows SEO + Direct traffic cleanly on gauge out of 5,000 benchmark or adjustable)
  const totalVisits = store?.totalVisitsMonthly || 0;
  const seoVisits = store?.seoGoogleVisitsMonthly || 0;
  const directVisits = store?.directOtherVisitsMonthly || 0;

  // Hosting API calls meter
  const vercelApiUsed = store?.vercelApiCallsMonthly || 0;
  const vercelApiLimit = store?.limits.vercelApiMonthlyLimit || 100000;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await updateQuotaSettings(
      {
        placesMonthlyLimit: Math.max(100, Number(placesLimitInput) || 5000),
        routesMonthlyLimit: Math.max(100, Number(routesLimitInput) || 10000),
        vercelApiMonthlyLimit: Math.max(1000, Number(vercelApiLimitInput) || 100000),
        vercelBandwidthGbLimit: Math.max(1, Number(vercelGbLimitInput) || 100),
        domainRenewalDate: domainRenewalInput || '2027-01-15',
      },
      {
        vercelBandwidthGbUsed: Math.max(0, Number(vercelGbUsedInput) || 0),
        githubActionsMinutesUsed: Math.max(0, Number(githubMinsUsedInput) || 0),
        gscMonthlyClicks: Math.max(0, Number(gscClicksInput) || 0),
      }
    );
    setStore(updated);
    setSaving(false);
    setShowEditor(false);
  };

  const handleReset = async () => {
    const fresh = await resetMonthlyMeter();
    setStore(fresh);
  };

  const stackServices = [
    {
      name: 'Google Maps & Places API Key',
      role: 'Address Autocomplete, Map & Route Km',
      icon: MapPin,
      renewalType: 'RENEWS MONTHLY (1st)',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      usedText: `${placesUsed.toLocaleString()} Places + ${(store?.routesApiCalls || 0).toLocaleString()} Routes`,
      freeLimitText: `${placesLimit.toLocaleString()} Places / ${ (store?.limits.routesMonthlyLimit || 10000).toLocaleString() } Routes Free/mo`,
      remainingText: `${Math.max(0, placesLimit - placesUsed).toLocaleString()} Places Left`,
      progressPct: Math.min(100, (placesUsed / Math.max(1, placesLimit)) * 100),
      autoNote: `Auto-tracked live (+${(store?.freeFallbackSaves || 0).toLocaleString()} free fallback saves at €0)`,
      portalUrl: 'https://console.cloud.google.com/google/maps-apis/quotas',
      portalLabel: 'Google Cloud Quotas',
    },
    {
      name: 'Google Search Console (SEO)',
      role: 'Google Search Indexing, Keywords & Clicks',
      icon: Search,
      renewalType: '100% FREE FOREVER',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      usedText: `${seoVisits.toLocaleString()} Google SEO visits tracked (${(store?.manualUsage.gscMonthlyClicks || 0).toLocaleString()} GSC synced)`,
      freeLimitText: 'Unlimited Search Clicks · ~2,000 URL Inspections/day',
      remainingText: 'Unlimited Free',
      progressPct: Math.min(100, (seoVisits / 1000) * 100),
      autoNote: 'SEO traffic auto-detected when visitors arrive from Google Search',
      portalUrl: 'https://search.google.com/search-console',
      portalLabel: 'Open Search Console',
    },
    {
      name: 'Google Business Profile',
      role: 'Maps Pin, Reviews, Logo & Taxi Photos',
      icon: Globe,
      renewalType: '100% FREE FOREVER',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      usedText: 'Verified Blue Tick Live on Google',
      freeLimitText: 'Unlimited Profile Views, Calls, Photos & Posts',
      remainingText: 'Unlimited Free',
      progressPct: 10,
      autoNote: '0 monthly fee — free permanent local SEO visibility',
      portalUrl: 'https://business.google.com/locations',
      portalLabel: 'Open Business Profile',
    },
    {
      name: 'Vercel Hosting (Hobby Free Plan)',
      role: 'Website Hosting, SSL & /api/* Serverless',
      icon: Cloud,
      renewalType: 'RENEWS MONTHLY (Billing Cycle)',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      usedText: `${vercelApiUsed.toLocaleString()} API Calls · ${store?.manualUsage.vercelBandwidthGbUsed || 0} GB Bandwidth`,
      freeLimitText: `${vercelApiLimit.toLocaleString()} API Calls · ${store?.limits.vercelBandwidthGbLimit || 100} GB/mo · 1M Edge Req`,
      remainingText: `${Math.max(0, vercelApiLimit - vercelApiUsed).toLocaleString()} API Calls Left`,
      progressPct: Math.min(100, (vercelApiUsed / Math.max(1, vercelApiLimit)) * 100),
      autoNote: 'API calls tracked on site; sync exact Bandwidth GB from Vercel dashboard',
      portalUrl: 'https://vercel.com/dashboard',
      portalLabel: 'Open Vercel Usage',
    },
    {
      name: 'GitHub (Source Code & Auto-Deploy)',
      role: 'Code Repository, Backups & Vercel Trigger',
      icon: GitBranch,
      renewalType: 'REPOS FREE · ACTIONS RENEW MONTHLY',
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
      usedText: `${store?.manualUsage.githubActionsMinutesUsed || 0} Build Minutes used`,
      freeLimitText: `Unlimited Repos Free · ${store?.limits.githubActionsMinutesLimit || 2000} Actions min/mo`,
      remainingText: `${Math.max(0, (store?.limits.githubActionsMinutesLimit || 2000) - (store?.manualUsage.githubActionsMinutesUsed || 0)).toLocaleString()} Mins Left`,
      progressPct: Math.min(
        100,
        ((store?.manualUsage.githubActionsMinutesUsed || 0) /
          Math.max(1, store?.limits.githubActionsMinutesLimit || 2000)) *
          100
      ),
      autoNote: 'Static pushes via Vercel hobby use 0 GitHub Action minutes',
      portalUrl: 'https://github.com/settings/billing',
      portalLabel: 'Open GitHub Billing',
    },
    {
      name: 'Spaceship (Domain & DNS)',
      role: 'www.easytransferhub.com & DNS Routing',
      icon: HardDrive,
      renewalType: 'DNS FREE · DOMAIN RENEWS YEARLY',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      usedText: 'DNS Records & Forwarding: €0 / Unlimited',
      freeLimitText: `Annual Domain Renewal Date: ${store?.limits.domainRenewalDate || 'Set Date'}`,
      remainingText:
        domainDaysLeft !== null
          ? domainDaysLeft > 0
            ? `${domainDaysLeft} Days Left`
            : 'Renewal Due!'
          : 'Yearly',
      progressPct: domainDaysLeft !== null ? Math.min(100, Math.max(5, ((365 - domainDaysLeft) / 365) * 100)) : 20,
      autoNote: 'Only annual domain fee on Spaceship; DNS queries & SSL are 100% free',
      portalUrl: 'https://www.spaceship.com/application/domain-list-application/',
      portalLabel: 'Open Spaceship',
    },
    {
      name: 'Gemini AI Concierge (/api/chat)',
      role: '24/7 Multilingual Customer Chat Assistant',
      icon: Sparkles,
      renewalType: 'RENEWS DAILY / MONTHLY FREE TIER',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      usedText: `${store?.aiChatCallsToday || 0} Today (${store?.aiChatCallsMonthly || 0} this month)`,
      freeLimitText: `${(store?.limits.geminiDailyLimit || 1500).toLocaleString()} Free Req/day + Offline Rule Fallback`,
      remainingText: `${Math.max(0, (store?.limits.geminiDailyLimit || 1500) - (store?.aiChatCallsToday || 0)).toLocaleString()} Left Today`,
      progressPct: Math.min(
        100,
        ((store?.aiChatCallsToday || 0) / Math.max(1, store?.limits.geminiDailyLimit || 1500)) * 100
      ),
      autoNote: 'Auto-switches to smart fixed-rate fallback if free AI limit finishes',
      portalUrl: 'https://aistudio.google.com/',
      portalLabel: 'Google AI Studio',
    },
    {
      name: 'Gmail Booking Emails & WhatsApp',
      role: 'Instant Client Vouchers & Driver Alerts',
      icon: Mail,
      renewalType: 'GMAIL RENEWS DAILY · WA.ME UNLIMITED',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      usedText: `${store?.bookingEmailsToday || 0} Emails Today (${store?.bookingEmailsMonthly || 0}/mo)`,
      freeLimitText: `Gmail: ${store?.limits.gmailDailyLimit || 500}/day Free · wa.me WhatsApp: Unlimited Free`,
      remainingText: `${Math.max(0, (store?.limits.gmailDailyLimit || 500) - (store?.bookingEmailsToday || 0)).toLocaleString()} Emails Left Today`,
      progressPct: Math.min(
        100,
        ((store?.bookingEmailsToday || 0) / Math.max(1, store?.limits.gmailDailyLimit || 500)) * 100
      ),
      autoNote: 'Direct WhatsApp booking button costs €0 forever with no monthly limit',
      portalUrl: 'https://myaccount.google.com/',
      portalLabel: 'Google Account',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto bg-[#0D0F12] border border-[#2A2F38] rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-2">
        {/* Top Taximeter Header Bar */}
        <div className="bg-[#14171C] border-b border-[#2A2F38] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B800] text-[#0D0F12] flex items-center justify-center font-extrabold shadow-md shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-lg sm:text-xl text-white">
                  EasyTransferHub · Owner Quota &amp; Visitor Meter
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40 px-2 py-0.5 rounded-full">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[#F5B800] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {store ? formatMonthName(store.monthKey) : 'Current Month'} · Auto-Resets on 1st ({daysLeft} days left)
                </span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span className="text-slate-400">
                  Direct Access: <code className="text-slate-200 bg-[#0D0F12] px-1.5 py-0.5 rounded">/#owner-meter</code>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-[#1D222B] hover:bg-[#272D38] border border-[#303642] text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEditor((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                showEditor
                  ? 'bg-[#F5B800] text-[#0D0F12] border-[#F5B800]'
                  : 'bg-[#1D222B] hover:bg-[#272D38] border-[#303642] text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Set Limits</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Owner Meter"
              className="p-2 rounded-xl bg-[#1D222B] hover:bg-red-500/20 hover:text-red-400 border border-[#303642] text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editable Monthly Limits & Baseline Sync Drawer */}
        {showEditor && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-[#111419] border-b border-[#2A2F38] px-4 sm:px-6 py-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-[#F5B800]">
                  Customize Monthly Free Limits &amp; Sync Official Counts
                </h4>
                <p className="text-[11px] text-slate-400">
                  Adjust your Google Maps free cap (e.g., 5,000 or 10,000), sync Vercel GB / GSC clicks, or set Spaceship domain renewal date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleReset()}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Month Counter</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="block">
                <span className="text-slate-400 block mb-1">Maps Places Free Limit/mo</span>
                <input
                  type="number"
                  min={100}
                  value={placesLimitInput}
                  onChange={(e) => setPlacesLimitInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Routes API Free Limit/mo</span>
                <input
                  type="number"
                  min={100}
                  value={routesLimitInput}
                  onChange={(e) => setRoutesLimitInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Vercel API Limit/mo</span>
                <input
                  type="number"
                  min={1000}
                  value={vercelApiLimitInput}
                  onChange={(e) => setVercelApiLimitInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Vercel Bandwidth Limit (GB)</span>
                <input
                  type="number"
                  min={1}
                  value={vercelGbLimitInput}
                  onChange={(e) => setVercelGbLimitInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Vercel Used GB (Manual Sync)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={vercelGbUsedInput}
                  onChange={(e) => setVercelGbUsedInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">GitHub Actions Min Used</span>
                <input
                  type="number"
                  min={0}
                  value={githubMinsUsedInput}
                  onChange={(e) => setGithubMinsUsedInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Search Console Clicks (Sync)</span>
                <input
                  type="number"
                  min={0}
                  value={gscClicksInput}
                  onChange={(e) => setGscClicksInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
              <label className="block">
                <span className="text-slate-400 block mb-1">Spaceship Domain Renewal</span>
                <input
                  type="date"
                  value={domainRenewalInput}
                  onChange={(e) => setDomainRenewalInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090B0E] border border-[#2F3542] text-white"
                />
              </label>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1D222B] text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-[#F5B800] text-[#0D0F12] text-xs font-extrabold cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Meter Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Owner-Only Booking Email Health & 1-Click Live Test */}
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              emailDiag?.ready
                ? 'bg-emerald-950/25 border-emerald-500/35'
                : 'bg-amber-950/30 border-amber-500/45'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    emailDiag?.ready
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                      : 'bg-amber-500/15 border-amber-500/35 text-amber-400'
                  }`}
                >
                  {emailDiag?.ready ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-display font-bold text-white">
                      Booking Email Server Status
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        emailDiag?.ready
                          ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
                          : 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                      }`}
                    >
                      {emailDiag
                        ? emailDiag.ready
                          ? `READY (${emailDiag.provider?.toUpperCase()})`
                          : 'CREDENTIALS MISSING'
                        : 'CHECKING...'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {emailDiag?.issueHint || 'Checking booking email configuration...'}
                  </p>
                  {emailDiag && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                      <span>
                        Sender: <strong className="text-slate-200">{emailDiag.smtpUserMasked}</strong>
                      </span>
                      <span>
                        Owner Inbox: <strong className="text-slate-200">{emailDiag.ownerEmailMasked}</strong>
                      </span>
                      <span>
                        SMTP: <strong className="text-slate-200">{emailDiag.smtpHost}:{emailDiag.smtpPort}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={emailTestResult.loading}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5B800] hover:bg-[#eab308] disabled:opacity-60 text-[#0D0F12] text-xs font-extrabold transition-colors cursor-pointer shrink-0"
              >
                <Send className={`w-3.5 h-3.5 ${emailTestResult.loading ? 'animate-pulse' : ''}`} />
                <span>{emailTestResult.loading ? 'Sending Test...' : 'Send Test Booking Email'}</span>
              </button>
            </div>

            {(emailTestResult.bookingRef || emailTestResult.httpError) && (
              <div className="mt-3 pt-3 border-t border-white/10 text-xs flex flex-col gap-1">
                {emailTestResult.httpError ? (
                  <p className="text-red-300 font-semibold">Error: {emailTestResult.httpError}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-300">
                        Test Ref: <strong className="text-white">{emailTestResult.bookingRef}</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          emailTestResult.emailSent ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        Client Email: {emailTestResult.emailSent ? 'SENT' : 'FAILED'}
                      </span>
                      <span
                        className={`font-bold ${
                          emailTestResult.ownerEmailSent ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        Owner Email: {emailTestResult.ownerEmailSent ? 'SENT' : 'FAILED'}
                      </span>
                      {emailTestResult.emailProvider && (
                        <span className="text-slate-400">
                          Provider: <strong className="text-white">{emailTestResult.emailProvider}</strong>
                        </span>
                      )}
                    </div>
                    {emailTestResult.emailError && (
                      <p className="text-amber-300 font-medium">
                        Server Diagnostic: {emailTestResult.emailError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Row 1: 3 Analog + Digital Speedometer / Taximeter Dials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AnalogTaximeterGauge
              subtitle="API Key Monthly Meter"
              title="Google Maps & Places Searches"
              used={placesUsed}
              limit={placesLimit}
              unitLabel="API searches/mo"
              accentLabel="Free Calls Left"
              footerItems={[
                { label: 'Places Autocomplete Searches', value: store?.placesSearchCalls || 0 },
                { label: 'Places Address Details', value: store?.placesDetailCalls || 0 },
                { label: 'Routes / Distance API Calls', value: store?.routesApiCalls || 0 },
                { label: 'Interactive Map Loads', value: store?.mapsJsLoads || 0 },
                {
                  label: 'Free Offline Zone / Photon Saves (€0)',
                  value: store?.freeFallbackSaves || 0,
                  highlight: true,
                },
              ]}
            />

            <AnalogTaximeterGauge
              subtitle="Monthly Traffic & SEO"
              title="Website Visitors & Google Search"
              used={totalVisits}
              limit={5000}
              unitLabel="monthly benchmark"
              accentLabel="Capacity Left"
              footerItems={[
                {
                  label: 'Google Search (SEO) Visitors',
                  value: seoVisits,
                  highlight: true,
                },
                { label: 'Direct / WhatsApp / Link Visits', value: directVisits },
                { label: 'Today’s Visitors (24h)', value: store?.todayVisits || 0 },
                {
                  label: 'Synced Google Console Clicks',
                  value: store?.manualUsage.gscMonthlyClicks || 0,
                },
                { label: 'Cost to You for Unlimited SEO', value: '€0 Free', highlight: true },
              ]}
            />

            <AnalogTaximeterGauge
              subtitle="Serverless & AI Free Limits"
              title="Vercel API, Gemini AI & Emails"
              used={vercelApiUsed}
              limit={vercelApiLimit}
              unitLabel="Vercel API calls/mo"
              accentLabel="Free Calls Left"
              footerItems={[
                {
                  label: 'Gemini AI Chat Calls (Today)',
                  value: `${store?.aiChatCallsToday || 0} / ${store?.limits.geminiDailyLimit || 1500}`,
                },
                {
                  label: 'Booking Emails Sent (Today)',
                  value: `${store?.bookingEmailsToday || 0} / ${store?.limits.gmailDailyLimit || 500}`,
                },
                {
                  label: 'Booking Emails (This Month)',
                  value: store?.bookingEmailsMonthly || 0,
                },
                {
                  label: 'Vercel Bandwidth Synced',
                  value: `${store?.manualUsage.vercelBandwidthGbUsed || 0} / ${store?.limits.vercelBandwidthGbLimit || 100} GB`,
                },
                { label: 'WhatsApp Direct Clicks', value: 'Unlimited Free', highlight: true },
              ]}
            />
          </div>

          {/* Row 2: Complete A-to-Z Stack Cards */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-display font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#F5B800]" />
                  <span>Complete A-to-Z Stack: Free Forever vs Monthly / Yearly Renewals</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Har platform ki monthly free limit, bacha hua free quota, aur direct official link ek jagah.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-semibold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Auto-Charges with Fallback Protection
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stackServices.map((svc) => {
                const IconComp = svc.icon;
                return (
                  <div
                    key={svc.name}
                    className="bg-[#14171C] border border-[#262B34] hover:border-[#F5B800]/50 rounded-2xl p-4 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#1D222B] border border-[#2F3542] text-[#F5B800] flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white leading-tight">
                              {svc.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">{svc.role}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${svc.badgeColor}`}
                        >
                          {svc.renewalType}
                        </span>
                      </div>

                      <div className="bg-[#0B0D11] border border-[#222730] rounded-xl p-2.5 text-xs space-y-1.5 my-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Current Usage:</span>
                          <span className="font-bold text-white text-right tabular-nums">
                            {svc.usedText}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Free Limit:</span>
                          <span className="font-semibold text-slate-300 text-right tabular-nums">
                            {svc.freeLimitText}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Remaining Free:</span>
                          <span className="font-extrabold text-[#22C55E] text-right tabular-nums">
                            {svc.remainingText}
                          </span>
                        </div>

                        {/* Thin Progress Bar */}
                        <div className="w-full h-1.5 bg-[#1D222B] rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(3, svc.progressPct)}%`,
                              backgroundColor:
                                svc.progressPct >= 85
                                  ? '#EF4444'
                                  : svc.progressPct >= 60
                                  ? '#F59E0B'
                                  : '#22C55E',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#F5B800] shrink-0" />
                        <span>{svc.autoNote}</span>
                      </span>
                      <a
                        href={svc.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#F5B800] hover:underline shrink-0"
                      >
                        <span>{svc.portalLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Where to Access Guide */}
          <div className="bg-[#14171C] border border-[#F5B800]/35 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-[#F5B800] mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-white">
                  Where is this Owner Meter located? (Clients do NOT see this panel)
                </p>
                <p className="text-slate-400">
                  Bookmark <code className="text-[#F5B800]">https://www.easytransferhub.com/#owner-meter</code> or click the discreet <b>Owner Meter</b> link at the very bottom of your website footer anytime.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-[#0D0F12] font-extrabold text-xs shrink-0 cursor-pointer"
            >
              Back to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
