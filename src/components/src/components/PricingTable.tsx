import React from 'react';
import { Info } from 'lucide-react';
import { DISTANCE_TIERS } from '../data/transferData';

export const PricingTable: React.FC = () => {
  return (
    <section id="prices" className="py-16 bg-[#f2fbf6] border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 block mb-1">
            Guaranteed Transparent Rates
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Fair Price Guide
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Fares are per vehicle, not per person. All motorway tolls, luggage, and airport fees are included in the price.
          </p>
        </div>

        {/* Distance Tiers Table */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#ecfdf5] text-emerald-950 border-b border-emerald-200 font-bold text-xs uppercase tracking-[0.14em]">
            Distance-Based Rates (For All Other Destinations)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-emerald-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6 font-bold">Driving Distance by Road</th>
                  <th className="py-3 px-4 text-right font-bold">Standard Sedan</th>
                  <th className="py-3 px-4 text-right font-bold">Comfort Executive</th>
                  <th className="py-3 px-4 sm:px-6 text-right font-bold">Van (5–8 pax)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/70">
                {DISTANCE_TIERS.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fcf9] transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {tier.label}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      from €{tier.prices.standard}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 tabular-nums">
                      from €{tier.prices.comfort}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900 tabular-nums">
                      from €{tier.prices.van}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Inclusions Banner */}
        <div className="mt-6 p-4 rounded-xl bg-white border border-emerald-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <b>Every quote is all-inclusive:</b> Motorway tolls, flight radar tracking, 60 minutes free waiting at airport, and VAT are included.
            </span>
          </div>
          <span className="font-bold text-emerald-800 shrink-0">
            Zero hidden card or cash surcharges
          </span>
        </div>
      </div>
    </section>
  );
};
