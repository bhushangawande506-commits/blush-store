import React from 'react';
import { CATEGORIES } from '../data/products';
import { ArrowUpRight } from 'lucide-react';

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
          {CATEGORIES.map((cat) => (
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
              <img
                src={cat.image}
                alt={cat.name}
                className="category-card-img"
                loading="lazy"
              />
              <div className="category-card-overlay">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="category-card-title">{cat.name}</h3>
                  <ArrowUpRight size={18} style={{ opacity: 0.85 }} />
                </div>
                <span className="category-card-count">{cat.count} Designs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
