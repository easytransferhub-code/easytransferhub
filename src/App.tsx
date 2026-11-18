/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VehiclesSection } from './components/VehiclesSection';
import { PricingTable } from './components/PricingTable';
import { HowItWorks } from './components/HowItWorks';
import { WhyChooseUs } from './components/WhyChooseUs';
import { ReviewsAndVisitorsSection } from './components/ReviewsAndVisitorsSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingWhatsAppButton';
import { AIAssistantModal } from './components/AIAssistantModal';
import { BookingVoucherModal } from './components/BookingVoucherModal';
import { OwnerQuotaMeterModal } from './components/OwnerQuotaMeterModal';
import { recordSessionVisitOnce } from './utils/telemetryClient';

const ENV_MAPS_API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

function checkOwnerMeterUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return hash === '#owner-meter' || params.get('meter') === 'owner';
}

export default function App() {
  const [language, setLanguage] = useState<'en' | 'es' | 'ca' | 'ur'>('en');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isOwnerMeterOpen, setIsOwnerMeterOpen] = useState<boolean>(() => checkOwnerMeterUrl());
  const [voucherData, setVoucherData] = useState<any>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string>(ENV_MAPS_API_KEY);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [mapsAuthFailed, setMapsAuthFailed] = useState(false);

  // Record 1 SEO/Direct session visit and listen for #owner-meter deep-link
  useEffect(() => {
    recordSessionVisitOnce();
    const onHashChange = () => {
      if (checkOwnerMeterUrl()) {
        setIsOwnerMeterOpen(true);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Runtime fallback fetch from /api/maps-config if VITE_* wasn't bundled at build time
  useEffect(() => {
    if (ENV_MAPS_API_KEY) return;
    let active = true;
    fetch('/api/maps-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.apiKey && typeof data.apiKey === 'string') {
          setMapsApiKey(data.apiKey.trim());
        }
      })
      .catch(() => {
        // graceful fallback to OpenStreetMap/Photon & local zone search
      });
    return () => {
      active = false;
    };
  }, []);

  // Graceful fallback listeners for Google Maps quota or project auth/suspension errors
  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);

    const prevGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setMapsAuthFailed(true);
      if (typeof prevGmAuthFailure === 'function') {
        try {
          prevGmAuthFailure();
        } catch {
          // ignore
        }
      }
    };

    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
      if (prevGmAuthFailure !== undefined) {
        (window as any).gm_authFailure = prevGmAuthFailure;
      } else {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  const mapsEnabled = Boolean(mapsApiKey) && !quotaExceeded && !mapsAuthFailed;

  const content = (
    <div id="top" className={`min-h-screen flex flex-col bg-white text-slate-900 ${language === 'ur' ? 'font-sans' : ''}`}>

      {/* Top Navigation */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenOwnerMeter={() => setIsOwnerMeterOpen(true)}
      />

      <main className="flex-1">
        {/* Hero & Interactive Calculator */}
        <Hero
          language={language}
          onOpenVoucher={(data) => setVoucherData(data)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          mapsEnabled={mapsEnabled}
        />

        {/* Vehicle Fleet Showcase - Directly below Hero Meet & Greet */}
        <VehiclesSection />

        {/* Barcelona 10-Zone Boundary & Airport Fixed Rate Guide */}
        <PricingTable />

        {/* How It Works */}
        <HowItWorks />

        {/* Guarantees & Why Choose Us */}
        <WhyChooseUs />

        {/* Live Visitors Meter & Client Reviews */}
        <ReviewsAndVisitorsSection onOpenOwnerMeter={() => setIsOwnerMeterOpen(true)} />

        {/* FAQ Section */}
        <FaqSection />

        {/* Direct Contact & WhatsApp Form */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer onOpenOwnerMeter={() => setIsOwnerMeterOpen(true)} />

      {/* Floating Action Buttons */}
      <FloatingActions onOpenAssistant={() => setIsAssistantOpen(true)} />

      {/* 24/7 AI Concierge Chat Modal */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Owner-Only A-to-Z Quota, API Key & SEO Visitor Meter */}
      <OwnerQuotaMeterModal
        isOpen={isOwnerMeterOpen}
        onClose={() => {
          setIsOwnerMeterOpen(false);
          if (window.location.hash === '#owner-meter') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      {/* Printable Booking Voucher Modal */}
      <BookingVoucherModal
        isOpen={!!voucherData}
        bookingData={voucherData}
        onClose={() => setVoucherData(null)}
      />
    </div>
  );

  if (mapsApiKey && !quotaExceeded) {
    return (
      <APIProvider
        apiKey={mapsApiKey}
        language="en"
        region="ES"
        libraries={['places', 'routes', 'marker']}
      >
        {content}
      </APIProvider>
    );
  }

  return content;
}
