import React, { useState } from 'react';
import { Search, ShieldCheck, Check, Info } from 'lucide-react';
import { DISTANCE_TIERS, POPULAR_ROUTES } from '../data/transferData';

export const PricingTable: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredRoutes = POPULAR_ROUTES.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.from.toLowerCase().includes(search.toLowerCase()) ||
    r.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="prices" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0e5c73] block mb-1">
              Guaranteed Transparent Rates
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Fixed Price Guide
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Fares are per vehicle, not per person. All motorway tolls, luggage, and airport fees are included in the price.
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destination (e.g. Sitges)..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0e5c73] outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Popular Destination Routes Table */}
        <div className="bg-white rounded-2xl border-2 border-amber-400/70 overflow-hidden shadow-xs mb-10">
          <div className="px-5 py-3.5 bg-slate-900 text-amber-400 border-b-2 border-amber-400/60 font-bold text-xs uppercase tracking-wider">
            Popular Fixed-Fare Routes from Barcelona
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6 font-bold">Route / Destination</th>
                  <th className="py-3 px-4 text-center font-bold">Distance & Time</th>
                  <th className="py-3 px-4 text-right font-bold">Standard (1-4 pax)</th>
                  <th className="py-3 px-4 text-right font-bold">Comfort Exec</th>
                  <th className="py-3 px-4 sm:px-6 text-right font-bold">Van (up to 8 pax)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        {r.name}
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                          {r.from} ↔ {r.to}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {r.duration}
                        <span className="block text-[11px] text-slate-400">≈ {r.distanceKm} km</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        €{r.prices.standard}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0e5c73]">
                        €{r.prices.comfort}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                        €{r.prices.van}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No routes found matching "{search}". Use the custom calculator above for any address!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distance Tiers Table */}
        <div className="bg-white rounded-2xl border-2 border-amber-400/70 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-900 text-amber-400 border-b-2 border-amber-400/60 font-bold text-xs uppercase tracking-wider">
            Distance-Based Rates (For All Other Destinations)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6 font-bold">Driving Distance by Road</th>
                  <th className="py-3 px-4 text-right font-bold">Standard Sedan</th>
                  <th className="py-3 px-4 text-right font-bold">Comfort Executive</th>
                  <th className="py-3 px-4 sm:px-6 text-right font-bold">Van (5–8 pax)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DISTANCE_TIERS.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {tier.label}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      from €{tier.prices.standard}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0e5c73]">
                      from €{tier.prices.comfort}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                      from €{tier.prices.van}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Inclusions Banner */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <b>Every quote is all-inclusive:</b> Motorway tolls, flight radar tracking, 60 minutes free waiting at airport, and VAT are included.
            </span>
          </div>
          <span className="font-bold text-slate-900 shrink-0">
            Zero hidden card or cash surcharges
          </span>
        </div>
      </div>
    </section>
  );
};
