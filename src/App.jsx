import React, { useState, useEffect, useCallback } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroVideo } from './components/HeroVideo';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductGrid } from './components/ProductGrid';
import { EditorialSection } from './components/EditorialSection';
import { AboutSection } from './components/AboutSection';
import { InstagramSection } from './components/InstagramSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { PolicyModal } from './components/PolicyModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Toast } from './components/Toast';
import { WishlistPage } from './components/WishlistPage';
import { PRODUCTS as FALLBACK_PRODUCTS } from './data/products';

export function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);

  // URL parsing helper
  const parseCurrentLocation = useCallback(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);
    const filterParam = searchParams.get('filter');
    const categoryParam = searchParams.get('category');

    // 1. Check for /product/:slug (or ID)
    const productMatch = pathname.match(/^\/product\/([^/]+)/);
    if (productMatch) {
      return {
        view: 'product',
        productSlug: decodeURIComponent(productMatch[1]),
        category: 'All',
        filterMode: 'all'
      };
    }

    // 2. Check for hash fallback #/product/:slug
    const hashMatch = window.location.hash.match(/^#\/?product[-/]([^/]+)/);
    if (hashMatch) {
      return {
        view: 'product',
        productSlug: decodeURIComponent(hashMatch[1]),
        category: 'All',
        filterMode: 'all'
      };
    }

    // 3. Check for /about
    if (pathname === '/about' || window.location.hash === '#about') {
      return {
        view: 'about',
        productSlug: null,
        category: 'All',
        filterMode: 'all'
      };
    }

    // 4. Check for /wishlist
    if (pathname === '/wishlist' || window.location.hash === '#wishlist' || window.location.hash === '#/wishlist') {
      return {
        view: 'wishlist',
        productSlug: null,
        category: 'All',
        filterMode: 'all'
      };
    }

    // 5. Check for /shop or query filters
    if (pathname === '/shop' || window.location.hash === '#shop' || filterParam || categoryParam) {
      let fMode = 'all';
      if (filterParam === 'new-arrivals' || filterParam === 'new') {
        fMode = 'new_arrivals';
      } else if (filterParam === 'best-sellers' || filterParam === 'bestsellers') {
        fMode = 'best_sellers';
      }
      return {
        view: 'shop',
        productSlug: null,
        category: categoryParam || 'All',
        filterMode: fMode
      };
    }

    // 6. Default to home
    return {
      view: 'home',
      productSlug: null,
      category: 'All',
      filterMode: 'all'
    };
  }, []);

  const initialRoute = parseCurrentLocation();

  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [activeProductSlug, setActiveProductSlug] = useState(initialRoute.productSlug);
  const [selectedCategory, setSelectedCategory] = useState(initialRoute.category);
  const [filterMode, setFilterMode] = useState(initialRoute.filterMode);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null); // { orderId, details }
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentLocation();
      setCurrentView(parsed.view);
      setActiveProductSlug(parsed.productSlug);
      setSelectedCategory(parsed.category);
      setFilterMode(parsed.filterMode);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseCurrentLocation]);

  // Central client router navigate function
  const navigate = useCallback((url, options = {}) => {
    if (options.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }

    const parsed = parseCurrentLocation();
    setCurrentView(parsed.view);
    setActiveProductSlug(parsed.productSlug);
    setSelectedCategory(parsed.category);
    setFilterMode(parsed.filterMode);

    if (!options.preventScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [parseCurrentLocation]);

  // Listen for #admin in URL hash or ?admin in query for authorized staff access
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setIsAdminOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Fetch live products from backend database (with graceful offline fallback)
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(err => {
        console.warn('Backend offline or static mode, using bundled catalogue manifest:', err.message);
      });
  }, []);

  // Handle Navbar navigation
  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.view === 'home') {
      navigate('/');
    } else if (item.view === 'about') {
      navigate('/about');
    } else if (item.view === 'wishlist') {
      navigate('/wishlist');
    } else if (item.view === 'shop') {
      let query = '';
      if (item.filterMode === 'new_arrivals') query = '?filter=new-arrivals';
      else if (item.filterMode === 'best_sellers') query = '?filter=best-sellers';
      else if (item.category && item.category !== 'All') query = `?category=${encodeURIComponent(item.category)}`;
      navigate(`/shop${query}`);
    }
  };

  // Handlers for home page actions
  const handleSelectCategory = (catName) => {
    if (catName === 'All') {
      navigate('/shop');
    } else {
      navigate(`/shop?category=${encodeURIComponent(catName)}`);
    }
  };

  const handleShopNow = () => {
    navigate('/shop');
  };

  const handleExplorePartywear = () => {
    navigate('/shop?category=Partywear');
  };

  const handleOpenSearch = () => {
    if (currentView !== 'shop') {
      navigate('/shop');
    }
    setTimeout(() => {
      const searchInput = document.getElementById('catalogue-search-input');
      if (searchInput) searchInput.focus();
    }, 250);
  };

  // Product Selection: navigate directly to dedicated product page
  const handleSelectProduct = (product) => {
    const slug = product.slug || product.id;
    navigate(`/product/${slug}`);
  };

  // Find currently active product for PDP
  const currentActiveProduct = activeProductSlug
    ? products.find(
        p => String(p.slug) === String(activeProductSlug) || String(p.id) === String(activeProductSlug)
      ) ||
      FALLBACK_PRODUCTS.find(
        p => String(p.slug) === String(activeProductSlug) || String(p.id) === String(activeProductSlug)
      ) ||
      null
    : null;

  return (
    <div className="app-root">
      {/* 1. Continuous Announcement Bar Marquee */}
      <AnnouncementBar />

      {/* 2. Simplified Header (HOME | SHOP ALL | NEW ARRIVALS | BEST SELLERS | ABOUT) */}
      <Header
        currentView={currentView}
        selectedCategory={selectedCategory}
        filterMode={filterMode}
        onNavigate={handleNavClick}
        onOpenSearch={handleOpenSearch}
      />

      {/* MAIN CONTENT VIEWS */}
      <main>
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <>
            {/* Hero Video Section (Video untouched, typography compact & editorial) */}
            <HeroVideo
              onShopNow={handleShopNow}
              onExplorePartywear={handleExplorePartywear}
            />

            {/* Shop by Category */}
            <CategoryGrid onSelectCategory={handleSelectCategory} />

            {/* Curated Product Grid */}
            <ProductGrid
              products={products}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleSelectCategory}
              onSelectProduct={handleSelectProduct}
              filterMode="all"
              title="Curated Boutique Edit"
              subtitle="Distinctive western cuts and elegant occasionwear tailored for contemporary ease."
            />

            {/* Editorial Spotlight */}
            <EditorialSection onExplore={handleExplorePartywear} />

            {/* About the Boutique */}
            <AboutSection />

            {/* Instagram Community Section */}
            <InstagramSection />
          </>
        )}

        {/* VIEW 2: SHOP ALL / NEW ARRIVALS / BEST SELLERS */}
        {currentView === 'shop' && (
          <div style={{ paddingTop: '2rem' }}>
            <ProductGrid
              products={products}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleSelectCategory}
              onSelectProduct={handleSelectProduct}
              filterMode={filterMode}
              onClearFilterMode={() => {
                navigate('/shop');
              }}
              title="Complete Boutique Collection"
              subtitle="20 distinct garments spanning dresses, tops, tailored co-ord sets, skirts, and partywear."
            />
            <InstagramSection />
          </div>
        )}

        {/* VIEW 3: DEDICATED INDIVIDUAL PRODUCT DETAILS PAGE */}
        {currentView === 'product' && (
          <ProductDetailPage
            product={currentActiveProduct}
            allProducts={products}
            onNavigateToProduct={handleSelectProduct}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenPolicy={setActivePolicy}
            onBackToShop={() => navigate('/shop')}
          />
        )}

        {/* VIEW 4: ABOUT */}
        {currentView === 'about' && (
          <div style={{ paddingTop: '2rem' }}>
            <AboutSection />
            <EditorialSection onExplore={handleShopNow} />
            <InstagramSection />
          </div>
        )}

        {/* VIEW 5: DEDICATED WISHLIST VIEW */}
        {currentView === 'wishlist' && (
          <WishlistPage
            allProducts={products}
            onSelectProduct={handleSelectProduct}
            onContinueShopping={() => navigate('/shop')}
          />
        )}
      </main>

      {/* Comprehensive Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenPolicy={setActivePolicy}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={(orderId, details) => {
            setIsCheckoutOpen(false);
            setCompletedOrder({ orderId, details });
          }}
        />
      )}

      {/* Order Success Modal */}
      {completedOrder && (
        <OrderSuccessModal
          orderId={completedOrder.orderId}
          orderDetails={completedOrder.details}
          onClose={() => setCompletedOrder(null)}
          onContinueShopping={() => {
            setCompletedOrder(null);
            navigate('/shop');
          }}
        />
      )}

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <SizeGuideModal onClose={() => setIsSizeGuideOpen(false)} />
      )}

      {/* Policies Modal */}
      {activePolicy && (
        <PolicyModal
          policyType={activePolicy}
          onClose={() => setActivePolicy(null)}
        />
      )}

      {/* Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard onClose={handleCloseAdmin} />
      )}

      {/* Toast Notification Pill */}
      <Toast />
    </div>
  );
}

export default App;
