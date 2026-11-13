import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { BUSINESS_INFO } from '../data/transferData';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*New Inquiry via Easytransferhub Website*\nName: ${name || 'Customer'}\nPhone/WhatsApp: ${phone || 'Not provided'}\n\nMessage:\n${message || 'Hi Mr. Mir, I would like to inquire about a private transfer.'}`;
    const url = `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Transfer Inquiry - ${name || 'Customer'}`);
    const body = encodeURIComponent(`Name: ${name}\nPhone: ${phone}\n\nMessage:\n${message}`);
    window.location.href = `mailto:${BUSINESS_INFO.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="py-16 bg-[#f2fbf6] border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 block mb-1">
                Direct Contact
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                Talk to Us 24/7
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Have questions about a corporate group, custom day tour to Montserrat or Costa Brava, or long-distance city transfer? Mr. Mir and the EasyTransferHub dispatch team are always on call.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-emerald-200/80 hover:border-emerald-400 shadow-xs transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Phone & WhatsApp Direct</span>
                  <a
                    href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, '')}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                  >
                    {BUSINESS_INFO.phoneDisplay}
                  </a>
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 font-semibold hover:underline mt-0.5 inline-block"
                  >
                    Click to open WhatsApp chat
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-emerald-200/80 hover:border-emerald-400 shadow-xs transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Email Bookings & Invoicing</span>
                  <a
                    href={`mailto:${BUSINESS_INFO.email}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                  >
                    {BUSINESS_INFO.email}
                  </a>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Official VAT company invoices provided on request
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-emerald-200/80 hover:border-emerald-400 shadow-xs transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Operating Base</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {BUSINESS_INFO.city}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Catalonia, Spain & Andorra service coverage
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right form column */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-emerald-200/80 shadow-md">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
                Send a Fast Inquiry
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                Fill in the details below and Mr. Mir will confirm price and availability with you immediately.
              </p>

              {submitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-base">Inquiry Dispatched!</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Your WhatsApp inquiry has been prepared. If WhatsApp didn't open automatically, you can message us directly at {BUSINESS_INFO.phoneDisplay}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs font-bold text-emerald-800 underline cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendWhatsApp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. David Miller"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#f8fcf9] border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Phone or WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +44 7123 456789"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#f8fcf9] border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Trip Details / Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Specify your pickup address, destination, date, flight number or any special luggage requirements..."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#f8fcf9] border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Send on WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendEmail}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ecfdf5] hover:bg-emerald-100 text-emerald-900 font-bold text-xs sm:text-sm border border-emerald-200 transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-emerald-700" />
                      <span>Send via Email</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
