import React, { useState } from 'react';
import { Users, Briefcase, CheckCircle2, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { VEHICLES, BUSINESS_INFO } from '../data/transferData';

export const VehiclesSection: React.FC = () => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<{ [vehicleId: string]: number }>({
    standard: 0,
    comfort: 0,
    van: 0,
  });

  const nextPhoto = (vehicleId: string, total: number) => {
    setActivePhotoIndex((prev) => ({
      ...prev,
      [vehicleId]: ((prev[vehicleId] || 0) + 1) % total,
    }));
  };

  const prevPhoto = (vehicleId: string, total: number) => {
    setActivePhotoIndex((prev) => ({
      ...prev,
      [vehicleId]: ((prev[vehicleId] || 0) - 1 + total) % total,
    }));
  };

  return (
    <section id="fleet" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0e5c73] block mb-1">
            Our Fleet & Chauffeurs
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Modern, Inspected & Fully Sanitized Vehicles
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every vehicle in our fleet is fully air-conditioned, licensed by transport authorities in Catalonia, and driven by an experienced bilingual chauffeur.
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {VEHICLES.map((vehicle) => {
            const currentIdx = activePhotoIndex[vehicle.id] || 0;
            const currentPhoto = vehicle.photos[currentIdx] || vehicle.photos[0];
            const hasMultiplePhotos = vehicle.photos.length > 1;

            return (
              <div
                key={vehicle.id}
                className="bg-slate-50 border-2 border-amber-400/60 hover:border-amber-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Vehicle Photo Container */}
                  <div className="relative w-full h-52 bg-slate-200 overflow-hidden group">
                    <img
                      src={currentPhoto}
                      alt={vehicle.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Multiple photos navigation */}
                    {hasMultiplePhotos && (
                      <>
                        <button
                          type="button"
                          onClick={() => prevPhoto(vehicle.id, vehicle.photos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => nextPhoto(vehicle.id, vehicle.photos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                          {vehicle.photos.map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i === currentIdx ? 'bg-amber-400 w-4' : 'bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="absolute top-3 left-3 bg-[#0e2438]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {vehicle.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-display font-extrabold text-xl text-slate-900">
                        {vehicle.name}
                      </h3>
                      <span className="text-xs font-bold text-[#0e5c73] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        {vehicle.seats}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      {vehicle.description}
                    </p>

                    {/* Capacity Specs */}
                    <div className="grid grid-cols-2 gap-2 py-3 px-3 bg-white rounded-xl border border-slate-200 mb-4 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>Up to {vehicle.maxPassengers} passengers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        <span>Up to {vehicle.maxLuggage} suitcases</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Features
                      </span>
                      {vehicle.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-6 pt-0">
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                      `Hello Easytransferhub, I would like to book the ${vehicle.name} for a transfer.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#0e5c73] text-white font-bold text-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                    <span>Inquire About {vehicle.name}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
