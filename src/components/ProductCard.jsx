import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const isWishlisted = wishlist.includes(product.id);

  const mainImage = product.images?.[0] || '/images/hero/hero-poster.png';
  const hasMultipleImages = product.images?.length > 1;
  const hoverImage = hasMultipleImages ? product.images[1] : mainImage;

  return (
    <div className="product-card" id={`product-card-${product.id}`}>
      {/* Product Image Frame */}
      <div
        className="product-image-container"
        onClick={() => onSelectProduct(product)}
      >
        <img
          src={mainImage}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
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
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} fill={isWishlisted ? '#E50914' : 'none'} color={isWishlisted ? '#E50914' : '#171717'} />
        </button>

        {/* Quick Add Sizes on Hover */}
        <div className="quick-add-overlay" onClick={(e) => e.stopPropagation()}>
          <span style={{ color: '#fff', fontSize: '0.68rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quick Add Size:
          </span>
          <div className="quick-size-list">
            {(product.sizes || ['XS', 'S', 'M', 'L']).map((sz) => (
              <button
                key={sz}
                className="quick-size-btn"
                id={`quick-add-${product.id}-${sz}`}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, sz, 1);
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category-label">{product.category}</span>
        <h3
          className="product-title"
          id={`product-title-${product.id}`}
          onClick={() => onSelectProduct(product)}
        >
          {product.name}
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
