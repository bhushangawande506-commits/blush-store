import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, Check, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const FilterBottomSheet = ({
  isOpen,
  onClose,
  products = [],
  filterMode = 'all',
  currentCategory = 'All',
  currentSize = 'ALL',
  currentMaxPrice = 6000,
  currentSortBy = 'featured',
  initialTab = 'filters', // 'filters' | 'sort'
  onApply
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [draftCategory, setDraftCategory] = useState(currentCategory);
  const [draftSize, setDraftSize] = useState(currentSize);
  const [draftMaxPrice, setDraftMaxPrice] = useState(currentMaxPrice);
  const [draftSortBy, setDraftSortBy] = useState(currentSortBy);

  const categories = ['All', 'Dresses', 'Tops', 'Co-ord Sets', 'Skirts', 'Partywear'];
  const sizes = ['ALL', 'XS', 'S', 'M', 'L', 'XL'];
  const sortOptions = [
    { id: 'featured', label: 'Featured First (Recommended)' },
    { id: 'newest', label: 'Newest Arrivals' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' }
  ];

  const pricePresets = [
    { label: 'All (₹6,000)', value: 6000 },
    { label: 'Under ₹3,500', value: 3500 },
    { label: 'Under ₹2,500', value: 2500 }
  ];

  // Sync draft states whenever bottom sheet opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setDraftCategory(currentCategory);
      setDraftSize(currentSize);
      setDraftMaxPrice(currentMaxPrice);
      setDraftSortBy(currentSortBy);
      setActiveTab(initialTab);
    }
  }, [isOpen, currentCategory, currentSize, currentMaxPrice, currentSortBy, initialTab]);

  // Lock body scroll on mount
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Live count of matching garments according to current draft filters
  const matchingCount = useMemo(() => {
    return products.filter((item) => {
      if (filterMode === 'new_arrivals' && !item.is_new_arrival) return false;
      if (filterMode === 'best_sellers' && !item.is_featured) return false;
      if (draftCategory !== 'All' && item.category.toLowerCase() !== draftCategory.toLowerCase()) {
        return false;
      }
      if (draftSize !== 'ALL' && !item.sizes?.includes(draftSize)) {
        return false;
      }
      if (item.price > draftMaxPrice) {
        return false;
      }
      return true;
    }).length;
  }, [products, filterMode, draftCategory, draftSize, draftMaxPrice]);

  const draftFilterBadge =
    (draftCategory !== 'All' ? 1 : 0) +
    (draftSize !== 'ALL' ? 1 : 0) +
    (draftMaxPrice < 6000 ? 1 : 0);

  const handleResetDrafts = () => {
    setDraftCategory('All');
    setDraftSize('ALL');
    setDraftMaxPrice(6000);
    setDraftSortBy('featured');
  };

  const handleApply = () => {
    onApply({
      category: draftCategory,
      size: draftSize,
      maxPrice: draftMaxPrice,
      sortBy: draftSortBy
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="filter-sheet-overlay"
      id="mobile-filter-sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Filter and Sort Boutique Garments"
    >
      <div
        className="filter-sheet-panel"
        id="mobile-filter-sheet-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle drag handle */}
        <div className="filter-sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="filter-sheet-header">
          <div>
            <h3 className="filter-sheet-title">Filter & Sort</h3>
            <p className="filter-sheet-subtitle">
              {matchingCount} {matchingCount === 1 ? 'garment' : 'garments'} available
            </p>
          </div>
          <button
            type="button"
            className="filter-sheet-close"
            id="mobile-filter-sheet-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="filter-sheet-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'filters'}
            className={`filter-sheet-tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
            id="mobile-tab-filters"
            onClick={() => setActiveTab('filters')}
          >
            <SlidersHorizontal size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Filters {draftFilterBadge > 0 ? `(${draftFilterBadge})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sort'}
            className={`filter-sheet-tab-btn ${activeTab === 'sort' ? 'active' : ''}`}
            id="mobile-tab-sort"
            onClick={() => setActiveTab('sort')}
          >
            <ArrowUpDown size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Sort By
          </button>
        </div>

        {/* Body Content */}
        <div className="filter-sheet-body" id="mobile-filter-sheet-body">
          {activeTab === 'filters' && (
            <>
              {/* Category Filter */}
              <div className="filter-sheet-section">
                <div className="filter-section-title">
                  <span>Category</span>
                  {draftCategory !== 'All' && (
                    <span className="filter-active-indicator">{draftCategory}</span>
                  )}
                </div>
                <div className="filter-pill-grid">
                  {categories.map((cat) => {
                    const isActive = draftCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        id={`mobile-category-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`filter-sheet-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setDraftCategory(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-sheet-section">
                <div className="filter-section-title">
                  <span>Maximum Price</span>
                  <span className="filter-price-highlight">
                    Up to ₹{draftMaxPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="filter-price-slider-box">
                  <input
                    type="range"
                    id="mobile-price-range-slider"
                    min={1000}
                    max={6000}
                    step={100}
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(Number(e.target.value))}
                    className="mobile-price-slider"
                    aria-label="Filter garments by maximum price"
                  />
                  <div className="filter-price-range-labels">
                    <span>Min: ₹1,390</span>
                    <span>Max: ₹6,000</span>
                  </div>
                </div>

                {/* Quick Price Shortcuts */}
                <div className="filter-price-presets">
                  {pricePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`filter-preset-pill ${draftMaxPrice === preset.value ? 'active' : ''}`}
                      onClick={() => setDraftMaxPrice(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="filter-sheet-section">
                <div className="filter-section-title">
                  <span>Size</span>
                  {draftSize !== 'ALL' && (
                    <span className="filter-active-indicator">{draftSize}</span>
                  )}
                </div>
                <div className="filter-pill-grid">
                  {sizes.map((sz) => {
                    const isActive = draftSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        id={`mobile-size-pill-${sz.toLowerCase()}`}
                        className={`filter-sheet-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setDraftSize(sz)}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'sort' && (
            <div className="filter-sheet-section">
              <div className="filter-section-title">
                <span>Select Sorting Order</span>
              </div>
              <div className="filter-sort-list">
                {sortOptions.map((opt) => {
                  const isSelected = draftSortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`mobile-sort-option-${opt.id}`}
                      className={`filter-sort-option ${isSelected ? 'active' : ''}`}
                      onClick={() => setDraftSortBy(opt.id)}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={18} className="sort-check-icon" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="filter-sheet-footer">
          <button
            type="button"
            className="filter-sheet-clear-btn"
            id="mobile-filter-clear-btn"
            onClick={handleResetDrafts}
          >
            <RotateCcw size={14} /> Clear All
          </button>
          <button
            type="button"
            className="filter-sheet-apply-btn"
            id="mobile-filter-apply-btn"
            onClick={handleApply}
          >
            Apply Filters ({matchingCount})
          </button>
        </div>
      </div>
    </div>
  );
};
