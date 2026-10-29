import React, { useState, useMemo, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';

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

        {/* Filters and Search Bar */}
        <div className="shop-controls-bar" id="shop-controls-bar">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              id="catalogue-search-input"
              placeholder="Search dresses, tops, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Pills (Full access to all categories) */}
          <div className="category-filter-pills" id="category-filter-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Size Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary-grey)' }}>Size:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {sizes.map((sz) => (
                <button
                  key={sz}
                  className={`filter-pill ${selectedSize === sz ? 'active' : ''}`}
                  id={`filter-size-${sz.toLowerCase()}`}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                  onClick={() => setSelectedSize(sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="sort-select"
              id="catalogue-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Sort: Featured First</option>
              <option value="newest">Sort: Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {hasActiveFilters && (
              <button
                className="filter-pill"
                id="clear-all-filters-btn"
                onClick={resetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  borderColor: '#FECACA'
                }}
              >
                <RotateCcw size={12} /> Clear Filters
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
    </section>
  );
};
