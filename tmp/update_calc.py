import sys

with open('src/components/BookingCalculator.tsx', 'r') as f:
    content = f.read()

start_marker = '        {/* 1-Row Compact Options: Passengers, Luggage, Child Seats */}'
end_marker = '      {/* 1-Click Luggage Size Chart Modal */}'

new_section = """        {/* 1-Row Compact Options: Passengers, Luggage, Child Seats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-200">
          {/* Box 1: Passengers */}
          <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Passengers</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {totalPassengers} Pax
                </span>
              </div>

              {/* Adults & Children Steppers */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                  <span className="text-slate-700 font-semibold text-[11px]">Adults (12+y)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      disabled={adults <= 1}
                      aria-label="Decrease adults"
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.min(8 - children, prev + 1))}
                      disabled={adults + children >= 8}
                      aria-label="Increase adults"
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-700 font-semibold text-[11px]">Children (0–11y)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, children - 1);
                        setChildren(next);
                        if (next === 0) {
                          setBabySeats(0);
                          setBoosterSeats(0);
                        }
                      }}
                      disabled={children <= 0}
                      aria-label="Decrease children"
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{children}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(8 - adults, children + 1);
                        setChildren(next);
                        if (totalChildSeats === 0) {
                          if (childAgeGroup === '0-2') setBabySeats(1);
                          else setBoosterSeats(1);
                        }
                      }}
                      disabled={adults + children >= 8}
                      aria-label="Increase children"
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Age pill if children > 0 */}
              {children > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: '0-2', label: '0–2y' },
                      { id: '3-6', label: '3–6y' },
                      { id: '7-11', label: '7–11y' },
                    ].map((ag) => (
                      <button
                        key={ag.id}
                        type="button"
                        onClick={() => {
                          setChildAgeGroup(ag.id as any);
                          if (ag.id === '0-2' && babySeats === 0) {
                            setBabySeats(1);
                            setBoosterSeats(0);
                          } else if ((ag.id === '3-6' || ag.id === '7-11') && boosterSeats === 0) {
                            setBoosterSeats(1);
                            setBabySeats(0);
                          }
                        }}
                        className={`py-0.5 rounded text-center text-[9px] font-bold transition-all cursor-pointer ${
                          childAgeGroup === ag.id
                            ? 'bg-[#0e5c73] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {ag.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Luggage (Compact 2x2 grid) */}
          <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                  <span>Luggage</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    className="text-[9px] font-bold text-[#0e5c73] hover:text-[#0b4859] bg-sky-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>📏 Guide</span>
                  </button>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {totalBags} Bags
                  </span>
                </div>
              </div>

              {/* 4 Luggage types in 2 compact columns */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {/* Large */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                  <span className="text-slate-700 font-semibold text-[10px] leading-tight">Large (75cm)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLargeBags((p) => Math.max(0, p - 1))}
                      disabled={largeBags <= 0}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                    <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{largeBags}</span>
                    <button
                      type="button"
                      onClick={() => setLargeBags((p) => Math.min(8, p + 1))}
                      disabled={checkInSuitcases >= 8}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2 h-2" />
                    </button>
                  </div>
                </div>

                {/* Medium */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                  <span className="text-slate-700 font-semibold text-[10px] leading-tight">Medium (65cm)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMediumBags((p) => Math.max(0, p - 1))}
                      disabled={mediumBags <= 0}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                    <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{mediumBags}</span>
                    <button
                      type="button"
                      onClick={() => setMediumBags((p) => Math.min(8, p + 1))}
                      disabled={checkInSuitcases >= 8}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2 h-2" />
                    </button>
                  </div>
                </div>

                {/* Cabin */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-700 font-semibold text-[10px] leading-tight">Cabin (55cm)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHandCarryBags((p) => Math.max(0, p - 1))}
                      disabled={handCarryBags <= 0}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                    <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{handCarryBags}</span>
                    <button
                      type="button"
                      onClick={() => setHandCarryBags((p) => Math.min(8, p + 1))}
                      disabled={handCarryBags >= 8}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2 h-2" />
                    </button>
                  </div>
                </div>

                {/* Backpack */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-700 font-semibold text-[10px] leading-tight">Backpack</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShoulderBags((p) => Math.max(0, p - 1))}
                      disabled={shoulderBags <= 0}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                    <span className="w-3 text-center font-extrabold text-slate-900 text-[11px]">{shoulderBags}</span>
                    <button
                      type="button"
                      onClick={() => setShoulderBags((p) => Math.min(8, p + 1))}
                      disabled={shoulderBags >= 8}
                      className="w-4 h-4 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2 h-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Child Seats */}
          <div className="bg-slate-50 border border-amber-400/60 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Baby className="w-3.5 h-3.5 text-slate-600" />
                  <span>Child Seats</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Free
                </span>
              </div>

              <div className="space-y-1 text-xs">
                {/* Baby Seat */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-200/70">
                  <div>
                    <span className="text-slate-800 font-semibold text-[11px] leading-tight block">Baby Seat (0–2y)</span>
                    <span className="text-[9px] text-slate-400 block">Harness seat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBabySeats((p) => Math.max(0, p - 1))}
                      disabled={babySeats <= 0}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{babySeats}</span>
                    <button
                      type="button"
                      onClick={() => setBabySeats((p) => Math.min(3, p + 1))}
                      disabled={totalChildSeats >= 4}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Booster Cushion */}
                <div className="flex items-center justify-between py-0.5">
                  <div>
                    <span className="text-slate-800 font-semibold text-[11px] leading-tight block">Booster (3+y)</span>
                    <span className="text-[9px] text-slate-400 block">High/low cushion</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBoosterSeats((p) => Math.max(0, p - 1))}
                      disabled={boosterSeats <= 0}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-3.5 text-center font-extrabold text-slate-900 text-xs">{boosterSeats}</span>
                    <button
                      type="button"
                      onClick={() => setBoosterSeats((p) => Math.min(4, p + 1))}
                      disabled={totalChildSeats >= 4}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 mt-1 italic flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span>Spanish law compliant · Free</span>
            </p>
          </div>
        </div>

        {/* Route Info & Fixed Fare Summary Bar (Clean, NO PREVIEW MAP) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-amber-500/10 border-2 border-amber-400/80 rounded-xl text-xs text-slate-800 shadow-xs">
          <div className="flex items-center gap-2">
            {calculating ? (
              <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Calculating route...
              </span>
            ) : quote ? (
              <span className="flex items-center gap-2 font-medium">
                <span className="font-bold text-slate-900">
                  ≈ {quote.distanceKm} km · {quote.durationText} drive
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-semibold">
                  Tolls & parking included
                </span>
              </span>
            ) : (
              <span className="text-slate-600 font-medium">
                Fixed Price Guarantee · Highway tolls & waiting included
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-amber-900 text-xs">Total Fare:</span>
            <span className="text-base text-slate-950 font-extrabold">
              {quote ? `€${finalQuotedPrice}` : 'from €39'}
            </span>
          </div>
        </div>

        {/* Compact Vehicle Selection Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
              Select Vehicle Class
            </label>
            {totalPassengers >= 5 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                5+ passengers: Minivan selected
              </span>
            )}
          </div>

          <div
            className={`grid gap-2.5 ${
              availableVehicles.length === 1
                ? 'grid-cols-1 max-w-sm mx-auto'
                : availableVehicles.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {availableVehicles.map((v) => {
              const vQuote = quote?.vehicles.find((q) => q.vehicleId === v.id);
              const price = vQuote
                ? isRoundTrip
                  ? vQuote.roundTripTotal
                  : vQuote.totalPrice
                : v.id === 'standard' ? 39 : v.id === 'comfort' ? 47 : 59;
              const isSelected = selectedVehicleId === v.id;
              const isRec = vQuote?.isRecommended || availableVehicles.length === 1;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`relative p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400'
                      : 'border-amber-400/60 hover:border-amber-400 bg-white hover:shadow-xs'
                  }`}
                >
                  {isRec && (
                    <span className="absolute -top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs border border-amber-500">
                      Best Match
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-slate-900 text-xs sm:text-sm">
                      {v.name}
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">
                      €{price}
                    </span>
                  </div>

                  <div className="w-full h-14 sm:h-16 rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative border border-amber-400/40">
                    <img
                      src={v.photos[0]}
                      alt={v.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                    <span>Max {v.maxPassengers} Pax</span>
                    <span>·</span>
                    <span>Max {v.maxLuggage} Bags</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Action Buttons - DIRECTLY BELOW VEHICLE & CHILD SEATS */}
        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleBookWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f5b301] hover:bg-[#e5a700] text-slate-950 font-extrabold text-sm sm:text-base shadow-md transition-all active:scale-[0.98] cursor-pointer border border-amber-500"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>{t.bookWhatsApp} ({quote ? `€${finalQuotedPrice}` : 'Instant Booking'})</span>
            </button>

            <button
              type="button"
              onClick={handleViewVoucher}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-slate-800 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{t.viewSummary}</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-2 flex-wrap">
            <span>✓ Fixed Price Guarantee</span>
            <span>·</span>
            <span>✓ Pay Cash or Card to Chauffeur</span>
            <span>·</span>
            <span>✓ Free Cancellation up to 24h</span>
          </p>
        </div>
      </div>
"""

prefix = content[:content.index(start_marker)]
suffix = content[content.index(end_marker):]
new_content = prefix + new_section + '\n      ' + suffix

with open('src/components/BookingCalculator.tsx', 'w') as f:
    f.write(new_content)

print('SUCCESS')
