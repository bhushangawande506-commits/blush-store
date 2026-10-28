import React, { useState } from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Ruler, Truck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';

export const ProductDetailModal = ({ product, onClose, onSelectRelated, onOpenSizeGuide, onBuyNowDirect }) => {
  if (!product) return null;

  const { addToCart, wishlist, toggleWishlist, showToast } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'S');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const isWishlisted = wishlist.includes(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [BRAND_INFO.heroPoster];
  const activeImage = images[selectedImageIndex] || images[0];

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please choose your size');
      return;
    }
    addToCart(product, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      showToast('Please choose your size');
      return;
    }
    addToCart(product, selectedSize, quantity);
    onClose();
    onBuyNowDirect();
  };

  // WhatsApp enquiry link
  const whatsappEnquiryText = encodeURIComponent(
    `Hello Blush Boutique, I would like to enquire about: "${product.name}" in Size ${selectedSize}. (Product ID: ${product.id}). Is this available for delivery in Pune / Pan-India?`
  );
  const whatsappUrl = `${BRAND_INFO.whatsappUrl}?text=${whatsappEnquiryText}`;

  return (
    <div className="modal-overlay" onClick={onClose} id="pdp-modal-overlay">
      <div
        className="modal-content"
        id={`pdp-modal-${product.id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px' }}
      >
        <button
          className="modal-close-btn"
          id="close-pdp-modal-btn"
          onClick={onClose}
          aria-label="Close product details"
        >
          <X size={20} />
        </button>

        <div className="pdp-grid">
          {/* Gallery Column */}
          <div>
            <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
              <img
                src={activeImage}
                alt={product.name}
                className="pdp-gallery-main"
                id="pdp-main-image"
              />
              {product.is_new_arrival && (
                <span className="product-badge badge-new">New Arrival</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="pdp-thumbs" id="pdp-thumbnails-list">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className={`pdp-thumb-img ${selectedImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-brand-red)', fontWeight: '600', marginBottom: '4px' }}>
              {product.category}
            </span>

            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.2rem', lineHeight: 1.15, marginBottom: '0.75rem' }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-near-black)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compare_at_price && (
                <span style={{ fontSize: '1.1rem', color: 'var(--color-secondary-grey)', textDecoration: 'line-through' }}>
                  ₹{product.compare_at_price.toLocaleString('en-IN')}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-soft-cream)', padding: '2px 8px', borderRadius: '2px', color: '#0E7B3B', fontWeight: '600' }}>
                Inclusive of all taxes
              </span>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--color-secondary-grey)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            {/* Size Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  Select Size: <strong>{selectedSize}</strong>
                </span>
                <button
                  onClick={onOpenSizeGuide}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--color-brand-red)', textDecoration: 'underline' }}
                >
                  <Ruler size={13} /> Size Guide
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(product.sizes || ['XS', 'S', 'M', 'L']).map((sz) => (
                  <button
                    key={sz}
                    className={`size-pill-btn ${selectedSize === sz ? 'active' : ''}`}
                    id={`pdp-size-${sz}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                  -
                </button>
                <span style={{ padding: '0 8px', fontWeight: '600', minWidth: '28px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: product.stock < 5 ? '#E50914' : '#0E7B3B' }}>
                {product.stock < 5 ? `Only ${product.stock} pieces left in stock!` : 'In Stock & Ready to Dispatch'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                id="pdp-add-to-cart-btn"
                style={{ flex: 1, minWidth: '160px' }}
                onClick={handleAddToCart}
              >
                <ShoppingBag size={16} /> Add to Bag
              </button>

              <button
                className="btn-outline-dark"
                id="pdp-buy-now-btn"
                style={{ flex: 1, minWidth: '140px' }}
                onClick={handleBuyNow}
              >
                Buy Now
              </button>

              <button
                className={`action-btn ${isWishlisted ? 'active' : ''}`}
                onClick={() => toggleWishlist(product.id)}
                style={{ border: '1px solid var(--color-border)', width: '48px', height: '48px', borderRadius: '2px' }}
                title="Wishlist"
              >
                <Heart size={20} fill={isWishlisted ? '#E50914' : 'none'} color={isWishlisted ? '#E50914' : '#171717'} />
              </button>
            </div>

            {/* Direct WhatsApp Ordering */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              id="pdp-whatsapp-enquiry-btn"
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              <MessageCircle size={18} /> Direct WhatsApp Boutique Order
            </a>

            {/* Product Meta Accordions / Info */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ color: 'var(--color-near-black)' }}>Fabric:</strong>
                  <p>{product.fabric || 'Premium Silk-Touch Crepe'}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-near-black)' }}>Care:</strong>
                  <p>{product.care || 'Dry clean or gentle hand wash cold'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--color-secondary-grey)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={14} style={{ color: 'var(--color-brand-red)' }} /> Free Express Delivery across India on orders above ₹2,499
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} style={{ color: 'var(--color-brand-red)' }} /> Hassle-free 7-day exchange assistance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
