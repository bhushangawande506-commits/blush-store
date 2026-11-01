import React from 'react';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { wishlist, toggleWishlist, addToCart, isInWishlist } = useCart();
  const isWishlisted = isInWishlist ? isInWishlist(product.id) : wishlist.some(id => String(id) === String(product.id));

  const mainImage = product.images?.[0] || '/images/hero/hero-poster.webp';
  const productUrl = `/product/${product.slug || product.id}`;

  const handleCardClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // Allow opening in new tab
    e.preventDefault();
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <div className="product-card" id={`product-card-${product.id}`}>
      {/* Product Image Frame */}
      <a
        href={productUrl}
        className="product-image-container"
        onClick={handleCardClick}
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={mainImage}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          decoding="async"
          width="400"
          height="533"
        />

        {/* Badges */}
        {product.is_new_arrival && (
          <span className="product-badge badge-new">New</span>
        )}
        {!product.is_new_arrival && product.is_featured && (
          <span className="product-badge badge-featured">Featured</span>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={16}
            fill={isWishlisted ? '#E50914' : 'none'}
            color={isWishlisted ? '#E50914' : '#171717'}
          />
        </button>

        {/* Quick Add Sizes on Hover */}
        <div
          className="quick-add-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <span style={{ color: '#fff', fontSize: '0.68rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quick Add Size:
          </span>
          <div className="quick-size-list">
            {(product.sizes || ['XS', 'S', 'M', 'L']).map((sz) => (
              <button
                key={sz}
                type="button"
                className="quick-size-btn"
                id={`quick-add-${product.id}-${sz}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, sz, 1);
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </a>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category-label">{product.category}</span>
        <h3 className="product-title" id={`product-title-${product.id}`}>
          <a
            href={productUrl}
            onClick={handleCardClick}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {product.name}
          </a>
        </h3>

        <div className="product-price-row">
          <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
          {product.compare_at_price && (
            <span className="compare-price">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  );
};
