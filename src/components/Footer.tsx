import React from 'react';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

interface FooterProps {
  onOpenOwnerMeter?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenOwnerMeter }) => {
  return (
    <footer id="eth-footer" className="bg-[#0D0F12] text-neutral-300 text-xs border-t-2 border-[#F5B800]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <a href="#top" className="inline-block font-display font-bold text-xl text-[#FAF9F6] tracking-tight">
              EasyTransfer<span className="text-[#F5B800]">Hub</span>
            </a>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Premium private transfers, airport pickups, and executive chauffeur services across Barcelona, Catalonia, Andorra, and Spain.
            </p>
            <div className="text-[11px] text-neutral-400">
              Operated &amp; managed by <b className="text-white">{BUSINESS_INFO.owner}</b>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5">
              <li><a href="#calculator" className="hover:text-[#F5B800] transition-colors">Instant Calculator</a></li>
              <li><a href="#fleet" className="hover:text-[#F5B800] transition-colors">Our Vehicle Fleet</a></li>
              <li><a href="#how" className="hover:text-[#F5B800] transition-colors">How It Works</a></li>
              <li><a href="#reviews" className="hover:text-[#F5B800] transition-colors">Visitors &amp; Reviews</a></li>
              <li><a href="#faq" className="hover:text-[#F5B800] transition-colors">FAQ &amp; Flight Delays</a></li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Popular Transfer Routes</h4>
            <ul className="space-y-1.5 text-neutral-400">
              <li>Barcelona Airport (BCN T1 / T2) Taxi &amp; Pickup</li>
              <li>Barcelona Cruise Port (Moll Adossat) Transfer</li>
              <li>Barcelona Sants Station &amp; City Center</li>
              <li>Barcelona to Sitges, Salou &amp; Tarragona</li>
              <li>Montserrat, Girona &amp; Costa Brava Transfers</li>
              <li>Barcelona to Andorra Private Minivan</li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Get In Touch</h4>
            <div className="space-y-2 text-xs">
              <a
                href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 text-neutral-200 hover:text-[#F5B800] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>{BUSINESS_INFO.phoneDisplay}</span>
              </a>

              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#F5B800] hover:text-white font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Available 24/7</span>
              </a>

              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="flex items-center gap-2 text-neutral-200 hover:text-[#F5B800] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>{BUSINESS_INFO.email}</span>
              </a>

              <div className="flex items-center gap-2 text-neutral-400">
                <MapPin className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>{BUSINESS_INFO.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved. Registered Private Chauffeur &amp; VTC Service Barcelona.
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <span>Fair Prices · Flight Delay Tracking · 60 Min Free Waiting</span>
            {onOpenOwnerMeter && (
              <button
                type="button"
                onClick={onOpenOwnerMeter}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#171A21] border border-[#F5B800]/60 text-[#F5B800] hover:bg-[#F5B800] hover:text-[#0D0F12] font-bold transition-colors cursor-pointer"
              >
                <span>Owner A-to-Z Quota Meter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
