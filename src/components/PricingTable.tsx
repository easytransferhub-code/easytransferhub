import React from 'react';
import { Info, MapPin, ShieldCheck, Baby } from 'lucide-react';
import { BARCELONA_ZONES, CHILD_SEAT_PRICE_EUR, DISTANCE_TIERS } from '../data/transferData';

interface PricingTableProps {
  embedded?: boolean;
}

export const PricingTable: React.FC<PricingTableProps> = ({ embedded = false }) => {
  return (
    <section
      id="prices"
      className={embedded ? 'py-2 bg-transparent' : 'py-16 bg-[#FAF9F6] border-b border-[#E6DFCB]/70'}
    >
      <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 space-y-8'}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-1">
            Official 10-Zone Fixed Airport Fares
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Barcelona Airport ↔ City Zones & Rates
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Same fixed fare both ways (Barcelona Airport ↔ City or City ↔ Airport). Prices are per vehicle with all supplements, motorway tolls, and airport parking fees included. Extra child seat: <b>+€{CHILD_SEAT_PRICE_EUR} per seat</b>.
          </p>
        </div>

        {/* Summary Tier Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E3D6AD] p-5 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FBF7E6] border border-[#DFC670] text-[#704B00]">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-900">Zones 1 – 6 (Central & West)</h3>
                  <p className="text-xs text-slate-500">Ciutat Vella, Eixample, Sants-Montjuïc, Les Corts, Sarrià, Gràcia</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-[#F5B800] text-slate-950 shrink-0">
                All Supplements Included
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EFE7D1] text-center">
              <div className="bg-[#FCFBF7] rounded-xl p-2.5 border border-[#EFE7D1]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Standard</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">€50</span>
              </div>
              <div className="bg-[#FBF7E6] rounded-xl p-2.5 border border-[#E3D6AD]">
                <span className="text-[10px] uppercase font-bold text-[#704B00] block">Comfort</span>
                <span className="text-lg font-black text-[#704B00] tabular-nums">€60</span>
              </div>
              <div className="bg-[#FCFBF7] rounded-xl p-2.5 border border-[#EFE7D1]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Minivan</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">€70</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E3D6AD] p-5 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FBF7E6] border border-[#DFC670] text-[#704B00]">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-900">Zones 7 – 10 (North & Seafront)</h3>
                  <p className="text-xs text-slate-500">Horta-Guinardó, Nou Barris, Sant Andreu, Sant Martí</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-[#FBF7E6] border border-[#DFC670] text-[#0D0F12] shrink-0">
                All Supplements Included
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EFE7D1] text-center">
              <div className="bg-[#FCFBF7] rounded-xl p-2.5 border border-[#EFE7D1]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Standard</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">€60</span>
              </div>
              <div className="bg-[#FBF7E6] rounded-xl p-2.5 border border-[#E3D6AD]">
                <span className="text-[10px] uppercase font-bold text-[#704B00] block">Comfort</span>
                <span className="text-lg font-black text-[#704B00] tabular-nums">€70</span>
              </div>
              <div className="bg-[#FCFBF7] rounded-xl p-2.5 border border-[#EFE7D1]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Minivan</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">€80</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full 10-Zone Boundary Table */}
        <div className="bg-white rounded-2xl border border-[#E3D6AD] overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#FBF7E6] text-[#0D0F12] border-b border-[#E3D6AD] font-bold text-xs uppercase tracking-[0.14em] flex flex-wrap items-center justify-between gap-2">
            <span>Barcelona 10-Zone Boundary & Main Areas Breakdown</span>
            <span className="text-[11px] font-semibold text-[#704B00] normal-case tracking-normal">
              Airport ↔ City bidirectional · All supplements included
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FCFBF7] text-slate-600 text-[11px] uppercase tracking-wider border-b border-[#EFE7D1]">
                <tr>
                  <th className="py-3 px-4 font-bold">Zone</th>
                  <th className="py-3 px-4 font-bold">District</th>
                  <th className="py-3 px-4 font-bold">Main Areas Inside Boundary</th>
                  <th className="py-3 px-4 text-right font-bold">Standard</th>
                  <th className="py-3 px-4 text-right font-bold">Comfort</th>
                  <th className="py-3 px-4 sm:px-6 text-right font-bold">Minivan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D1]">
                {BARCELONA_ZONES.map((z) => (
                  <tr
                    key={z.zone}
                    className={`transition-colors ${
                      z.tierGroup === '1-6' ? 'hover:bg-[#FCFBF7]' : 'bg-[#FDFCF9] hover:bg-[#FAF5DF]'
                    }`}
                  >
                    <td className="py-3 px-4 font-extrabold text-[#0D0F12] whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold ${
                          z.tierGroup === '1-6'
                            ? 'bg-[#FBF7E6] text-[#704B00] border border-[#E3D6AD]'
                            : 'bg-[#0D0F12] text-[#F5B800]'
                        }`}
                      >
                        Zone {z.zone}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {z.district}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {z.mainAreas.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                      €{z.prices.standard}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#704B00] tabular-nums">
                      €{z.prices.comfort}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right font-extrabold text-slate-900 tabular-nums">
                      €{z.prices.van}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Distance Tiers Table */}
        <div className="bg-white rounded-2xl border border-[#E3D6AD] overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#FBF7E6] text-[#0D0F12] border-b border-[#E3D6AD] font-bold text-xs uppercase tracking-[0.14em]">
            Regional & Intercity Distance Rates (Outside Barcelona Zones)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FCFBF7] text-slate-600 text-[11px] uppercase tracking-wider border-b border-[#EFE7D1]">
                <tr>
                  <th className="py-3 px-4 sm:px-6 font-bold">Driving Distance by Road</th>
                  <th className="py-3 px-4 text-right font-bold">Standard Sedan</th>
                  <th className="py-3 px-4 text-right font-bold">Comfort Executive</th>
                  <th className="py-3 px-4 sm:px-6 text-right font-bold">Minivan (5–8 pax)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D1]">
                {DISTANCE_TIERS.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {tier.label}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      from €{tier.prices.standard}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#704B00] tabular-nums">
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

        {/* Pricing Inclusions & Child Seat Banner */}
        <div className="p-4 rounded-xl bg-white border border-[#E3D6AD] text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8A5D00] shrink-0" />
            <span>
              <b>All-Inclusive Zone Rates:</b> Highway tolls, luggage, flight radar tracking, and 60m airport waiting included. Extra child/baby seat: <b>+€{CHILD_SEAT_PRICE_EUR} per seat</b>.
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-bold text-[#0D0F12] shrink-0 bg-[#FBF7E6] px-3 py-1.5 rounded-lg border border-[#DFC670]">
            <Baby className="w-3.5 h-3.5 text-[#8A5D00]" />
            <span>Extra Child Seat: +€{CHILD_SEAT_PRICE_EUR}</span>
          </span>
        </div>
      </div>
    </section>
  );
};
