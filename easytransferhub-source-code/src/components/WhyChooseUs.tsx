import React from 'react';
import { Radar, Clock, ShieldCheck, Baby, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const perks = [
    {
      title: 'Real-Time Flight Radar Tracking',
      desc: 'We monitor your scheduled flight live. If your flight is delayed by 1 hour or 5 hours, your chauffeur will be synchronized with your new arrival time at zero extra fee.',
      icon: Radar,
    },
    {
      title: '60 Minutes Complimentary Waiting',
      desc: 'Passport control, baggage claim, or duty-free delays? We include a full 60 minutes of free waiting time from the moment your aircraft lands on the tarmac.',
      icon: Clock,
    },
    {
      title: 'Fixed All-Inclusive Fares',
      desc: 'All Catalan motorway tolls (C-32, AP-7), airport pickup access fees, and luggage assistance are 100% included. What you agree is strictly what you pay.',
      icon: ShieldCheck,
    },
    {
      title: 'Child, Baby & Booster Seats',
      desc: 'Traveling with kids? We supply certified European standard rear-facing baby seats and booster seats for maximum road safety during your holiday in Spain.',
      icon: Baby,
    },
    {
      title: 'Personalized Meet & Greet',
      desc: 'Your chauffeur waits at the arrival terminal with a legible greeting tablet showing your name or family name, guiding you smoothly to your vehicle.',
      icon: Sparkles,
    },
    {
      title: 'Personalized 24/7 Direct Service',
      desc: 'No automated bot call-centers. You communicate directly with business owner Mr. Mir and our dispatch team on WhatsApp for prompt, dependable assistance.',
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-16 bg-[#0e2438] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
            Service Excellence
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            Why Travelers Choose EasyTransferHub
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            The reliable alternative to crowded taxi queues and unreliable rideshare apps at Barcelona Airport.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-[#112331] border border-slate-700/80 rounded-2xl p-6 hover:border-slate-500 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
