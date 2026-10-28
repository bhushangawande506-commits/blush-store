import React, { useState, useEffect } from 'react';
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
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { PolicyModal } from './components/PolicyModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Toast } from './components/Toast';
import { PRODUCTS as FALLBACK_PRODUCTS } from './data/products';

export function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'shop' | 'about'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null); // { orderId, details }
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

  const handleSelectCategory = (catName) => {
    setSelectedCategory(catName);
    setCurrentView('shop');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleShopNow = () => {
    setSelectedCategory('All');
    setCurrentView('shop');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleExplorePartywear = () => {
    setSelectedCategory('Partywear');
    setCurrentView('shop');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleOpenSearch = () => {
    setCurrentView('shop');
    window.scrollTo({ top: 380, behavior: 'smooth' });
    setTimeout(() => {
      const searchInput = document.getElementById('catalogue-search-input');
      if (searchInput) searchInput.focus();
    }, 200);
  };

  return (
    <div className="app-root">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Sticky Header with Original Logo & Brand name "Blush" */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenSearch={handleOpenSearch}
      />

      {/* MAIN CONTENT VIEWS */}
      <main>
        {currentView === 'home' && (
          <>
            {/* 3. Hero Video Section */}
            <HeroVideo
              onShopNow={handleShopNow}
              onExplorePartywear={handleExplorePartywear}
            />

            {/* 4. Shop by Category */}
            <CategoryGrid onSelectCategory={handleSelectCategory} />

            {/* 5. Featured New Arrivals Showcase */}
            <ProductGrid
              products={products}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSelectProduct={setSelectedProduct}
              title="Curated Boutique Edit"
              subtitle="Distinctive western cuts and elegant occasionwear tailored for contemporary ease."
            />

            {/* 6. Editorial Spotlight */}
            <EditorialSection onExplore={handleExplorePartywear} />

            {/* 7. About the Boutique (Pune, Est. 2014) */}
            <AboutSection />

            {/* 8. Instagram & WhatsApp Community */}
            <InstagramSection />
          </>
        )}

        {currentView === 'shop' && (
          <div style={{ paddingTop: '2rem' }}>
            <ProductGrid
              products={products}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSelectProduct={setSelectedProduct}
              title="Complete Boutique Collection"
              subtitle="20 distinct garments spanning dresses, tops, tailored co-ord sets, skirts, and partywear."
            />
            <InstagramSection />
          </div>
        )}

        {currentView === 'about' && (
          <div style={{ paddingTop: '2rem' }}>
            <AboutSection />
            <EditorialSection onExplore={handleShopNow} />
            <InstagramSection />
          </div>
        )}
      </main>

      {/* 9. Comprehensive Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenPolicy={setActivePolicy}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          onBuyNowDirect={() => setIsCheckoutOpen(true)}
        />
      )}

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
            setCurrentView('shop');
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
