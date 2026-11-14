import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { FAQS, BUSINESS_INFO } from '../data/transferData';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-16 bg-white border-b border-[#9beeff]/70">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#008da1] block mb-1">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything you need to know about your pickup, flight tracking, and payment.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#9beeff]/80 hover:border-[#00f0ff] rounded-2xl overflow-hidden transition-all bg-[#f5feff] hover:bg-[#ebfdff] shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#008da1]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-[#9beeff]/60 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-8 p-5 rounded-2xl bg-[#e6fdff] text-slate-900 border border-[#67efff] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Have a custom question or special group request?</h4>
            <p className="text-xs text-slate-600 mt-0.5">Mr. Mir replies within minutes on WhatsApp.</p>
          </div>
          <a
            href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent('Hello Easytransferhub, I have a question about a transfer.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#00d8eb] text-slate-950 font-extrabold text-xs shadow-[0_4px_16px_-4px_rgba(0,240,255,0.55)] transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
