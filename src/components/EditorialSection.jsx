import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const EditorialSection = ({ onExplore }) => {
  return (
    <section className="editorial-section" id="editorial-showcase-section">
      <div className="container">
        <div className="editorial-layout">
          {/* Editorial Image Frame */}
          <div className="editorial-image-frame">
            <img
              src="/images/Burgundy Elegance by Candlelight.png"
              alt="Blush Evening Elegance"
              loading="lazy"
            />
          </div>

          {/* Editorial Copy */}
          <div className="editorial-content">
            <p className="section-eyebrow" style={{ color: '#E50914' }}>
              The Evening Edit • Autumn / Festive 2026
            </p>
            <h2>
              Sensual Drapes & Sculptural Eveningwear
            </h2>
            <p>
              Each Blush creation is designed around movement, silhouette, and tactile luxury.
              From rich burgundy chiffon cascade gowns to tailored co-ords and minimalist ponte midi dresses,
              our occasionwear brings timeless elegance to dinners, receptions, and golden-hour celebrations.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                id="editorial-explore-btn"
                onClick={onExplore}
              >
                Shop The Evening Edit <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
