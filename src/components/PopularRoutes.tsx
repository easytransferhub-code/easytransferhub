import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { POPULAR_ROUTES, FixedRoute } from '../data/transferData';

interface PopularRoutesProps {
  onSelectRoute: (route: FixedRoute) => void;
}

export const PopularRoutes: React.FC<PopularRoutesProps> = ({ onSelectRoute }) => {
  return (
    <section id="routes" className="py-16 bg-[#FAF9F6] border-b border-[#E6DFCB]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-1">
              Top Pickups & City Transfers
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Popular Fixed-Rate Routes
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              All listed fares are fixed per vehicle (not per passenger) and include all supplements, motorway tolls, and airport fees.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Prices per car</span>
            <span>·</span>
            <span>Tolls included</span>
            <span>·</span>
            <span>Child seat +€5</span>
          </div>
        </div>

        {/* Route Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {POPULAR_ROUTES.map((route) => (
            <div
              key={route.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md flex flex-col justify-between ${
                route.highlight
                  ? 'border-[#9A6B00] shadow-sm relative ring-1 ring-[#F5B800]/30'
                  : 'border-[#E6DFCB] hover:border-[#F5B800] shadow-xs'
              }`}
            >
              {route.highlight && (
                <div className="absolute -top-3 left-5">
                  <span className="bg-[#F5B800] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs border border-[#D99F00]">
                    Zone Rate
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    {route.name}
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{route.duration}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-500 mb-4 space-y-0.5">
                  <div>From: <b className="text-slate-800">{route.from}</b></div>
                  <div>To: <b className="text-slate-800">{route.to}</b></div>
                </div>

                {/* Pricing comparison per vehicle */}
                <div className="grid grid-cols-3 gap-2 bg-[#FCFBF7] rounded-xl p-2.5 border border-[#EFE7D1] mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Standard</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">€{route.prices.standard}</span>
                    <span className="text-[10px] text-slate-400 block">1-4 pax</span>
                  </div>

                  <div className="border-x border-[#EFE7D1]">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Comfort</span>
                    <span className="text-sm font-extrabold text-[#704B00] tabular-nums">€{route.prices.comfort}</span>
                    <span className="text-[10px] text-slate-400 block">Exec</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Minivan</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">€{route.prices.van}</span>
                    <span className="text-[10px] text-slate-400 block">Up to 8</span>
                  </div>
                </div>
              </div>

              {/* Select Route Button */}
              <button
                type="button"
                onClick={() => onSelectRoute(route)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#FBF7E6] hover:bg-[#F5B800] text-[#0D0F12] border border-[#DFC670] font-bold text-xs transition-all cursor-pointer"
              >
                <span>Select & Calculate Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
