import React from 'react';
import { MapPin, Calendar, CheckCircle2, Phone } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export const AboutSection = () => {
  return (
    <section className="about-section" id="about-boutique-section">
      <div className="container">
        <div className="about-grid">
          <div>
            <p className="section-eyebrow">The Boutique Story</p>
            <h2 className="section-title">
              Crafting Contemporary Women's Fashion Since 2014
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
              Founded in 2014 in Pune, Maharashtra, <strong>Blush</strong> is an independent women's
              fashion boutique dedicated to contemporary western silhouettes, elegant occasionwear,
              and versatile wardrobe foundations.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-secondary-grey)' }}>
              Over more than a decade, Blush has earned a loyal clientele through personalized styling,
              carefully selected fabrics, and high standards of fit. From effortless day dresses and
              breathable linen co-ord sets to showstopping eveningwear, every design is selected to
              empower modern women with grace and self-expression.
            </p>

            <div className="about-features-list">
              <div className="about-feature-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-red)', marginBottom: '4px' }}>
                  <Calendar size={18} />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Established 2014</span>
                </div>
                <h4>Pune Heritage</h4>
                <p>Over a decade of trusted fashion curations in Pune, Maharashtra.</p>
              </div>

              <div className="about-feature-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-red)', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Curated Quality</span>
                </div>
                <h4>Distinct Silhouettes</h4>
                <p>Occasionwear, dresses, tops, and coordinated sets tailored to perfection.</p>
              </div>
            </div>
          </div>

          <div>
            <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img
                src="/images/Golden-Hour Mediterranean Terrace Portrait.png"
                alt="Blush Boutique Fashion Pune"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                loading="lazy"
              />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(23, 23, 23, 0.08)' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-brand-red)', marginBottom: '2px' }}>
                  Boutique Location
                </p>
                <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-near-black)' }}>
                  Pune, Maharashtra, India
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-secondary-grey)' }}>
                  Direct Phone: {BRAND_INFO.formattedPhone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
