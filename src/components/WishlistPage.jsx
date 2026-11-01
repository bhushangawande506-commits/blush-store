import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, X, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';

export const WishlistPage = ({
  allProducts = [],
  onSelectProduct,
  onContinueShopping
}) => {
  const { wishlist, removeFromWishlist, clearWishlist, moveToBag } = useCart();

  // Find all product objects corresponding to IDs saved in the wishlist
  const wishlistProducts = wishlist
    .map(id => allProducts.find(p => String(p.id) === String(id)))
    .filter(Boolean);

  // Recommendations: 4 featured products not currently in the wishlist
  const recommendations = allProducts
    .filter(p => !wishlist.some(id => String(id) === String(p.id)))
    .slice(0, 4);

  return (
    <div className="wishlist-page-root" id="wishlist-page">
      {/* Breadcrumb Navigation */}
      <div className="pdp-breadcrumb-bar">
        <div className="container">
          <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={onContinueShopping}
              className="breadcrumb-link"
              id="wishlist-breadcrumb-shop"
            >
              Catalogue
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">My Wishlist</span>
          </nav>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4.5rem' }}>
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <p className="section-eyebrow">Curated Selection</p>
          <h1 className="section-title">My Wishlist</h1>
          <p className="section-desc">
            Review your saved boutique silhouettes, choose your preferred sizes, and transfer them directly to your shopping bag.
          </p>
        </div>

        {/* Wishlist Header Meta & Controls */}
        {wishlistProducts.length > 0 && (
          <div className="wishlist-meta-bar" id="wishlist-meta-bar">
            <div className="wishlist-count-label">
              <span>
                Showing <strong>{wishlistProducts.length}</strong> {wishlistProducts.length === 1 ? 'saved garment' : 'saved garments'}
              </span>
            </div>

            <div className="wishlist-actions-right">
              <button
                type="button"
                className="wishlist-clear-all-btn"
                id="wishlist-clear-all-btn"
                onClick={clearWishlist}
                title="Remove all items from wishlist"
              >
                <Trash2 size={14} /> Clear Wishlist
              </button>
              <button
                type="button"
                className="btn-outline-dark wishlist-continue-btn"
                onClick={onContinueShopping}
              >
                Continue Shopping <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* POPULATED STATE: Responsive Wishlist Grid */}
        {wishlistProducts.length > 0 ? (
          <div className="wishlist-grid" id="wishlist-grid">
            {wishlistProducts.map((product) => (
              <WishlistItemCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onRemove={() => removeFromWishlist(product.id)}
                onMoveToBag={(sz) => moveToBag(product, sz, 1)}
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="wishlist-empty-box" id="wishlist-empty-state">
            <div className="wishlist-empty-icon" aria-hidden="true">
              <Heart size={40} strokeWidth={1.3} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', marginBottom: '0.65rem' }}>
              Your Wishlist is Empty
            </h2>
            <p style={{ maxWidth: '440px', margin: '0 auto 1.75rem', color: 'var(--color-secondary-grey)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              You haven't saved any garments yet. Explore our curated western cuts, partywear, and signature evening dresses to begin your boutique collection.
            </p>

            <button
              type="button"
              className="btn-primary"
              id="wishlist-empty-continue-btn"
              onClick={onContinueShopping}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 2rem' }}
            >
              <ShoppingBag size={16} /> Explore Catalogue
            </button>
          </div>
        )}

        {/* CURATED RECOMMENDATIONS (Visible when empty or under items) */}
        {recommendations.length > 0 && (
          <div className="wishlist-recommendations-section" style={{ marginTop: '4.5rem' }}>
            <div className="section-header" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
              <p className="section-eyebrow">Curated For You</p>
              <h3 className="section-title" style={{ fontSize: '2rem' }}>
                You May Also Cherish
              </h3>
            </div>

            <div className="product-grid" id="wishlist-recommendations-grid">
              {recommendations.map((rec) => (
                <ProductCard
                  key={rec.id}
                  product={rec}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual Wishlist Card
const WishlistItemCard = ({ product, onSelectProduct, onRemove, onMoveToBag }) => {
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L'];
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || 'S');

  const mainImage = product.images?.[0] || '/images/hero/hero-poster.webp';
  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleCardClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <article className="wishlist-card" id={`wishlist-card-${product.id}`}>
      {/* Media Container with Click to PDP */}
      <a
        href={`/product/${product.slug || product.id}`}
        className="wishlist-card-media"
        onClick={handleCardClick}
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={mainImage}
          alt={product.name}
          className="wishlist-card-img"
          loading="lazy"
        />

        {/* Badges */}
        {product.is_new_arrival && (
          <span className="product-badge badge-new">New</span>
        )}
        {!product.is_new_arrival && product.is_featured && (
          <span className="product-badge badge-featured">Featured</span>
        )}

        {/* Remove from Wishlist Button */}
        <button
          type="button"
          className="wishlist-remove-btn"
          id={`wishlist-remove-${product.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          title="Remove from wishlist"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <X size={16} />
        </button>
      </a>

      {/* Card Body */}
      <div className="wishlist-card-body">
        <div>
          <span className="product-category-label">{product.category}</span>
          <h3 className="product-title" style={{ fontSize: '0.92rem', marginBottom: '0.35rem' }}>
            <a
              href={`/product/${product.slug || product.id}`}
              onClick={handleCardClick}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {product.name}
            </a>
          </h3>

          <div className="product-price-row" style={{ alignItems: 'baseline', gap: '8px' }}>
            <span className="current-price" style={{ fontSize: '1rem', fontWeight: '700' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="compare-price" style={{ fontSize: '0.82rem' }}>
                  ₹{product.compare_at_price.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#0E7B3B', fontWeight: '700' }}>
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </div>

        {/* Size Selection Row */}
        <div className="wishlist-size-picker">
          <div className="wishlist-size-label">
            <span>Size:</span>
            <strong>{selectedSize}</strong>
          </div>
          <div className="wishlist-size-options">
            {availableSizes.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`wishlist-size-pill ${selectedSize === sz ? 'active' : ''}`}
                id={`wishlist-size-${product.id}-${sz.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(sz);
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA: Move to Bag */}
        <button
          type="button"
          className="btn-primary wishlist-move-bag-btn"
          id={`wishlist-move-to-bag-${product.id}`}
          onClick={() => onMoveToBag(selectedSize)}
        >
          <ShoppingBag size={14} /> Move to Bag
        </button>
      </div>
    </article>
  );
};

