import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  Ruler,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  Check,
  ArrowLeft,
  Share2,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';
import { getProductDemoReviews } from '../data/demoReviews';
import { ProductCard } from './ProductCard';

export const ProductDetailPage = ({
  product,
  allProducts = [],
  onNavigateToProduct,
  onOpenSizeGuide,
  onOpenCheckout,
  onOpenPolicy,
  onBackToShop
}) => {
  const { addToCart, wishlist, toggleWishlist, showToast, isInWishlist } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Reset variant selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedSize(product.sizes?.[0] || 'S');
      setSelectedColor(product.colors?.[0] || '');
      setQuantity(1);
      setPincodeResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="section container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', marginBottom: '1rem' }}>
          Garment Not Found
        </h2>
        <p style={{ maxWidth: '480px', marginBottom: '2rem', color: 'var(--color-secondary-grey)' }}>
          The piece you are looking for may have been archived or belongs to an earlier collection. Explore our complete boutique collection.
        </p>
        <button className="btn-primary" onClick={onBackToShop}>
          <ArrowLeft size={16} /> Return to Shop All
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist ? isInWishlist(product.id) : wishlist.some(id => String(id) === String(product.id));
  const images = product.images && product.images.length > 0 ? product.images : [BRAND_INFO.heroPoster];
  const activeImage = images[selectedImageIndex] || images[0];

  // Demo reviews calculations
  const reviewData = getProductDemoReviews(product.id);

  // Related products from same category, excluding current product
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Discount calculation if compare_at_price is present
  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please choose your size');
      const sizeSelector = document.getElementById('pdp-size-selector');
      if (sizeSelector) {
        sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sizeSelector.classList.add('pdp-size-highlight');
        setTimeout(() => {
          sizeSelector.classList.remove('pdp-size-highlight');
        }, 1800);
      }
      return;
    }
    const success = addToCart(product, selectedSize, quantity);
    if (success) {
      showToast(`Added to Bag: ${product.name} (${selectedSize})`);
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      showToast('Please choose your size');
      return;
    }
    addToCart(product, selectedSize, quantity);
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  // Direct WhatsApp boutique order link
  const whatsappOrderText = encodeURIComponent(
    `Hello Blush Boutique, I would like to order: "${product.name}" in Size ${selectedSize}${
      selectedColor ? ` (${selectedColor})` : ''
    }. (Product ID: ${product.id}, Price: ₹${product.price}). Please assist with availability and dispatch.`
  );
  const whatsappUrl = `${BRAND_INFO.whatsappUrl}?text=${whatsappOrderText}`;

  // Copy share URL
  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — Blush Pune`,
          text: `Check out the ${product.name} at Blush Pune.`,
          url: currentUrl
        });
      } catch (e) {
        // user dismissed share sheet
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl);
      showToast('Product link copied to clipboard!');
    }
  };

  // Pincode validation and shipping estimates (No fake live tracking)
  const handleCheckPincode = (e) => {
    e.preventDefault();
    const cleanPin = pincode.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setPincodeResult({
        valid: false,
        message: 'Please enter a valid 6-digit Indian PIN code.'
      });
      return;
    }

    const isPunePin = cleanPin.startsWith('411');
    if (isPunePin) {
      setPincodeResult({
        valid: true,
        type: 'pune',
        title: 'Pune Express Boutique Delivery',
        estimate: 'Estimated delivery: 1–2 business days',
        fee: product.price >= 2499 ? 'Free Express Delivery' : 'Standard Shipping: ₹150',
        note: 'Dispatched directly from our studio in Pune.'
      });
    } else {
      setPincodeResult({
        valid: true,
        type: 'india',
        title: 'Pan-India Express Shipping',
        estimate: 'Estimated delivery: 3–5 business days',
        fee: product.price >= 2499 ? 'Free Express Delivery' : 'Standard Shipping: ₹150',
        note: 'Insured air courier dispatch within 24 hours of confirmation.'
      });
    }
  };

  // Image zoom handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="pdp-page-root" id={`product-page-${product.id}`}>
      {/* Breadcrumb Navigation */}
      <div className="pdp-breadcrumb-bar">
        <div className="container">
          <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
            <button onClick={onBackToShop} className="breadcrumb-link">
              Catalogue
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-link" onClick={onBackToShop}>
              {product.category}
            </span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* Main PDP Grid */}
        <div className="pdp-main-layout">
          {/* LEFT: Image Gallery */}
          <div className="pdp-gallery-column">
            {/* Main Stage Image with Zoom */}
            <div
              className={`pdp-main-image-frame ${isZoomed ? 'zoomed' : ''}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              id="pdp-gallery-main-frame"
            >
              <img
                src={activeImage}
                alt={product.name}
                className="pdp-hero-image"
                id="pdp-primary-image"
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: 'scale(1.75)'
                      }
                    : {}
                }
              />

              {product.is_new_arrival && (
                <span className="product-badge badge-new" style={{ top: '16px', left: '16px' }}>
                  New Arrival
                </span>
              )}
              {!product.is_new_arrival && product.is_featured && (
                <span className="product-badge badge-featured" style={{ top: '16px', left: '16px' }}>
                  Featured Edit
                </span>
              )}

              <span className="pdp-zoom-hint">
                <Sparkles size={12} /> Hover to zoom
              </span>
            </div>

            {/* Thumbnails Navigation (if multiple images available) */}
            {images.length > 1 && (
              <div className="pdp-thumbnails-strip" id="pdp-thumbnails-strip">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pdp-thumb-button ${selectedImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={imgUrl} alt={`${product.name} angle ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Purchase Actions */}
          <div className="pdp-details-column">
            {/* Category Eyebrow & Share */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="pdp-category-eyebrow">{product.category}</span>
              <button
                type="button"
                className="pdp-share-btn"
                onClick={handleShare}
                title="Share this garment"
                aria-label="Share product"
              >
                <Share2 size={16} /> <span>Share</span>
              </button>
            </div>

            {/* Product Title */}
            <h1 className="pdp-title" id="pdp-product-title">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="pdp-price-container">
              <span className="pdp-price" id="pdp-product-price">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="pdp-compare-price">
                    ₹{product.compare_at_price.toLocaleString('en-IN')}
                  </span>
                  <span className="pdp-discount-tag">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
              <span className="pdp-tax-note">Inclusive of all taxes</span>
            </div>

            {/* Star Rating Summary */}
            <div className="pdp-rating-summary">
              <div className="pdp-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={star <= Math.round(reviewData.averageRating) ? '#E50914' : 'none'}
                    color={star <= Math.round(reviewData.averageRating) ? '#E50914' : '#D1D5DB'}
                  />
                ))}
              </div>
              <span className="pdp-rating-text">
                <strong>{reviewData.averageRating}</strong> ({reviewData.totalReviews} boutique reviews)
              </span>
            </div>

            {/* Description */}
            <p className="pdp-description">{product.description}</p>

            {/* Color Selection (if colors exist) */}
            {product.colors && product.colors.length > 0 && (
              <div className="pdp-variant-block">
                <div className="pdp-variant-label">
                  <span>Color:</span> <strong>{selectedColor || product.colors[0]}</strong>
                </div>
                <div className="pdp-color-options">
                  {product.colors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`pdp-color-pill ${selectedColor === col ? 'active' : ''}`}
                      onClick={() => setSelectedColor(col)}
                    >
                      <span className="pdp-color-dot" />
                      <span>{col}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="pdp-variant-block">
              <div className="pdp-variant-label-row">
                <div className="pdp-variant-label">
                  <span>Select Size:</span> <strong>{selectedSize}</strong>
                </div>
                {onOpenSizeGuide && (
                  <button
                    type="button"
                    className="pdp-size-guide-btn"
                    onClick={onOpenSizeGuide}
                  >
                    <Ruler size={13} /> Size Guide
                  </button>
                )}
              </div>

              <div className="pdp-size-options" id="pdp-size-selector">
                {(product.sizes || ['XS', 'S', 'M', 'L']).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`pdp-size-pill ${selectedSize === sz ? 'active' : ''}`}
                    id={`pdp-size-btn-${sz}`}
                    onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Stock Indicator */}
            <div className="pdp-quantity-row">
              <div className="pdp-qty-control">
                <span className="pdp-qty-label">Quantity:</span>
                <div className="pdp-qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    id="pdp-qty-minus"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-value" id="pdp-qty-display">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    id="pdp-qty-plus"
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pdp-stock-status">
                {product.stock <= 4 ? (
                  <span className="stock-low">
                    Only {product.stock} pieces remaining in Pune boutique!
                  </span>
                ) : (
                  <span className="stock-ok">
                    <Check size={14} /> In Stock & Ready to Dispatch
                  </span>
                )}
              </div>
            </div>

            {/* Primary Purchase Buttons */}
            <div className="pdp-action-buttons">
              <button
                type="button"
                className="btn-primary pdp-add-cart-btn"
                id="pdp-add-to-bag-button"
                onClick={handleAddToCart}
              >
                <ShoppingBag size={18} /> Add to Bag
              </button>

              <button
                type="button"
                className="btn-outline-dark pdp-buy-now-btn"
                id="pdp-buy-now-button"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>

              <button
                type="button"
                className={`pdp-wishlist-toggle ${isWishlisted ? 'active' : ''}`}
                id="pdp-wishlist-toggle-button"
                onClick={() => toggleWishlist(product.id)}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? '#E50914' : 'none'}
                  color={isWishlisted ? '#E50914' : '#171717'}
                />
              </button>
            </div>

            {/* Direct WhatsApp Ordering */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp pdp-whatsapp-order-btn"
              id="pdp-whatsapp-direct-btn"
            >
              <MessageCircle size={18} /> Direct WhatsApp Boutique Order
            </a>

            {/* Delivery & Pincode Checker Section */}
            <div className="pdp-delivery-card">
              <div className="pdp-delivery-header">
                <Truck size={18} style={{ color: 'var(--color-brand-red)' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Delivery & Availability Check</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
                    Enter your PIN code to view delivery timeline from Pune.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckPincode} className="pdp-pincode-form">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  className="pdp-pincode-input"
                  id="pdp-pincode-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
                <button type="submit" className="pdp-pincode-submit" id="pdp-pincode-submit">
                  Check
                </button>
              </form>

              {pincodeResult && (
                <div
                  className={`pdp-pincode-response ${pincodeResult.valid ? 'success' : 'error'}`}
                  id="pdp-pincode-result"
                >
                  {pincodeResult.valid ? (
                    <div>
                      <p style={{ fontWeight: '600', color: 'var(--color-near-black)', marginBottom: '2px' }}>
                        {pincodeResult.title}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#0E7B3B', fontWeight: '500' }}>
                        {pincodeResult.estimate} • {pincodeResult.fee}
                      </p>
                      <p style={{ fontSize: '0.74rem', color: 'var(--color-secondary-grey)', marginTop: '2px' }}>
                        {pincodeResult.note}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: '#B91C1C' }}>{pincodeResult.message}</p>
                  )}
                </div>
              )}

              <div className="pdp-delivery-perks">
                <div className="pdp-perk-item">
                  <Check size={13} style={{ color: '#0E7B3B' }} />
                  <span>Complimentary shipping on orders above ₹2,499</span>
                </div>
                <div className="pdp-perk-item">
                  <RotateCcw size={13} style={{ color: 'var(--color-brand-red)' }} />
                  <span>Hassle-free 7-day boutique exchange assistance</span>
                </div>
                <div className="pdp-perk-item">
                  <ShieldCheck size={13} style={{ color: 'var(--color-near-black)' }} />
                  <span>100% Authentic boutique design crafted in Pune</span>
                </div>
              </div>
            </div>

            {/* Fabric, Care & Specifications */}
            <div className="pdp-spec-box">
              <div className="spec-row">
                <span className="spec-key">Fabric Composition:</span>
                <span className="spec-value">{product.fabric || '100% Premium Silk-Crepe'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Garment Care:</span>
                <span className="spec-value">{product.care || 'Dry clean or delicate hand wash cold.'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Origin:</span>
                <span className="spec-value">Blush Boutique, Pune, Maharashtra (Est. 2014)</span>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS & RATINGS SECTION (Change 6: Demo Reviews clearly identified) */}
        <section className="pdp-reviews-section" id="pdp-reviews-section">
          <div className="pdp-reviews-header">
            <div>
              <p className="section-eyebrow">Customer Feedback</p>
              <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem' }}>
                Boutique Reviews & Ratings
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-secondary-grey)', marginTop: '4px' }}>
                {reviewData.disclaimer}
              </p>
            </div>

            {/* Overall Score Box */}
            <div className="pdp-reviews-score-card">
              <span className="pdp-score-number">{reviewData.averageRating}</span>
              <div className="pdp-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= Math.round(reviewData.averageRating) ? '#E50914' : 'none'}
                    color={star <= Math.round(reviewData.averageRating) ? '#E50914' : '#D1D5DB'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
                Based on {reviewData.totalReviews} displayed preview ratings
              </span>
            </div>
          </div>

          {/* Individual Review Cards */}
          <div className="pdp-review-cards-grid">
            {reviewData.reviews.map((rev) => (
              <div key={rev.id} className="pdp-review-card">
                <div className="pdp-review-card-top">
                  <div className="pdp-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        fill={star <= rev.rating ? '#E50914' : 'none'}
                        color={star <= rev.rating ? '#E50914' : '#D1D5DB'}
                      />
                    ))}
                  </div>
                  <span className="pdp-review-date">{rev.date}</span>
                </div>

                <h4 className="pdp-review-title">{rev.title}</h4>
                <p className="pdp-review-comment">{rev.comment}</p>

                <div className="pdp-review-author-row">
                  <span className="pdp-review-author-name">{rev.author}</span>
                  <span className="pdp-review-author-location">• {rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related-section" id="pdp-related-products-section">
            <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <p className="section-eyebrow">Complete The Look</p>
              <h3 className="section-title" style={{ fontSize: '2.1rem' }}>
                More From {product.category}
              </h3>
            </div>

            <div className="product-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onSelectProduct={onNavigateToProduct}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Add to Bag Bar (TASK 4) */}
      <div
        className="pdp-mobile-sticky-bar"
        id="pdp-mobile-sticky-bar"
        role="region"
        aria-label="Quick Add to Bag"
      >
        <div className="pdp-sticky-bar-content">
          <div
            className="pdp-sticky-bar-info"
            onClick={() => {
              const sizeSelector = document.getElementById('pdp-size-selector');
              if (sizeSelector) {
                sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                sizeSelector.classList.add('pdp-size-highlight');
                setTimeout(() => sizeSelector.classList.remove('pdp-size-highlight'), 1800);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="pdp-sticky-price-row">
              <span className="pdp-sticky-price" id="pdp-sticky-price">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="pdp-sticky-compare">
                  ₹{product.compare_at_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="pdp-sticky-size-indicator" id="pdp-sticky-size-indicator">
              {selectedSize ? (
                <span>
                  Size: <strong>{selectedSize}</strong> <span style={{ fontSize: '0.68rem', textDecoration: 'underline', marginLeft: '3px' }}>Change</span>
                </span>
              ) : (
                <span className="pdp-sticky-no-size">Select Size</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary pdp-sticky-add-btn"
            id="pdp-sticky-add-to-bag-button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to Bag`}
          >
            <ShoppingBag size={16} />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
};

