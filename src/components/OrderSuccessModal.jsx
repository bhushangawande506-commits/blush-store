import React from 'react';
import { CheckCircle2, ShoppingBag, MessageCircle, ArrowRight, Printer } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export const OrderSuccessModal = ({ orderId, orderDetails, onClose, onContinueShopping }) => {
  const whatsappUrl = `${BRAND_INFO.whatsappUrl}?text=${encodeURIComponent(
    `Hello Blush Boutique, I have placed Order #${orderId}. Please update me on tracking and dispatch status.`
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose} id="order-success-modal-overlay">
      <div
        className="modal-content"
        id="order-success-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', textAlign: 'center', padding: '3rem 2rem' }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}
        >
          <CheckCircle2 size={42} />
        </div>

        <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-brand-red)', fontWeight: '700', marginBottom: '0.5rem' }}>
          Payment Successful & Confirmed
        </p>

        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.4rem', marginBottom: '0.75rem' }}>
          Thank You for Shopping with Blush
        </h2>

        <p style={{ color: 'var(--color-secondary-grey)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
          Your order has been recorded in our boutique database and is being prepared for dispatch.
        </p>

        {/* Order Details Card */}
        <div style={{ backgroundColor: 'var(--color-soft-cream)', padding: '1.25rem', borderRadius: '4px', textAlign: 'left', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary-grey)' }}>Order Reference:</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-near-black)' }}>#{orderId}</strong>
          </div>

          {orderDetails?.customerName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-secondary-grey)' }}>Client:</span>
              <span>{orderDetails.customerName}</span>
            </div>
          )}

          {orderDetails?.address && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-secondary-grey)' }}>Deliver To:</span>
              <span style={{ maxWidth: '65%', textAlign: 'right' }}>{orderDetails.address}</span>
            </div>
          )}

          {orderDetails?.paymentId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-secondary-grey)' }}>Payment ID:</span>
              <span style={{ fontFamily: 'monospace' }}>{orderDetails.paymentId}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)', fontWeight: '700' }}>
            <span>Amount Paid:</span>
            <span>₹{(orderDetails?.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            id="success-continue-shopping-btn"
            onClick={onContinueShopping}
          >
            Continue Shopping <ArrowRight size={16} />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            id="success-track-whatsapp-btn"
          >
            <MessageCircle size={16} /> Track on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
