import React from 'react';
import { X, ShieldAlert, Truck, RotateCcw, HelpCircle, FileText, Lock } from 'lucide-react';

export const PolicyModal = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const content = {
    shipping: {
      title: 'Shipping & Delivery Policy',
      icon: <Truck size={20} />,
      body: (
        <div>
          <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '700' }}>Notice:</span> Standard courier delivery operates across India. Boutique claims regarding Pune same-day express delivery and international worldwide shipments are currently subject to operational verification.
          </div>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>Pan-India Delivery Timelines</h4>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            All orders placed on Blush are processed and dispatched from Pune within 24 to 48 hours.
            Metro cities typically receive shipments within 3 to 5 business days; other regions take 5 to 7 business days.
          </p>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>Shipping Rates</h4>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Complimentary Standard Shipping is provided for all prepaid orders above ₹2,499.
            For orders below this threshold, a flat ₹150 shipping fee applies.
          </p>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>Order Tracking</h4>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
            Once dispatched, a tracking number and courier link are shared via SMS/Email and through our verified WhatsApp concierge.
          </p>
        </div>
      )
    },
    returns: {
      title: 'Returns & Exchanges Policy',
      icon: <RotateCcw size={20} />,
      body: (
        <div>
          <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '700' }}>Notice:</span> Sizing exchange guidelines requiring final boutique confirmation before launch.
          </div>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>7-Day Exchange Assistance</h4>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            We want you to love your Blush purchase. If a garment does not fit as expected, we offer a 7-day size exchange from the date of delivery.
          </p>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>Eligibility Conditions</h4>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            <li>Garments must be unworn, unwashed, and in original condition with all boutique tags intact.</li>
            <li>Customized, altered, or clearance pieces are not eligible for exchange.</li>
            <li>Proof of purchase (Order reference number) is required.</li>
          </ul>
          <h4 style={{ fontWeight: '700', marginTop: '1rem', marginBottom: '0.25rem' }}>Initiating an Exchange</h4>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
            Contact our WhatsApp concierge at 9503917333 with your order ID and the new requested size.
          </p>
        </div>
      )
    },
    faq: {
      title: 'Frequently Asked Questions',
      icon: <HelpCircle size={20} />,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>Where is Blush boutique located?</h4>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              Blush is based in Pune, Maharashtra, India, and was established in 2014.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>How can I order via WhatsApp?</h4>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              You can click any "Order on WhatsApp" button on a product page or contact us directly at 9503917333. Our team will verify size availability and assist with your order.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>What payment methods are supported?</h4>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              We support secure online payments via Razorpay (UPI, Google Pay, PhonePe, Paytm, Debit/Credit Cards, and NetBanking).
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>Are product colors accurate?</h4>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              We photograph all garments in natural light to preserve fabric texture and tone. Subtle differences may occur depending on screen calibration.
            </p>
          </div>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: <Lock size={20} />,
      body: (
        <div>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Blush is committed to protecting your personal information. When you place an order, we collect your name, email, phone number, and delivery address solely for the purpose of order fulfilment and client communication.
          </p>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            We do not sell, rent, or trade your personal data with third parties. Online payment transactions are securely handled by our PCI-DSS compliant payment gateway (Razorpay). We never view or store raw credit or debit card numbers on our servers.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText size={20} />,
      body: (
        <div>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Welcome to Blush. By accessing this website and placing an order, you agree to comply with our boutique purchase and sizing policies.
          </p>
          <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            All product specifications, prices, and fabric descriptions are listed in Indian Rupees (INR) and are subject to availability. Blush reserves the right to decline or cancel orders in cases of pricing discrepancies or insufficient inventory.
          </p>
        </div>
      )
    }
  };

  const selectedPolicy = content[policyType] || content.shipping;

  return (
    <div className="modal-overlay" onClick={onClose} id="policy-modal-overlay">
      <div
        className="modal-content"
        id="policy-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close policy">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-red)', marginBottom: '8px' }}>
          {selectedPolicy.icon}
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Blush Boutique Policy
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', marginBottom: '1.25rem' }}>
          {selectedPolicy.title}
        </h2>

        {selectedPolicy.body}
      </div>
    </div>
  );
};
