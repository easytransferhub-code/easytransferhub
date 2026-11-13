/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VehiclesSection } from './components/VehiclesSection';
import { HowItWorks } from './components/HowItWorks';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingWhatsAppButton';
import { AIAssistantModal } from './components/AIAssistantModal';
import { BookingVoucherModal } from './components/BookingVoucherModal';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'es' | 'ca' | 'ur'>('en');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);

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
          onOpenVoucher={(data) => setVoucherData(data)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        {/* Vehicle Fleet Showcase - Directly below Hero Meet & Greet */}
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
