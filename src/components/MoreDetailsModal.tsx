import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Calculator,
  Car,
  Users,
  HelpCircle,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';
import { WhyChooseUs } from './WhyChooseUs';

export type MoreDetailsTab = 'menu' | 'why';

interface MoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: MoreDetailsTab;
  onOpenAssistant: () => void;
  onOpenOwnerMeter: () => void;
}

export const MoreDetailsModal: React.FC<MoreDetailsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'menu',
  onOpenAssistant,
}) => {
  const [activeTab, setActiveTab] = useState<MoreDetailsTab>(initialTab);

  if (!isOpen) return null;

  const scrollToSection = (href: string) => {
    onClose();
    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = href;
      }
    }, 60);
  };

  const quickNavItems = [
    { label: 'Fare Calculator', desc: 'Instant pickup & drop-off price quote', href: '#calculator', icon: Calculator },
    { label: 'Vehicle Fleet', desc: '12 Official AMB / IMET Yellow-Black Taxis', href: '#fleet', icon: Car },
    { label: 'Visitors & Reviews', desc: 'Live passenger feedback & ratings', href: '#reviews', icon: Users },
    { label: 'FAQ & Flight Delays', desc: 'Answers about delays, child seats & luggage', href: '#faq', icon: HelpCircle },
    { label: 'Direct Contact', desc: 'Reach Mr. Mir directly 24/7', href: '#contact', icon: Phone },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6">
      <div className="max-w-5xl mx-auto bg-[#FAF9F6] border border-[#E3D6AD] rounded-3xl shadow-2xl overflow-hidden my-2 text-slate-900">
        {/* Top Modal Header */}
        <div className="bg-[#0D0F12] text-white px-4 sm:px-6 py-4 border-b border-[#F5B800]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B800] text-[#0D0F12] flex items-center justify-center font-display font-bold text-sm shrink-0">
              ET
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                EasyTransferHub · Menu &amp; Full Details
              </h2>
              <p className="text-[11px] text-neutral-400">
                Zone Rates, Guarantees, Navigation &amp; Direct Support
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details menu"
            className="p-2 rounded-xl bg-[#1A1D24] hover:bg-red-500/20 hover:text-red-400 border border-neutral-700 text-neutral-300 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Headings / Tabs Bar */}
        <div className="bg-[#F4EFE0] border-b border-[#E3D6AD] px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#0D0F12] text-[#F5B800] shadow-xs'
                : 'bg-white text-slate-700 border border-[#E3D6AD] hover:border-[#F5B800]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Menu &amp; Quick Headings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('why')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'why'
                ? 'bg-[#0D0F12] text-[#F5B800] shadow-xs'
                : 'bg-white text-slate-700 border border-[#E3D6AD] hover:border-[#F5B800]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Why Choose Us</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6">
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Highlighted Detail Section */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-2">
                  Service Guarantees
                </span>
                <div className="grid grid-cols-1 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('why')}
                    className="text-left p-4 rounded-2xl bg-white border border-[#E3D6AD] hover:border-[#F5B800] shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FBF7E6] border border-[#DFC670] text-[#704B00] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900">
                          Why Travelers Choose EasyTransferHub
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Flight radar tracking, 60-min free wait, fixed tolls, Meet &amp; Greet &amp; 24/7 dispatch.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8A5D00] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>
              </div>

              {/* Quick Page Navigation Headings */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-2">
                  Page Navigation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {quickNavItems.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => scrollToSection(item.href)}
                        className="text-left p-3 rounded-xl bg-white border border-[#E6DFCB] hover:border-[#F5B800] transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FBF7E6] text-[#8A5D00] flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500 truncate">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Support Heading */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-2">
                  Direct Assistance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                      'Hello Easytransferhub, I would like to book a transfer in Barcelona.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white font-bold text-xs flex items-center gap-2.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-white shrink-0" />
                    <div>
                      <div className="leading-tight">WhatsApp Mr. Mir</div>
                      <div className="text-[10px] opacity-90 font-normal">Instant 24/7 Chat</div>
                    </div>
                  </a>

                  <a
                    href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                    className="p-3 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-[#0D0F12] font-bold text-xs flex items-center gap-2.5 shadow-xs transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#0D0F12] shrink-0" />
                    <div>
                      <div className="leading-tight">Call Direct</div>
                      <div className="text-[10px] font-semibold">{BUSINESS_INFO.phoneDisplay}</div>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssistant();
                    }}
                    className="p-3 rounded-xl bg-[#0D0F12] hover:bg-[#1B1F27] text-[#F5B800] font-bold text-xs flex items-center gap-2.5 shadow-xs transition-colors cursor-pointer text-left"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="leading-tight">24/7 AI Concierge</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Ask Price &amp; Route Help</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'why' && (
            <div className="space-y-3">
              <WhyChooseUs embedded />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
