import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export const SearchModal = ({
  allProducts = [],
  onClose,
  onSelectProduct,
  onSelectCategory
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Popular search / category quick tags
  const POPULAR_TAGS = ['Dresses', 'Tops', 'Co-ord Sets', 'Partywear', 'Skirts', 'Silk'];

  // Lock body scroll and focus input on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, []);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean and multi-word search matching across name, category, fabric, description, and colors
  const cleanQuery = query.trim().toLowerCase();
  const queryWords = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

  const matchingProducts = useMemo(() => {
    if (!cleanQuery) return [];
    return allProducts.filter((product) => {
      const searchPool = [
        product.name || '',
        product.category || '',
        product.description || '',
        product.fabric || '',
        (product.colors || []).join(' ')
      ].join(' ').toLowerCase();

      return queryWords.every((word) => searchPool.includes(word));
    });
  }, [allProducts, cleanQuery]);

  // Trending / Featured recommendations when input is empty
  const trendingProducts = useMemo(() => {
    return allProducts.filter((p) => p.is_featured).slice(0, 3);
  }, [allProducts]);

  const handleProductClick = (product) => {
    onSelectProduct(product);
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      className="search-modal-overlay"
      id="search-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search Storefront"
    >
      <div
        className="search-modal-panel"
        id="search-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="search-input-header">
          <div className="search-input-inner">
            <Search size={20} className="search-icon-decor" aria-hidden="true" />
            <label htmlFor="header-search-modal-input" className="sr-only">
              Search boutique garments
            </label>
            <input
              ref={inputRef}
              type="text"
              id="header-search-modal-input"
              className="search-modal-input"
              placeholder="Search dresses, tops, partywear, fabrics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-label="Search boutique garments"
            />
            {query.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                id="search-clear-query-btn"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear search input"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="search-modal-close-btn"
            id="close-search-modal-btn"
            onClick={onClose}
            aria-label="Close search overlay"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Body Content */}
        <div className="search-modal-body" id="search-modal-body">
          {/* STATE 1: MATCHING RESULTS */}
          {cleanQuery && matchingProducts.length > 0 && (
            <div className="search-results-container">
              <div className="search-section-heading">
                <span>Matching Garments ({matchingProducts.length})</span>
                <span className="search-heading-hint">Click to view details</span>
              </div>

              <div className="search-results-list" role="list">
                {matchingProducts.map((product) => {
                  const mainImage = product.images?.[0] || '/images/hero/hero-poster.webp';
                  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
                  const discountPercent = hasDiscount
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : 0;

                  return (
                    <article
                      key={product.id}
                      className="search-result-item"
                      id={`search-result-${product.id}`}
                      onClick={() => handleProductClick(product)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleProductClick(product);
                        }
                      }}
                    >
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="search-result-thumb"
                        loading="lazy"
                      />

                      <div className="search-result-info">
                        <span className="search-result-cat">{product.category}</span>
                        <h4 className="search-result-title">{product.name}</h4>
                        <div className="search-result-price-row">
                          <span className="search-result-price">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="search-result-compare">
                                ₹{product.compare_at_price.toLocaleString('en-IN')}
                              </span>
                              <span className="search-result-discount">
                                {discountPercent}% OFF
                              </span>
                            </>
                          )}
                          {product.is_new_arrival && (
                            <span className="search-result-badge">New</span>
                          )}
                        </div>
                      </div>

                      <div className="search-result-arrow" aria-hidden="true">
                        <ArrowRight size={16} />
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* View all in catalogue button */}
              {onSelectCategory && (
                <div className="search-view-all-wrapper">
                  <button
                    type="button"
                    className="btn-outline-dark search-view-all-btn"
                    onClick={() => {
                      onSelectCategory('All');
                      onClose();
                    }}
                  >
                    Explore Complete Catalogue ({allProducts.length} Garments) <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: EMPTY RESULTS (NO MATCHES) */}
          {cleanQuery && matchingProducts.length === 0 && (
            <div className="search-empty-state" id="search-no-results">
              <div className="search-empty-icon" aria-hidden="true">
                <Search size={32} strokeWidth={1.5} />
              </div>
              <h3 className="search-empty-title">
                No garments found for "{query}"
              </h3>
              <p className="search-empty-desc">
                We couldn't find any designs matching your search. Try checking your spelling or explore our popular boutique collections.
              </p>

              <div className="search-popular-tags">
                <span className="search-tags-label">Popular Categories:</span>
                <div className="search-tags-list">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="search-tag-pill"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: INITIAL / EMPTY INPUT (TRENDING & DISCOVERY) */}
          {!cleanQuery && (
            <div className="search-initial-state" id="search-initial-discovery">
              {/* Quick Category Suggestions */}
              <div className="search-popular-tags">
                <span className="search-tags-label">
                  <Sparkles size={14} style={{ color: 'var(--color-brand-red)' }} />
                  <span>Popular Searches:</span>
                </span>
                <div className="search-tags-list">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="search-tag-pill"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Products Preview */}
              {trendingProducts.length > 0 && (
                <div className="search-trending-section">
                  <div className="search-section-heading">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={15} style={{ color: 'var(--color-brand-red)' }} />
                      <span>Trending in Pune Boutique</span>
                    </span>
                  </div>

                  <div className="search-results-list">
                    {trendingProducts.map((product) => {
                      const mainImage = product.images?.[0] || '/images/hero/hero-poster.webp';
                      return (
                        <article
                          key={product.id}
                          className="search-result-item"
                          onClick={() => handleProductClick(product)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleProductClick(product);
                            }
                          }}
                        >
                          <img
                            src={mainImage}
                            alt={product.name}
                            className="search-result-thumb"
                            loading="lazy"
                          />
                          <div className="search-result-info">
                            <span className="search-result-cat">{product.category}</span>
                            <h4 className="search-result-title">{product.name}</h4>
                            <div className="search-result-price-row">
                              <span className="search-result-price">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                              <span className="search-result-badge">Featured</span>
                            </div>
                          </div>
                          <div className="search-result-arrow" aria-hidden="true">
                            <ArrowRight size={16} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

