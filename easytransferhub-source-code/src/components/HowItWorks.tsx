import { Calculator, MessageSquare, UserCheck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Calculate Your Trip & Fixed Price',
      desc: 'Enter your pickup point, destination, date and group size. Select your preferred vehicle (Standard Sedan, Comfort Executive, or 8-Seater Minivan).',
      icon: Calculator,
      color: 'bg-amber-100 text-amber-800',
    },
    {
      step: '02',
      title: 'Instant WhatsApp or Email Confirmation',
      desc: 'One tap sends your reservation directly to Mr. Mir on WhatsApp. We confirm your chauffeur, vehicle license plate, and pickup details within minutes.',
      icon: MessageSquare,
      color: 'bg-teal-100 text-teal-800',
    },
    {
      step: '03',
      title: 'Meet Your Driver With Name Sign',
      desc: 'Your chauffeur tracks your flight landing in real-time, waits in arrivals holding your personalized signboard, helps with your luggage, and drives you safely.',
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <section id="how" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e5c73] block mb-1">
            Simple & Transparent
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            How It Works in 3 Quick Steps
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            No lengthy account creation, no surge pricing, and no surprise extra charges at the end of your ride.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-display font-black text-3xl text-slate-300">
                    {s.step}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
