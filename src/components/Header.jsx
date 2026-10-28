import React, { useState } from 'react';
import { ShoppingBag, Search, Heart, Menu, X, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';

export const Header = ({ currentView, setCurrentView, selectedCategory, setSelectedCategory, onOpenSearch }) => {
  const { totalItemsCount, setIsCartOpen, wishlist } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', view: 'home' },
    { label: 'Shop All', view: 'shop', category: 'All' },
    { label: 'Dresses', view: 'shop', category: 'Dresses' },
    { label: 'Tops', view: 'shop', category: 'Tops' },
    { label: 'Co-ord Sets', view: 'shop', category: 'Co-ord Sets' },
    { label: 'Skirts', view: 'shop', category: 'Skirts' },
    { label: 'Partywear', view: 'shop', category: 'Partywear' },
    { label: 'About', view: 'about' }
  ];

  const handleNavClick = (item) => {
    setCurrentView(item.view);
    if (item.category) {
      setSelectedCategory(item.category);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="header" id="main-header">
        <div className="container">
          <div className="header-inner">
            {/* Mobile Hamburger Button */}
            <button
              className="action-btn hamburger-btn"
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
            >
              <Menu size={24} />
            </button>

            {/* Brand Logo & Wordmark */}
            <a
              href="#home"
              className="header-brand"
              id="header-brand-logo-link"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img
                src={BRAND_INFO.logo}
                alt="Blush Logo"
                className="brand-logo-img"
                id="header-brand-logo-img"
              />
              <div className="brand-wordmark">
                <span className="brand-title">Blush</span>
                <span className="brand-tagline">Pune • Est. 2014</span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="nav-desktop" aria-label="Main Navigation">
              <ul className="nav-links-desktop">
                {navItems.map((item) => {
                  const isActive =
                    currentView === item.view &&
                    (!item.category || selectedCategory === item.category);

                  return (
                    <li key={item.label}>
                      <button
                        className={`nav-link ${isActive ? 'active' : ''}`}
                        id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleNavClick(item)}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Header Action Icons */}
            <div className="header-actions">
              {/* Search Icon */}
              <button
                className="action-btn"
                id="header-search-btn"
                onClick={onOpenSearch}
                title="Search products"
                aria-label="Search products"
              >
                <Search size={20} />
              </button>

              {/* Wishlist Icon */}
              <button
                className="action-btn"
                id="header-wishlist-btn"
                onClick={() => {
                  setCurrentView('shop');
                  window.scrollTo({ top: 500, behavior: 'smooth' });
                }}
                title="Saved Wishlist"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="badge-count" id="wishlist-badge-count">{wishlist.length}</span>
                )}
              </button>

              {/* Shopping Bag Icon */}
              <button
                className="action-btn"
                id="header-cart-btn"
                onClick={() => setIsCartOpen(true)}
                title="Shopping Bag"
                aria-label="Shopping Bag"
              >
                <ShoppingBag size={20} />
                {totalItemsCount > 0 && (
                  <span className="badge-count" id="cart-badge-count">{totalItemsCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="cart-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="cart-drawer"
            id="mobile-navigation-drawer"
            style={{ left: 0, right: 'auto', animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={BRAND_INFO.logo}
                  alt="Blush"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem' }}>Blush</h3>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Pune • Est. 2014
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                id="close-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cart-body" style={{ padding: '2rem 1.5rem' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {navItems.map((item) => (
                  <li key={item.label}>
                    <button
                      id={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleNavClick(item)}
                      style={{
                        fontFamily: 'var(--font-editorial)',
                        fontSize: '1.5rem',
                        fontWeight: '500',
                        color: 'var(--color-near-black)',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                  Boutique Concierge & Orders:
                </p>
                <a
                  href={`tel:${BRAND_INFO.phone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-near-black)' }}
                >
                  <Phone size={16} /> {BRAND_INFO.formattedPhone}
                </a>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)', marginTop: '0.5rem' }}>
                  Pune, Maharashtra, India
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
