import React, { useState } from 'react';
import { ShoppingBag, Search, Heart, Menu, X, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';

export const Header = ({
  currentView,
  selectedCategory,
  filterMode = 'all',
  onNavigate,
  onOpenSearch
}) => {
  const { totalItemsCount, setIsCartOpen, wishlist } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact 5 primary navigation destinations as specified:
  // HOME | SHOP ALL | NEW ARRIVALS | BEST SELLERS | ABOUT
  const navItems = [
    { label: 'Home', view: 'home', id: 'home', path: '/' },
    { label: 'Shop All', view: 'shop', category: 'All', filterMode: 'all', id: 'shop-all', path: '/shop' },
    { label: 'New Arrivals', view: 'shop', category: 'All', filterMode: 'new_arrivals', id: 'new-arrivals', path: '/shop?filter=new-arrivals' },
    { label: 'Best Sellers', view: 'shop', category: 'All', filterMode: 'best_sellers', id: 'best-sellers', path: '/shop?filter=best-sellers' },
    { label: 'About', view: 'about', id: 'about', path: '/about' }
  ];

  const handleItemClick = (item) => {
    setMobileMenuOpen(false);
    onNavigate(item);
  };

  const isItemActive = (item) => {
    if (currentView === 'home' && item.id === 'home') return true;
    if (currentView === 'about' && item.id === 'about') return true;
    if (currentView === 'shop') {
      if (filterMode === 'new_arrivals' && item.id === 'new-arrivals') return true;
      if (filterMode === 'best_sellers' && item.id === 'best-sellers') return true;
      if (filterMode === 'all' && item.id === 'shop-all') return true;
    }
    return false;
  };

  return (
    <>
      <header className="header" id="main-header" role="banner">
        <div className="container">
          <div className="header-inner">
            {/* Mobile Hamburger Button */}
            <button
              className="action-btn hamburger-btn"
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <Menu size={24} />
            </button>

            {/* Brand Logo & Wordmark */}
            <a
              href="/"
              className="header-brand"
              id="header-brand-logo-link"
              onClick={(e) => {
                e.preventDefault();
                handleItemClick(navItems[0]); // Home
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

            {/* Desktop Navigation: HOME | SHOP ALL | NEW ARRIVALS | BEST SELLERS | ABOUT */}
            <nav className="nav-desktop" aria-label="Main Navigation">
              <ul className="nav-links-desktop">
                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <li key={item.id}>
                      <button
                        className={`nav-link ${active ? 'active' : ''}`}
                        id={`nav-link-${item.id}`}
                        onClick={() => handleItemClick(item)}
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
                  handleItemClick({ view: 'shop', category: 'All', filterMode: 'all', path: '/shop' });
                  setTimeout(() => {
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }, 100);
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
        <div
          className="cart-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div
            className="cart-drawer"
            id="mobile-navigation-drawer"
            style={{
              left: 0,
              right: 'auto',
              animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
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

            <div className="cart-body" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100% - 75px)' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <li key={item.id}>
                      <button
                        id={`mobile-nav-${item.id}`}
                        onClick={() => handleItemClick(item)}
                        style={{
                          fontFamily: 'var(--font-editorial)',
                          fontSize: '1.45rem',
                          fontWeight: active ? '600' : '400',
                          color: active ? 'var(--color-brand-red)' : 'var(--color-near-black)',
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.25rem 0'
                        }}
                      >
                        <span>{item.label}</span>
                        {active && (
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-brand-red)', letterSpacing: '0.1em' }}>
                            • Active
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                  Boutique Concierge & Orders:
                </p>
                <a
                  href={`tel:${BRAND_INFO.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--color-near-black)',
                    fontWeight: '500'
                  }}
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
