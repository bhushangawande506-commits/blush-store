import React from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export const InstagramSection = () => {
  const socialImages = [
    { src: '/images/Airy Floral Dress Portrait.webp', caption: 'Floral tiers in bloom' },
    { src: '/images/burgundy_blazer_set_1793149498559.webp', caption: 'Sartorial burgundy power suit' },
    { src: '/images/Sunlit Ivory Sundress in a Mediterranean Courtyard.webp', caption: 'Antique ivory broderie anglaise' },
    { src: '/images/pastel_blue_set_1793149586294.webp', caption: 'Powder blue linen set' },
    { src: '/images/pink_satin_blouse_1793149441010.webp', caption: 'Liquid draped blush satin' },
    { src: '/images/Elegant Black Dress in a Sunlit Interior.webp', caption: 'The sculpted black midi' }
  ];

  return (
    <section className="section" id="instagram-community-section" style={{ backgroundColor: 'var(--color-warm-white)' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <p className="section-eyebrow">Connect With Us</p>
          <h2 className="section-title">Follow @blushpune</h2>
          <p className="section-desc">
            Explore daily style lookbooks, behind-the-scenes fitting sessions, and new collection drops.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-dark"
              id="instagram-profile-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <InstagramIcon size={16} /> Follow on Instagram <ExternalLink size={14} />
            </a>
            <a
              href={`${BRAND_INFO.whatsappUrl}?text=${encodeURIComponent("Hello Blush, I would like to enquire about your boutique collection.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              id="whatsapp-chat-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageCircle size={16} /> WhatsApp Enquiries
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
          {socialImages.map((img, idx) => (
            <a
              key={idx}
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-soft-cream)',
                display: 'block'
              }}
              title={`View ${img.caption} on Instagram`}
            >
              <img
                src={img.src}
                alt={img.caption}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
