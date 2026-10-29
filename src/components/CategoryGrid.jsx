import React from 'react';
import { CATEGORIES } from '../data/products';
import { ArrowRight } from 'lucide-react';

// Flowing organic wave SVG paths matching the editorial boutique reference
const WAVE_PATHS = [
  "M 0 40 L 0 10 C 70 10, 130 35, 200 35 L 200 40 Z", // Dresses: High left to low right
  "M 0 40 L 0 34 C 70 34, 130 12, 200 12 L 200 40 Z", // Tops: Low left to high right
  "M 0 40 L 0 12 C 60 12, 140 34, 200 34 L 200 40 Z", // Co-ord Sets: High left to low right
  "M 0 40 L 0 32 C 80 32, 120 14, 200 14 L 200 40 Z", // Skirts: Low left to high right
  "M 0 40 L 0 12 C 70 12, 130 32, 200 32 L 200 40 Z"  // Partywear: High left to low right
];

export const CategoryGrid = ({ onSelectCategory }) => {
  return (
    <section className="section" id="categories-section">
      <div className="container">
        <div className="section-header">
          <p className="section-eyebrow">Explore Collections</p>
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-desc">
            Explore curated western silhouettes tailored for contemporary ease and evening glam.
          </p>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((cat, index) => {
            const wavePath = WAVE_PATHS[index % WAVE_PATHS.length];
            return (
              <div
                key={cat.id}
                className="category-card"
                id={`category-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectCategory(cat.name);
                  }
                }}
              >
                <div className="category-card-media">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className={`category-card-img category-card-img-${cat.id}`}
                    loading="lazy"
                  />
                </div>

                <div className="category-card-footer">
                  <svg
                    className="category-card-curve"
                    viewBox="0 0 200 40"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d={wavePath} />
                  </svg>

                  <div className="category-card-footer-content">
                    <div className="category-card-info">
                      <h3 className="category-card-title">{cat.name}</h3>
                      <span className="category-card-count">{cat.count} Designs</span>
                    </div>
                    <div className="category-card-arrow" aria-hidden="true">
                      <ArrowRight size={18} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
