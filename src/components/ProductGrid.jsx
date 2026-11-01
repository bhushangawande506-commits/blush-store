import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, RotateCcw, Sparkles, ArrowUpDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterBottomSheet } from './FilterBottomSheet';

export const ProductGrid = ({
  products,
  selectedCategory,
  setSelectedCategory,
  onSelectProduct,
  title = "Shop All Designs",
  subtitle = "Explore our complete curated boutique collection.",
  filterMode = "all", // 'all' | 'new_arrivals' | 'best_sellers'
  onClearFilterMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [sortBy, setSortBy] = useState(
    filterMode === 'new_arrivals' ? 'newest' : 'featured'
  );
  const [maxPrice, setMaxPrice] = useState(6000);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sheetInitialTab, setSheetInitialTab] = useState('filters');

  // Desktop Filter Panel States & Ref
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftSize, setDraftSize] = useState(selectedSize);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);
  const desktopFilterRef = useRef(null);

  const pricePresets = [
    { label: 'All (₹6,000)', value: 6000 },
    { label: 'Under ₹3,500', value: 3500 },
    { label: 'Under ₹2,500', value: 2500 }
  ];

  // Active filters count for desktop filter badge
  const desktopActiveFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedSize !== 'ALL' ? 1 : 0) +
    (maxPrice < 6000 ? 1 : 0);

  // Sync draft states whenever desktop filter panel opens
  useEffect(() => {
    if (isDesktopFilterOpen) {
      setDraftCategory(selectedCategory);
      setDraftSize(selectedSize);
      setDraftMaxPrice(maxPrice);
    }
  }, [isDesktopFilterOpen, selectedCategory, selectedSize, maxPrice]);

  // Click outside and Escape key handler for desktop filter panel
  useEffect(() => {
    if (!isDesktopFilterOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDesktopFilterOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (
        desktopFilterRef.current &&
        !desktopFilterRef.current.contains(e.target) &&
        !e.target.closest('#desktop-filter-toggle-btn')
      ) {
        setIsDesktopFilterOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopFilterOpen]);

  // Calculate live matching garments for desktop draft filters
  const desktopDraftMatchingCount = useMemo(() => {
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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchFab = item.fabric?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchFab) return false;
      }
      return true;
    }).length;
  }, [products, filterMode, draftCategory, draftSize, draftMaxPrice, searchQuery]);

  const handleApplyDesktopFilters = () => {
    if (draftCategory !== selectedCategory) {
      handleCategorySelect(draftCategory);
    }
    setSelectedSize(draftSize);
    setMaxPrice(draftMaxPrice);
    setIsDesktopFilterOpen(false);
  };

  const handleClearDesktopDrafts = () => {
    setDraftCategory('All');
    setDraftSize('ALL');
    setDraftMaxPrice(6000);
  };

  const openMobileFilters = () => {
    setSheetInitialTab('filters');
    setIsFilterSheetOpen(true);
  };

  const openMobileSort = () => {
    setSheetInitialTab('sort');
    setIsFilterSheetOpen(true);
  };

  const activeMobileFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedSize !== 'ALL' ? 1 : 0) +
    (maxPrice < 6000 ? 1 : 0);

  const sortShortLabel = useMemo(() => {
    switch (sortBy) {
      case 'price_asc': return 'Price ↑';
      case 'price_desc': return 'Price ↓';
      case 'newest': return 'Newest';
      default: return 'Featured';
    }
  }, [sortBy]);

  const handleApplyMobileFilters = ({ category, size, maxPrice: newMaxPrice, sortBy: newSortBy }) => {
    if (category !== selectedCategory) {
      handleCategorySelect(category);
    }
    setSelectedSize(size);
    setMaxPrice(newMaxPrice);
    setSortBy(newSortBy);
  };

  // Sync sortBy if filterMode changes
  useEffect(() => {
    if (filterMode === 'new_arrivals') {
      setSortBy('newest');
    } else if (filterMode === 'best_sellers') {
      setSortBy('featured');
    }
  }, [filterMode]);

  const categories = ['All', 'Dresses', 'Tops', 'Co-ord Sets', 'Skirts', 'Partywear'];
  const sizes = ['ALL', 'XS', 'S', 'M', 'L', 'XL'];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Filter mode (New Arrivals vs Best Sellers)
        if (filterMode === 'new_arrivals' && !item.is_new_arrival) {
          return false;
        }
        if (filterMode === 'best_sellers' && !item.is_featured) {
          return false;
        }

        // Category filter
        if (selectedCategory && selectedCategory !== 'All') {
          if (item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchFab = item.fabric?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchFab) return false;
        }

        // Size filter
        if (selectedSize !== 'ALL') {
          if (!item.sizes?.includes(selectedSize)) return false;
        }

        // Price filter
        if (item.price > maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
        // Default featured
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, selectedSize, maxPrice, sortBy, filterMode]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedSize('ALL');
    setMaxPrice(6000);
    setSortBy('featured');
    if (onClearFilterMode) onClearFilterMode();
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    // If selecting a specific category while in a specialized filter mode, clear the mode to show full category
    if (filterMode !== 'all' && onClearFilterMode) {
      onClearFilterMode();
    }
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery !== '' ||
    selectedSize !== 'ALL' ||
    maxPrice < 6000 ||
    filterMode !== 'all' ||
    (sortBy !== 'featured' && filterMode !== 'new_arrivals');

  const hasActiveDesktopFilters =
    selectedCategory !== 'All' ||
    selectedSize !== 'ALL' ||
    maxPrice < 6000 ||
    searchQuery !== '' ||
    filterMode !== 'all';

  // Dynamic heading & subtitle based on navigation filter
  let displayTitle = title;
  let displaySubtitle = subtitle;
  let displayEyebrow = "Boutique Catalogue";

  if (filterMode === 'new_arrivals') {
    displayEyebrow = "Latest Releases";
    displayTitle = "New Arrivals";
    displaySubtitle = "Recently introduced garments, seasonal silhouettes, and fresh boutique arrivals.";
  } else if (filterMode === 'best_sellers') {
    displayEyebrow = "Curated Favorites";
    displayTitle = "Best Sellers & Signature Edits";
    displaySubtitle = "Our most cherished western silhouettes, iconic occasionwear, and popular boutique cuts.";
  }

  return (
    <section className="section" id="product-grid-section">
      <div className="container">
        <div className="section-header">
          <p className="section-eyebrow">{displayEyebrow}</p>
          <h2 className="section-title">{displayTitle}</h2>
          <p className="section-desc">{displaySubtitle}</p>
        </div>

        {/* DESKTOP Controls Bar */}
        <div className="shop-controls-bar shop-controls-bar-desktop" id="shop-controls-bar">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <label htmlFor="catalogue-search-input" className="sr-only">
              Search catalogue garments
            </label>
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              className="search-input"
              id="catalogue-search-input"
              placeholder="Search garments, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search catalogue garments"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-inline-btn"
                id="desktop-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Desktop Right Controls: Filter Toggle Button + Sort Selector */}
          <div className="desktop-controls-right">
            <button
              type="button"
              className={`desktop-filter-btn ${isDesktopFilterOpen ? 'active' : ''} ${desktopActiveFilterCount > 0 ? 'has-active' : ''}`}
              id="desktop-filter-toggle-btn"
              onClick={() => setIsDesktopFilterOpen((prev) => !prev)}
              aria-expanded={isDesktopFilterOpen}
              aria-controls="desktop-filter-panel"
              aria-label={`Filter boutique garments${desktopActiveFilterCount > 0 ? `, ${desktopActiveFilterCount} active` : ''}`}
            >
              <SlidersHorizontal size={15} />
              <span>Filter</span>
              {desktopActiveFilterCount > 0 && (
                <span className="desktop-filter-badge" id="desktop-filter-badge-count">
                  {desktopActiveFilterCount}
                </span>
              )}
              {isDesktopFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            <div className="desktop-sort-wrapper">
              <label htmlFor="catalogue-sort-select" className="sr-only">
                Sort boutique garments
              </label>
              <select
                className="sort-select"
                id="catalogue-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort boutique garments"
              >
                <option value="featured">Sort: Featured First</option>
                <option value="newest">Sort: Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* DESKTOP Active Filter Chips Bar */}
        {hasActiveDesktopFilters && (
          <div className="desktop-active-chips-bar" id="desktop-active-filter-chips">
            <span className="active-chips-label">Active Filters:</span>
            <div className="active-chips-list">
              {selectedCategory !== 'All' && (
                <span className="active-filter-chip" id="chip-active-category">
                  Category: <strong>{selectedCategory}</strong>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    id="chip-remove-category"
                    onClick={() => handleCategorySelect('All')}
                    aria-label={`Remove category filter ${selectedCategory}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedSize !== 'ALL' && (
                <span className="active-filter-chip" id="chip-active-size">
                  Size: <strong>{selectedSize}</strong>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    id="chip-remove-size"
                    onClick={() => setSelectedSize('ALL')}
                    aria-label={`Remove size filter ${selectedSize}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {maxPrice < 6000 && (
                <span className="active-filter-chip" id="chip-active-price">
                  Price: <strong>≤ ₹{maxPrice.toLocaleString('en-IN')}</strong>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    id="chip-remove-price"
                    onClick={() => setMaxPrice(6000)}
                    aria-label="Remove price filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="active-filter-chip" id="chip-active-search">
                  Search: <strong>"{searchQuery}"</strong>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    id="chip-remove-search"
                    onClick={() => setSearchQuery('')}
                    aria-label="Remove search filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {filterMode !== 'all' && (
                <span className="active-filter-chip active-filter-chip-mode" id="chip-active-mode">
                  Collection: <strong>{filterMode === 'new_arrivals' ? 'New Arrivals' : 'Best Sellers'}</strong>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    id="chip-remove-mode"
                    onClick={() => {
                      if (onClearFilterMode) onClearFilterMode();
                    }}
                    aria-label="Clear collection filter mode"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                className="clear-all-chips-btn"
                id="clear-all-filters-btn"
                onClick={resetFilters}
                aria-label="Clear all active filters"
              >
                <RotateCcw size={12} />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP Expandable Filter Panel */}
        {isDesktopFilterOpen && (
          <div
            className="desktop-filter-panel"
            id="desktop-filter-panel"
            ref={desktopFilterRef}
            role="region"
            aria-label="Desktop filter options"
          >
            <div className="desktop-filter-panel-header">
              <h3 className="desktop-filter-panel-title">Filter Boutique Collection</h3>
              <button
                type="button"
                className="desktop-filter-close-btn"
                id="desktop-filter-panel-close-btn"
                onClick={() => setIsDesktopFilterOpen(false)}
                aria-label="Close desktop filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="desktop-filter-grid">
              {/* Column 1: Category */}
              <div className="desktop-filter-col">
                <h4 className="desktop-filter-col-title">Category</h4>
                <div className="desktop-pill-group" id="category-filter-pills">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-pill ${draftCategory === cat ? 'active' : ''}`}
                      id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setDraftCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Price Range */}
              <div className="desktop-filter-col">
                <div className="desktop-filter-col-header">
                  <h4 className="desktop-filter-col-title">Price Range</h4>
                  <span className="desktop-filter-price-value">
                    Up to ₹{draftMaxPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="desktop-price-slider-box">
                  <input
                    type="range"
                    min="1000"
                    max="6000"
                    step="100"
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(Number(e.target.value))}
                    className="desktop-price-slider"
                    id="desktop-price-range-slider"
                    aria-label="Filter by maximum garment price"
                  />
                  <div className="desktop-slider-labels">
                    <span>₹1,000</span>
                    <span>₹6,000</span>
                  </div>
                </div>

                <div className="desktop-price-presets">
                  {pricePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`price-preset-pill ${draftMaxPrice === preset.value ? 'active' : ''}`}
                      id={`desktop-price-preset-${preset.value}`}
                      onClick={() => setDraftMaxPrice(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: Garment Size */}
              <div className="desktop-filter-col">
                <h4 className="desktop-filter-col-title">Garment Size</h4>
                <div className="desktop-pill-group" id="size-filter-pills">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`filter-pill ${draftSize === sz ? 'active' : ''}`}
                      id={`filter-size-${sz.toLowerCase()}`}
                      onClick={() => setDraftSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <p className="desktop-filter-hint">
                  Sizes reflect Pune boutique in-store & bespoke inventory.
                </p>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="desktop-filter-panel-footer">
              <div className="desktop-draft-feedback">
                <span>Matching: <strong>{desktopDraftMatchingCount}</strong> boutique garments</span>
                {(draftCategory !== 'All' || draftSize !== 'ALL' || draftMaxPrice < 6000) && (
                  <span className="desktop-draft-active-hint">
                    • {draftCategory !== 'All' ? draftCategory : ''}
                    {draftSize !== 'ALL' ? ` · Size ${draftSize}` : ''}
                    {draftMaxPrice < 6000 ? ` · ≤₹${draftMaxPrice}` : ''}
                  </span>
                )}
              </div>

              <div className="desktop-filter-footer-actions">
                <button
                  type="button"
                  className="desktop-filter-clear-btn"
                  id="desktop-filter-clear-btn"
                  onClick={handleClearDesktopDrafts}
                  disabled={draftCategory === 'All' && draftSize === 'ALL' && draftMaxPrice === 6000}
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  className="desktop-filter-apply-btn"
                  id="desktop-filter-apply-btn"
                  onClick={handleApplyDesktopFilters}
                >
                  Apply Filters ({desktopDraftMatchingCount})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE Compact Filter & Sort Bar (TASK 3) */}
        <div className="shop-controls-bar-mobile" id="mobile-shop-controls-bar">
          {/* Compact Mobile Search Input */}
          <div className="mobile-search-wrapper">
            <label htmlFor="mobile-catalogue-search-input" className="sr-only">
              Search boutique garments
            </label>
            <Search size={16} className="mobile-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="mobile-search-input"
              id="mobile-catalogue-search-input"
              placeholder="Search garments, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search boutique garments"
            />
            {searchQuery && (
              <button
                type="button"
                className="mobile-search-clear-btn"
                id="mobile-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Row: Filter button, Sort button, Quick Reset */}
          <div className="mobile-controls-action-row">
            <button
              type="button"
              className={`mobile-action-pill ${activeMobileFilterCount > 0 ? 'active' : ''}`}
              id="mobile-filter-open-btn"
              onClick={openMobileFilters}
              aria-label={`Open filters${activeMobileFilterCount > 0 ? `, ${activeMobileFilterCount} active` : ''}`}
            >
              <SlidersHorizontal size={15} />
              <span>Filter</span>
              {activeMobileFilterCount > 0 && (
                <span className="mobile-pill-badge" id="mobile-filter-badge-count">
                  {activeMobileFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`mobile-action-pill ${sortBy !== 'featured' ? 'active' : ''}`}
              id="mobile-sort-open-btn"
              onClick={openMobileSort}
              aria-label={`Open sort options, currently ${sortShortLabel}`}
            >
              <ArrowUpDown size={15} />
              <span>Sort: {sortShortLabel}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="mobile-action-pill mobile-reset-pill"
                id="mobile-quick-clear-btn"
                onClick={resetFilters}
                title="Reset all filters"
                aria-label="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--color-secondary-grey)',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <span>
            Showing <strong>{filteredProducts.length}</strong> of {products.length} distinctive garments
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedCategory !== 'All' && (
              <span>Category: <strong>{selectedCategory}</strong></span>
            )}
            {filterMode !== 'all' && (
              <span style={{ color: 'var(--color-brand-red)', fontWeight: '600' }}>
                Filter: {filterMode === 'new_arrivals' ? 'New Arrivals' : 'Best Sellers'}
              </span>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="product-grid" id="main-product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              backgroundColor: 'var(--color-soft-cream)',
              borderRadius: '4px'
            }}
            id="empty-product-state"
          >
            <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              No garments matched your filter
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              We could not find any products matching your current criteria. Try resetting filters to explore all boutique designs.
            </p>
            <button className="btn-primary" onClick={resetFilters}>
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter & Sort Bottom Sheet (TASK 3) */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        products={products}
        filterMode={filterMode}
        currentCategory={selectedCategory}
        currentSize={selectedSize}
        currentMaxPrice={maxPrice}
        currentSortBy={sortBy}
        initialTab={sheetInitialTab}
        onApply={handleApplyMobileFilters}
      />
    </section>
  );
};
