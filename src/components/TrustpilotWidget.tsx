import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement?: (element: HTMLElement | null, forceReload?: boolean) => void;
    };
  }
}

interface TrustpilotWidgetProps {
  className?: string;
}

export const TrustpilotWidget: React.FC<TrustpilotWidgetProps> = ({ className = '' }) => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const initTrustBox = () => {
      if (window.Trustpilot?.loadFromElement) {
        window.Trustpilot.loadFromElement(el, true);
        return true;
      }
      return false;
    };

    if (initTrustBox()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (initTrustBox() || attempts >= 24) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className={className}>
      {/* TrustBox widget - Review Collector */}
      <div
        ref={widgetRef}
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="6b00acd0a7dbf30ad4d332ac"
        data-style-height="52px"
        data-style-width="100%"
      >
        <a
          href="https://www.trustpilot.com/review/easytransferhub.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
      {/* End TrustBox widget */}
    </div>
  );
};
