import React from 'react';
import { BRAND_INFO, CATEGORIES } from '../data/products';
import { Phone, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';

const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export const Footer = ({ onSelectCategory, onOpenPolicy }) => {
  return (
    <footer className="footer" id="main-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand Info & Logo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
              <img
                src={BRAND_INFO.logo}
                alt="Blush"
                className="footer-brand-logo"
                id="footer-brand-logo"
              />
              <div>
                <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', color: '#fff', lineHeight: 1 }}>
                  Blush
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Pune • Est. 2014
                </span>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem', maxWidth: '340px' }}>
              Contemporary women's fashion boutique offering curated dresses, western wear,
              partywear, and coordinated sets designed for memorable occasions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'rgba(255, 255, 255, 0.85)' }}>
                <MapPin size={16} style={{ color: '#E50914', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: '1.45', maxWidth: '320px' }}>
                  Shop. No-5, Liberty -2, North Main Road,<br /> Koregaon Park, Pune, India, 411001
                </span>
              </div>
              <a
                href={`tel:${BRAND_INFO.phone}`}
                id="footer-contact-phone"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.85)' }}
              >
                <Phone size={16} style={{ color: '#E50914', flexShrink: 0 }} />
                <span>Direct Contact: {BRAND_INFO.formattedPhone}</span>
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="footer-title">Collections</h4>
            <ul className="footer-links">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    className="footer-link"
                    id={`footer-category-${cat.id}`}
                    onClick={() => onSelectCategory(cat.name)}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  className="footer-link"
                  onClick={() => onSelectCategory('All')}
                >
                  Shop All Designs
                </button>
              </li>
            </ul>
          </div>

          {/* Boutique Policies */}
          <div>
            <h4 className="footer-title">Client Care</h4>
            <ul className="footer-links">
              <li>
                <button
                  className="footer-link"
                  id="footer-policy-shipping"
                  onClick={() => onOpenPolicy('shipping')}
                >
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button
                  className="footer-link"
                  id="footer-policy-returns"
                  onClick={() => onOpenPolicy('returns')}
                >
                  Returns & Exchanges
                </button>
              </li>
              <li>
                <button
                  className="footer-link"
                  id="footer-policy-faq"
                  onClick={() => onOpenPolicy('faq')}
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  className="footer-link"
                  id="footer-policy-privacy"
                  onClick={() => onOpenPolicy('privacy')}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  className="footer-link"
                  id="footer-policy-terms"
                  onClick={() => onOpenPolicy('terms')}
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Connect & Newsletter */}
          <div>
            <h4 className="footer-title">Concierge & Orders</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              Prefer to order via WhatsApp or discuss custom sizing? Our boutique stylists are at your service.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={`${BRAND_INFO.whatsappUrl}?text=${encodeURIComponent("Hello Blush, I would like to place an order.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                style={{ fontSize: '0.8rem', padding: '0.65rem 1rem', width: 'fit-content' }}
              >
                <MessageCircle size={15} /> Order on WhatsApp
              </a>

              <a
                href={BRAND_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="footer-instagram-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.85rem',
                  marginTop: '0.5rem'
                }}
              >
                <InstagramIcon size={16} /> @blushpune
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Blush. All rights reserved. Registered Boutique in Pune, Maharashtra.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} style={{ color: '#22c55e' }} /> Secure Razorpay Verified Checkout
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
