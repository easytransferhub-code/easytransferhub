import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, Download, Copy, Check, Star, X, ExternalLink, Maximize2 } from 'lucide-react';

export const TRUSTPILOT_DIRECT_REVIEW_URL = 'https://www.trustpilot.com/evaluate/easytransferhub.com';
export const TRUSTPILOT_QR_PNG_PATH = '/images/trustpilot-review-qr.png';

interface TrustpilotQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrustpilotQrModal: React.FC<TrustpilotQrModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const scrollbarWidth = window.innerWidth - htmlEl.clientWidth;

    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevHtmlOverscroll = htmlEl.style.overscrollBehavior;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevBodyPosition = bodyEl.style.position;
    const prevBodyTop = bodyEl.style.top;
    const prevBodyLeft = bodyEl.style.left;
    const prevBodyRight = bodyEl.style.right;
    const prevBodyWidth = bodyEl.style.width;
    const prevBodyPaddingRight = bodyEl.style.paddingRight;

    htmlEl.style.overflow = 'hidden';
    htmlEl.style.overscrollBehavior = 'none';
    bodyEl.style.overflow = 'hidden';
    bodyEl.style.position = 'fixed';
    bodyEl.style.top = `-${scrollY}px`;
    bodyEl.style.left = '0';
    bodyEl.style.right = '0';
    bodyEl.style.width = '100%';
    if (scrollbarWidth > 0) {
      bodyEl.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      htmlEl.style.overflow = prevHtmlOverflow;
      htmlEl.style.overscrollBehavior = prevHtmlOverscroll;
      bodyEl.style.overflow = prevBodyOverflow;
      bodyEl.style.position = prevBodyPosition;
      bodyEl.style.top = prevBodyTop;
      bodyEl.style.left = prevBodyLeft;
      bodyEl.style.right = prevBodyRight;
      bodyEl.style.width = prevBodyWidth;
      bodyEl.style.paddingRight = prevBodyPaddingRight;
      window.scrollTo({ top: scrollY, behavior: 'auto' });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(TRUSTPILOT_DIRECT_REVIEW_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto overscroll-contain touch-none"
      role="dialog"
      aria-modal="true"
      aria-label="Trustpilot QR Code Review"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border-2 border-[#F5B800] shadow-2xl text-slate-900 my-auto touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Taxi Brand Header */}
        <div className="bg-[#0D0F12] text-white px-5 py-4 flex items-center justify-between border-b border-[#F5B800]/50">
          <div>
            <span className="font-display font-extrabold text-base tracking-tight block">
              EasyTransfer<span className="text-[#F5B800]">Hub</span>
            </span>
            <span className="text-[11px] text-neutral-300">
              Scan with phone camera to review on Trustpilot
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close Trustpilot QR code"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Contrast Scannable QR Display */}
        <div className="p-6 text-center space-y-4 bg-[#FCFBF7]">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="w-7 h-7 rounded bg-[#00B67A] flex items-center justify-center"
              >
                <Star className="w-4 h-4 fill-white text-white" />
              </span>
            ))}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#DFC670] shadow-xs inline-block">
            <img
              src={TRUSTPILOT_QR_PNG_PATH}
              alt="Scan QR code to review EasyTransferHub on Trustpilot"
              className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto"
            />
          </div>

          <div className="space-y-1">
            <h4 className="font-display font-extrabold text-base text-[#0D0F12]">
              Rate Your Barcelona Transfer
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Point any smartphone camera at this QR code to open our official Trustpilot review page directly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={TRUSTPILOT_QR_PNG_PATH}
              download="EasyTransferHub-Trustpilot-Review-QR.png"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] border border-[#D99F00] text-slate-950 font-extrabold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save QR PNG</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#FBF7E6] border border-[#DFC670] text-[#0D0F12] font-bold text-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00B67A]" /> : <Copy className="w-3.5 h-3.5 text-[#8A5D00]" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <a
            href={TRUSTPILOT_DIRECT_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#00B67A] hover:underline"
          >
            <span>Open trustpilot.com/evaluate/easytransferhub.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export const TrustpilotQrCard: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TRUSTPILOT_DIRECT_REVIEW_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <>
      <div className="bg-white border border-[#E6DFCB] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-3.5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group relative w-24 h-24 rounded-lg border border-[#DFC670] bg-white p-1.5 shrink-0 cursor-pointer hover:border-[#00B67A] transition-colors"
          title="Click to enlarge Trustpilot QR Code for passengers to scan"
        >
          <img
            src={TRUSTPILOT_QR_PNG_PATH}
            alt="Trustpilot Review QR Code for EasyTransferHub"
            className="w-full h-full object-contain"
          />
          <span className="absolute right-1 bottom-1 w-5 h-5 rounded bg-[#0D0F12]/85 text-[#F5B800] flex items-center justify-center">
            <Maximize2 className="w-3 h-3" />
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#008C5E]">
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span>Direct In-Car &amp; Client Review QR</span>
          </div>
          <p className="text-xs text-slate-600 leading-snug">
            Clients you serve directly can scan this QR code to jump straight to our Trustpilot review form and post an original review.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0D0F12] hover:bg-[#1E232B] text-[#F5B800] text-[11px] font-bold cursor-pointer transition-colors"
            >
              <QrCode className="w-3 h-3" />
              <span>Full-Screen QR</span>
            </button>
            <a
              href={TRUSTPILOT_QR_PNG_PATH}
              download="EasyTransferHub-Trustpilot-Review-QR.png"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FBF7E6] hover:bg-[#F7EDBE] border border-[#DFC670] text-[#0D0F12] text-[11px] font-bold transition-colors"
            >
              <Download className="w-3 h-3 text-[#8A5D00]" />
              <span>Download QR</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FCFBF7] border border-[#E6DFCB] text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-[#00B67A]" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Review Link'}</span>
            </button>
          </div>
        </div>
      </div>

      <TrustpilotQrModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
