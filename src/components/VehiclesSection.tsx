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
    <section id="fleet" className="pt-10 pb-14 bg-white border-b border-[#E6DFCB]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A5D00] block mb-1">
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
            const currentLabel = vehicle.photoLabels?.[currentIdx] || vehicle.name;
            const hasMultiplePhotos = vehicle.photos.length > 1;

            return (
              <div
                key={vehicle.id}
                className="bg-[#FCFBF7] border border-[#E6DFCB]/80 hover:border-[#F5B800] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Vehicle Photo Container */}
                  <div className="relative w-full h-56 bg-[#0D0F12] overflow-hidden group">
                    <img
                      src={currentPhoto}
                      alt={currentLabel}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Multiple photos navigation */}
                    {hasMultiplePhotos && (
                      <>
                        <button
                          type="button"
                          onClick={() => prevPhoto(vehicle.id, vehicle.photos.length)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0D0F12]/75 text-white border border-white/20 flex items-center justify-center transition-all hover:bg-[#F5B800] hover:text-[#0D0F12] cursor-pointer shadow-md"
                          aria-label="Previous vehicle photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => nextPhoto(vehicle.id, vehicle.photos.length)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0D0F12]/75 text-white border border-white/20 flex items-center justify-center transition-all hover:bg-[#F5B800] hover:text-[#0D0F12] cursor-pointer shadow-md"
                          aria-label="Next vehicle photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <div className="absolute top-3 left-3 bg-[#0D0F12]/90 text-[#F5B800] border border-[#F5B800]/50 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs">
                      {vehicle.category}
                    </div>

                    {hasMultiplePhotos && (
                      <div className="absolute top-3 right-3 bg-white/95 text-[#0D0F12] text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs tabular-nums">
                        {currentIdx + 1} / {vehicle.photos.length}
                      </div>
                    )}

                    {/* Active Vehicle Model Strip */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0D0F12]/90 via-[#0D0F12]/55 to-transparent px-3 pt-5 pb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate">
                        {currentLabel}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#F5B800] shrink-0 ml-2">
                        Taximeter
                      </span>
                    </div>
                  </div>

                  {/* 4-Car Official Fleet Thumbnail Strip */}
                  {hasMultiplePhotos && (
                    <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#F4EFE0] border-b border-[#E6DFCB]/80">
                      {vehicle.photos.map((photoUrl, idx) => {
                        const isActive = idx === currentIdx;
                        const label = vehicle.photoLabels?.[idx] || `${vehicle.name} ${idx + 1}`;
                        return (
                          <button
                            key={photoUrl}
                            type="button"
                            onClick={() =>
                              setActivePhotoIndex((prev) => ({ ...prev, [vehicle.id]: idx }))
                            }
                            aria-label={`View ${label}`}
                            title={label}
                            className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              isActive
                                ? 'border-[#F5B800] ring-1 ring-[#F5B800] scale-[1.02]'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-display font-extrabold text-xl text-slate-900">
                        {vehicle.name}
                      </h3>
                      <span className="text-xs font-bold text-[#0D0F12] bg-[#FBF7E6] border border-[#DFC670] px-2.5 py-0.5 rounded-full">
                        {vehicle.seats}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      {vehicle.description}
                    </p>

                    {/* Capacity Specs */}
                    <div className="grid grid-cols-2 gap-2 py-3 px-3 bg-white rounded-xl border border-[#E6DFCB]/70 mb-4 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#8A5D00]" />
                        <span>Up to {vehicle.maxPassengers} passengers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#8A5D00]" />
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8A5D00] mt-0.5 shrink-0" />
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-extrabold text-xs transition-colors shadow-[0_4px_16px_-4px_rgba(245,184,0,0.55)]"
                  >
                    <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
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
