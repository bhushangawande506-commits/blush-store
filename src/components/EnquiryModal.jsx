import React, { useEffect } from 'react';
import { X, MessageSquareQuote } from 'lucide-react';

export const EnquiryModal = ({ onClose }) => {
  // Lock background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load Tally official embed widget script for responsive auto-resizing
  useEffect(() => {
    const scriptId = 'tally-embed-script';
    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      script.onload = () => {
        if (typeof window !== 'undefined' && window.Tally) {
          window.Tally.loadEmbeds();
        }
      };
      document.body.appendChild(script);
    } else if (typeof window !== 'undefined' && window.Tally) {
      window.Tally.loadEmbeds();
    }
  }, []);

  return (
    <div
      className="modal-overlay"
      id="enquiry-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
    >
      <div
        className="modal-content"
        id="enquiry-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: '2rem 1.5rem 1.5rem',
          borderRadius: '6px'
        }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close enquiry modal"
          id="enquiry-modal-close-btn"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E50914', marginBottom: '8px' }}>
          <MessageSquareQuote size={18} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Blush Boutique Concierge
          </span>
        </div>

        <h2
          id="enquiry-modal-title"
          style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: '2rem',
            marginBottom: '0.5rem',
            color: 'var(--color-near-black)',
            lineHeight: 1.2
          }}
        >
          Customer Enquiry
        </h2>

        <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-text)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Have a question about our collections, sizing assistance, or custom occasion wear? Please fill out the enquiry form below and our Pune studio team will get back to you.
        </p>

        {/* Embedded Tally Form */}
        <div
          style={{
            width: '100%',
            minHeight: '480px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}
        >
          <iframe
            data-tally-src="https://tally.so/r/0V7J2N"
            src="https://tally.so/r/0V7J2N"
            width="100%"
            height="520"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
            title="Blush Customer Enquiry"
            style={{
              border: 'none',
              width: '100%',
              height: '520px',
              minHeight: '480px',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
};

