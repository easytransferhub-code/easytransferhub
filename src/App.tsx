/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PopularRoutes } from './components/PopularRoutes';
import { VehiclesSection } from './components/VehiclesSection';
import { PricingTable } from './components/PricingTable';
import { HowItWorks } from './components/HowItWorks';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingWhatsAppButton';
import { AIAssistantModal } from './components/AIAssistantModal';
import { BookingVoucherModal } from './components/BookingVoucherModal';
import { FixedRoute } from './data/transferData';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'es' | 'ca' | 'ur'>('en');
  const [prefilledRoute, setPrefilledRoute] = useState<{ pickup: string; dropoff: string } | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);

  const handleSelectPopularRoute = (route: FixedRoute) => {
    setPrefilledRoute({
      pickup: route.from,
      dropoff: route.to,
    });

    const calcEl = document.getElementById('calculator');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white text-slate-900 ${language === 'ur' ? 'font-sans' : ''}`}>
      {/* Top Navigation */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      <main className="flex-1">
        {/* Hero & Interactive Calculator */}
        <Hero
          language={language}
          prefilledRoute={prefilledRoute}
          onOpenVoucher={(data) => setVoucherData(data)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        {/* Popular Fixed Routes Section */}
        <PopularRoutes onSelectRoute={handleSelectPopularRoute} />

        {/* Transparent Fixed Price Guide */}
        <PricingTable />

        {/* Vehicle Fleet Showcase */}
        <VehiclesSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Guarantees & Why Choose Us */}
        <WhyChooseUs />

        {/* FAQ Section */}
        <FaqSection />

        {/* Direct Contact & WhatsApp Form */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingActions onOpenAssistant={() => setIsAssistantOpen(true)} />

      {/* 24/7 AI Concierge Chat Modal */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Printable Booking Voucher Modal */}
      <BookingVoucherModal
        isOpen={!!voucherData}
        bookingData={voucherData}
        onClose={() => setVoucherData(null)}
      />
    </div>
  );
}
