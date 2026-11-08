import React from 'react';
import { Clock, ArrowRight, Car, Check } from 'lucide-react';
import { POPULAR_ROUTES, FixedRoute } from '../data/transferData';

interface PopularRoutesProps {
  onSelectRoute: (route: FixedRoute) => void;
}

export const PopularRoutes: React.FC<PopularRoutesProps> = ({ onSelectRoute }) => {
  return (
    <section id="routes" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0e5c73] block mb-1">
              Top Pickups & City Transfers
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Popular Fixed-Rate Routes
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              All listed fares are fixed per vehicle (not per passenger) and include all Catalan motorway tolls, luggage, and airport fees.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Prices per car</span>
            <span>·</span>
            <span>Tolls included</span>
            <span>·</span>
            <span>No night surcharge</span>
          </div>
        </div>

        {/* Route Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {POPULAR_ROUTES.map((route) => (
            <div
              key={route.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-lg flex flex-col justify-between ${
                route.highlight
                  ? 'border-amber-300 shadow-sm relative'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {route.highlight && (
                <div className="absolute -top-3 left-5">
                  <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    Most Popular
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
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Standard</span>
                    <span className="text-sm font-extrabold text-slate-900">€{route.prices.standard}</span>
                    <span className="text-[10px] text-slate-400 block">1-4 pax</span>
                  </div>

                  <div className="border-x border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Comfort</span>
                    <span className="text-sm font-extrabold text-[#0e5c73]">€{route.prices.comfort}</span>
                    <span className="text-[10px] text-slate-400 block">Exec</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Minivan</span>
                    <span className="text-sm font-extrabold text-slate-900">€{route.prices.van}</span>
                    <span className="text-[10px] text-slate-400 block">Up to 8</span>
                  </div>
                </div>
              </div>

              {/* Select Route Button */}
              <button
                type="button"
                onClick={() => onSelectRoute(route)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#f5b301] hover:text-slate-950 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
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
