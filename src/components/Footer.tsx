import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Heart } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#081622] text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <a href="#top" className="inline-block font-display font-extrabold text-xl text-white tracking-tight">
              Easytransfer<span className="text-amber-400">hub</span>
            </a>
            <p className="text-slate-400 text-xs leading-relaxed">
              Premium private transfers, airport pickups, and executive chauffeur services across Barcelona, Catalonia, Andorra, and Spain.
            </p>
            <div className="text-[11px] text-slate-500">
              Operated & managed by <b>{BUSINESS_INFO.owner}</b>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5">
              <li><a href="#calculator" className="hover:text-amber-400 transition-colors">Instant Calculator</a></li>
              <li><a href="#routes" className="hover:text-amber-400 transition-colors">Popular Fixed Routes</a></li>
              <li><a href="#fleet" className="hover:text-amber-400 transition-colors">Our Vehicle Fleet</a></li>
              <li><a href="#prices" className="hover:text-amber-400 transition-colors">Distance Pricing</a></li>
              <li><a href="#how" className="hover:text-amber-400 transition-colors">How It Works</a></li>
              <li><a href="#faq" className="hover:text-amber-400 transition-colors">FAQ & Flight Delays</a></li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Destinations</h4>
            <ul className="space-y-1.5">
              <li><span className="text-slate-300">Barcelona Airport (BCN T1 / T2)</span></li>
              <li><span className="text-slate-300">Cruise Port (Moll Adossat)</span></li>
              <li><span className="text-slate-300">Sitges & Garraf Coast</span></li>
              <li><span className="text-slate-300">Montserrat Monastery</span></li>
              <li><span className="text-slate-300">Girona & Costa Brava</span></li>
              <li><span className="text-slate-300">Andorra la Vella</span></li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Get In Touch</h4>
            <div className="space-y-2 text-xs">
              <a
                href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{BUSINESS_INFO.phoneDisplay}</span>
              </a>

              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Available 24/7</span>
              </a>

              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{BUSINESS_INFO.email}</span>
              </a>

              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{BUSINESS_INFO.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved. Registered Private Chauffeur & VTC Service Barcelona.
          </div>
          <div className="flex items-center gap-1">
            <span>Fixed Prices · Flight Delay Tracking · 60 Min Free Waiting</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
