import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Layers,
  Boxes,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  DollarSign,
  RefreshCw,
  CheckCircle,
  Truck,
  AlertTriangle,
  Edit3,
  Save,
  Plus,
  Trash2,
  Search,
  Eye,
  LogOut,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Filter,
  Store,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const STORAGE_KEY = 'blush_admin_auth_token';
const STANDARD_CATEGORIES = ['Dresses', 'Tops', 'Co-ords', 'Skirts', 'Partywear'];
const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];

export const AdminDashboard = ({ onClose, isDedicatedRoute = false }) => {
  const { showToast } = useCart();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => {
    try {
      return typeof window !== 'undefined' && Boolean(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Navigation & Mobile Drawer
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Database Data
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeSettings, setStoreSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search & Filters State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all', 'in', 'low', 'out'

  // Quick Stock Edit State (for Inventory tab)
  const [quickStockEdits, setQuickStockEdits] = useState({});
  const [quickStockSavingId, setQuickStockSavingId] = useState(null);

  // Product Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Product Form State
  const initialFormState = {
    name: '',
    slug: '',
    category: 'Dresses',
    price: '',
    compare_at_price: '',
    stock: 10,
    fabric: '',
    care: '',
    description: '',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Blush Pink'],
    images: ['/images/Golden-Hour Mediterranean Terrace Portrait.webp'],
    is_featured: false,
    is_new_arrival: false
  };
  const [formData, setFormData] = useState(initialFormState);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    free_shipping_threshold: '2499',
    standard_shipping_fee: '150',
    contact_phone: '9503917333',
    brand_location: 'Pune, Maharashtra, India',
    instagram_handle: '@blushpune',
    announcement_banner: 'Complimentary Express Shipping on Orders Above ₹2,499'
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // AUTHENTICATION & SESSION PERSISTENCE
  // ---------------------------------------------------------------------------
  const fetchAdminData = useCallback(async (token) => {
    if (!token) return;
    setLoading(true);
    console.log('[AUTH DIAGNOSTIC: Step 6] fetchAdminData triggered with token length:', token.length);

    try {
      const [statsRes, ordersRes, prodsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': token } })
          .then(r => r.ok ? r.json() : { success: false, status: r.status })
          .catch(err => ({ success: false, error: err.message })),
        fetch('/api/admin/orders', { headers: { 'x-admin-token': token } })
          .then(r => r.ok ? r.json() : { success: false, status: r.status })
          .catch(err => ({ success: false, error: err.message })),
        fetch('/api/products')
          .then(r => r.ok ? r.json() : { success: false, status: r.status })
          .catch(err => ({ success: false, error: err.message })),
        fetch('/api/admin/settings', { headers: { 'x-admin-token': token } })
          .then(r => r.ok ? r.json() : { success: false, status: r.status })
          .catch(err => ({ success: false, error: err.message }))
      ]);

      console.log('[AUTH DIAGNOSTIC: Step 6] fetchAdminData completed:', {
        stats: statsRes?.success,
        orders: ordersRes?.success,
        products: prodsRes?.success,
        settings: settingsRes?.success
      });

      if (statsRes && statsRes.success) setStats(statsRes.stats);
      if (ordersRes && ordersRes.success) setOrders(ordersRes.orders || []);
      if (prodsRes && prodsRes.success) setProducts(prodsRes.products || []);
      if (settingsRes && settingsRes.success && settingsRes.settings) {
        setStoreSettings(settingsRes.settings);
        setSettingsForm(prev => ({
          ...prev,
          ...settingsRes.settings
        }));
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[AUTH DIAGNOSTIC: Step 6] Error loading admin data:', err);
      showToast?.('Error loading store data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const savedToken = sessionStorage.getItem(STORAGE_KEY);

    if (!savedToken || !savedToken.trim()) {
      console.log('[AUTH DIAGNOSTIC: Step 5] No token in sessionStorage. Presenting login screen.');
      setAuthLoading(false);
      return;
    }

    console.log('[AUTH DIAGNOSTIC: Step 5] Token found in sessionStorage. Verifying session...');

    const verifySession = async () => {
      try {
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': savedToken.trim()
          },
          body: JSON.stringify({ token: savedToken.trim() })
        });

        const data = await res.json().catch(() => null);

        if (!active) return;

        if (res.ok && data && data.success) {
          console.log('[AUTH DIAGNOSTIC: Step 5] Session token verified successfully. Access granted.');
          setAuthToken(savedToken.trim());
          setIsAuthenticated(true);
          setAuthError(null);
          fetchAdminData(savedToken.trim());
        } else {
          console.warn('[AUTH DIAGNOSTIC: Step 5] Session token invalid or expired. Purging.');
          sessionStorage.removeItem(STORAGE_KEY);
          setAuthToken('');
          setIsAuthenticated(false);
          setAuthError('Session expired. Please sign in again.');
        }
      } catch (err) {
        console.error('[AUTH DIAGNOSTIC: Step 5] Session verification error:', err);
        if (!active) return;
        sessionStorage.removeItem(STORAGE_KEY);
        setAuthToken('');
        setIsAuthenticated(false);
        setAuthError('Authentication service unreachable. Please sign in.');
      } finally {
        if (active) {
          setAuthLoading(false);
          console.log('[AUTH DIAGNOSTIC: Step 5] Session verification finished, authLoading=false.');
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [fetchAdminData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('[AUTH DIAGNOSTIC: Step 1] Login button clicked. Key length:', adminKey?.trim()?.length || 0);

    if (!adminKey.trim()) {
      setAuthError('Please enter admin credentials.');
      return;
    }
    setLoading(true);
    setAuthError(null);

    try {
      console.log('[AUTH DIAGNOSTIC: Step 2] Sending POST /api/admin/verify with credentials...');
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminKey.trim() })
      });

      const data = await res.json().catch(() => null);
      console.log('[AUTH DIAGNOSTIC: Step 3] Verify response received:', res.status, 'success:', data?.success);

      if (res.ok && data && data.success) {
        console.log('[AUTH DIAGNOSTIC: Step 4] Storing token in sessionStorage, token length:', data.token?.length);
        sessionStorage.setItem(STORAGE_KEY, data.token);
        setAuthToken(data.token);
        setIsAuthenticated(true);
        setAuthError(null);
        console.log('[AUTH DIAGNOSTIC: Step 6] Calling fetchAdminData()...');
        fetchAdminData(data.token);
        showToast?.('Welcome to Blush Boutique Management');
      } else {
        setAuthError((data && data.error) || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      console.error('[AUTH DIAGNOSTIC: Step 2/3] Login request failed:', err);
      setAuthError('Authentication service unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthToken('');
    setIsAuthenticated(false);
    setAdminKey('');
    setAuthError(null);
    showToast?.('Logged out from Admin Portal');
  };

  // ---------------------------------------------------------------------------
  // DERIVED DATA & COMPUTED AGGREGATES (Real Database Records)
  // ---------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const totalRev = stats?.total_revenue || paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const paidCount = stats?.total_orders || paidOrders.length;
    const aov = paidCount > 0 ? Math.round(totalRev / paidCount) : 0;
    const totalStyles = stats?.total_products || products.length;
    const totalUnits = stats?.total_stock || products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const totalValuation = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);

    return {
      totalRev,
      paidCount,
      aov,
      totalStyles,
      totalUnits,
      totalValuation
    };
  }, [orders, products, stats]);

  // Unique Customers computed from authoritative orders table
  const customers = useMemo(() => {
    const map = new Map();
    for (const ord of orders) {
      const email = (ord.customer_email || '').toLowerCase().trim();
      const phone = (ord.customer_phone || '').trim();
      const key = email || phone || ord.customer_name;
      if (!map.has(key)) {
        map.set(key, {
          name: ord.customer_name,
          email: ord.customer_email,
          phone: ord.customer_phone,
          city: ord.city,
          state: ord.state,
          pincode: ord.pincode,
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: ord.created_at,
          lastOrderId: ord.id
        });
      }
      const c = map.get(key);
      c.orderCount += 1;
      if (ord.payment_status === 'paid') {
        c.totalSpent += Number(ord.total_amount || 0);
      }
      if (new Date(ord.created_at) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = ord.created_at;
        c.lastOrderId = ord.id;
      }
    }
    return Array.from(map.values());
  }, [orders]);

  // Categories computed from products catalog
  const categoryAnalytics = useMemo(() => {
    const catMap = {};
    for (const cat of STANDARD_CATEGORIES) {
      catMap[cat] = {
        name: cat,
        count: 0,
        units: 0,
        minPrice: Infinity,
        maxPrice: 0,
        sampleImage: null
      };
    }

    for (const p of products) {
      const cat = p.category || 'Dresses';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, count: 0, units: 0, minPrice: Infinity, maxPrice: 0, sampleImage: null };
      }
      catMap[cat].count += 1;
      catMap[cat].units += Number(p.stock || 0);
      const pr = Number(p.price || 0);
      if (pr < catMap[cat].minPrice) catMap[cat].minPrice = pr;
      if (pr > catMap[cat].maxPrice) catMap[cat].maxPrice = pr;
      if (!catMap[cat].sampleImage && p.images?.[0]) {
        catMap[cat].sampleImage = p.images[0];
      }
    }

    return Object.values(catMap);
  }, [products]);

  // Recent Orders (Top 5)
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  // Low Stock Items (< 5 units)
  const lowStockItems = useMemo(() => {
    return products.filter(p => Number(p.stock) < 5);
  }, [products]);

  // ---------------------------------------------------------------------------
  // ORDER ACTIONS
  // ---------------------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus = null) => {
    try {
      const body = { order_status: newStatus };
      if (newPaymentStatus) body.payment_status = newPaymentStatus;

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Order #${orderId} updated to ${newStatus}`);
        fetchAdminData(authToken);
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(prev => ({
            ...prev,
            order_status: newStatus,
            ...(newPaymentStatus ? { payment_status: newPaymentStatus } : {})
          }));
        }
      } else {
        showToast?.(data.error || 'Failed to update order');
      }
    } catch {
      showToast?.('Network error updating status');
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase().trim();
        const matchesId = (ord.id || '').toLowerCase().includes(query);
        const matchesName = (ord.customer_name || '').toLowerCase().includes(query);
        const matchesEmail = (ord.customer_email || '').toLowerCase().includes(query);
        const matchesPhone = (ord.customer_phone || '').includes(query);
        if (!matchesId && !matchesName && !matchesEmail && !matchesPhone) return false;
      }
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'paid_ready') {
          if (ord.order_status !== 'paid' && ord.order_status !== 'processing') return false;
        } else if (ord.order_status !== orderStatusFilter) {
          return false;
        }
      }
      if (orderPaymentFilter !== 'all' && ord.payment_status !== orderPaymentFilter) {
        return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter, orderPaymentFilter]);

  // ---------------------------------------------------------------------------
  // PRODUCT & INVENTORY ACTIONS
  // ---------------------------------------------------------------------------
  const handleOpenAddProduct = (presetCategory = null) => {
    setFormData({
      ...initialFormState,
      category: presetCategory && STANDARD_CATEGORIES.includes(presetCategory) ? presetCategory : 'Dresses'
    });
    setNewImageUrl('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      category: prod.category || 'Dresses',
      price: prod.price !== undefined ? prod.price : '',
      compare_at_price: prod.compare_at_price !== null && prod.compare_at_price !== undefined ? prod.compare_at_price : '',
      stock: prod.stock !== undefined ? prod.stock : 10,
      fabric: prod.fabric || '',
      care: prod.care || '',
      description: prod.description || '',
      sizes: Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ['XS', 'S', 'M', 'L'],
      colors: Array.isArray(prod.colors) && prod.colors.length > 0 ? prod.colors : [],
      images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : ['/images/Golden-Hour Mediterranean Terrace Portrait.webp'],
      is_featured: Boolean(prod.is_featured),
      is_new_arrival: Boolean(prod.is_new_arrival)
    });
    setNewImageUrl('');
  };

  const handleToggleProductFlag = async (prodId, field, currentValue) => {
    try {
      const res = await fetch(`/api/admin/products/${prodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify({ [field]: !currentValue })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('Product updated');
        fetchAdminData(authToken);
      }
    } catch {
      showToast?.('Failed to toggle flag');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast?.('Please enter product name');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      showToast?.('Please enter valid price');
      return;
    }

    setFormSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      category: formData.category,
      price: Number(formData.price),
      compare_at_price: formData.compare_at_price !== '' ? Number(formData.compare_at_price) : null,
      stock: Number(formData.stock),
      fabric: formData.fabric.trim(),
      care: formData.care.trim(),
      description: formData.description.trim(),
      sizes: formData.sizes,
      colors: formData.colors,
      images: formData.images.filter(Boolean),
      is_featured: formData.is_featured ? 1 : 0,
      is_new_arrival: formData.is_new_arrival ? 1 : 0
    };

    try {
      const isEditing = Boolean(editingProduct);
      const url = isEditing ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast?.(isEditing ? 'Garment updated successfully' : 'New garment added to catalog');
        setIsAddModalOpen(false);
        setEditingProduct(null);
        fetchAdminData(authToken);
      } else {
        showToast?.(data.error || 'Failed to save product');
      }
    } catch {
      showToast?.('Network error saving product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': authToken }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(`"${deletingProduct.name}" removed from catalog`);
        setDeletingProduct(null);
        fetchAdminData(authToken);
      } else {
        showToast?.(data.error || 'Failed to delete product');
      }
    } catch {
      showToast?.('Error deleting product');
    }
  };

  // Quick Stock Update (from Inventory tab)
  const handleQuickStockSave = async (prodId) => {
    const newStock = quickStockEdits[prodId];
    if (newStock === undefined || newStock === '' || Number(newStock) < 0) return;

    setQuickStockSavingId(prodId);
    try {
      const res = await fetch(`/api/admin/products/${prodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify({ stock: Number(newStock) })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('Inventory updated');
        setQuickStockEdits(prev => {
          const updated = { ...prev };
          delete updated[prodId];
          return updated;
        });
        fetchAdminData(authToken);
      }
    } catch {
      showToast?.('Failed to update stock');
    } finally {
      setQuickStockSavingId(null);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        const matchName = (prod.name || '').toLowerCase().includes(q);
        const matchCat = (prod.category || '').toLowerCase().includes(q);
        const matchFabric = (prod.fabric || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchFabric) return false;
      }
      if (productCategoryFilter !== 'all' && prod.category !== productCategoryFilter) {
        return false;
      }
      if (productStockFilter !== 'all') {
        if (productStockFilter === 'out' && prod.stock > 0) return false;
        if (productStockFilter === 'low' && (prod.stock === 0 || prod.stock >= 5)) return false;
        if (productStockFilter === 'in' && prod.stock < 5) return false;
      }
      return true;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  // Filtered Inventory Products
  const filteredInventory = useMemo(() => {
    return products.filter(prod => {
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase().trim();
        if (!(prod.name || '').toLowerCase().includes(q) && !(prod.category || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (inventoryFilter === 'in' && prod.stock < 5) return false;
      if (inventoryFilter === 'low' && (prod.stock === 0 || prod.stock >= 5)) return false;
      if (inventoryFilter === 'out' && prod.stock > 0) return false;
      return true;
    });
  }, [products, inventorySearch, inventoryFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  // ---------------------------------------------------------------------------
  // SETTINGS ACTIONS
  // ---------------------------------------------------------------------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify({ settings: settingsForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.('Store settings saved successfully');
        fetchAdminData(authToken);
      } else {
        showToast?.(data.error || 'Failed to save settings');
      }
    } catch {
      showToast?.('Network error saving settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER: LOADING OR AUTHENTICATION GATE
  // ---------------------------------------------------------------------------
  console.log(`[AUTH DIAGNOSTIC: Step 7] Rendering AdminDashboard - authLoading: ${authLoading}, isAuthenticated: ${isAuthenticated}, activeSection: ${activeSection}`);

  if (authLoading) {
    return (
      <div className="admin-workspace" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F2ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#E50914', marginBottom: '1rem' }} />
        <p style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '0.85rem' }}>Verifying authorized access...</p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            setAuthLoading(false);
          }}
          style={{ border: 'none', background: 'none', color: '#E50914', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Cancel and go to Sign In
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-workspace" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F2ED' }}>
        <div className="admin-card" style={{ maxWidth: '420px', width: '92%', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Shield size={26} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', marginBottom: '0.35rem', color: '#171717' }}>
            Blush Pune
          </h2>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#666666', display: 'block', marginBottom: '1.5rem' }}>
            Boutique Owner Portal
          </span>

          <form onSubmit={handleLogin}>
            <div className="admin-form-group" style={{ textAlign: 'left' }}>
              <label className="admin-form-label">Authorized Access Key</label>
              <input
                type="password"
                id="admin-key-input"
                className="admin-input"
                placeholder="Enter password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1rem', letterSpacing: '0.1em' }}
                autoComplete="current-password"
                autoFocus
              />
            </div>

            {authError && (
              <div style={{ padding: '0.6rem', backgroundColor: '#FEE2E2', borderRadius: '4px', color: '#DC2626', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <AlertTriangle size={14} /> {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              id="admin-login-btn"
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#171717', borderColor: '#171717' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Unlock Dashboard'}
            </button>
          </form>

          <button
            onClick={onClose}
            style={{ marginTop: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#666', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={13} /> Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Section Title Mapping
  const sectionTitles = {
    dashboard: 'Boutique Overview',
    orders: 'Order Ledger & Fulfillment',
    products: 'Garment Catalog & Styles',
    categories: 'Category Collections',
    inventory: 'Inventory & Stock Control',
    customers: 'Client Directory',
    homepage: 'Homepage & Promotional Curation',
    reports: 'Financial & Operational Reports',
    settings: 'Store Configuration'
  };

  // ---------------------------------------------------------------------------
  // RENDER: PREMIUM SIDEBAR WORKSPACE
  // ---------------------------------------------------------------------------
  return (
    <div className="admin-workspace" id="blush-admin-workspace">
      {/* 1. PROFESSIONAL SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(229, 9, 20, 0.4)' }}>
            <Shield size={18} style={{ color: '#E50914' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.35rem', lineHeight: 1, letterSpacing: '0.04em', margin: 0, color: '#FFFDFC' }}>
              BLUSH PUNE
            </h1>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A3A3A3' }}>
              Est. 2014 • Boutique Management
            </span>
          </div>
        </div>

        {/* Navigation Items (9 Sections) */}
        <nav className="admin-sidebar-nav">
          <button
            className={`admin-sidebar-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveSection('dashboard'); setIsMobileSidebarOpen(false); }}
            id="nav-dashboard"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard size={17} className="admin-nav-icon" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveSection('orders'); setIsMobileSidebarOpen(false); }}
            id="nav-orders"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={17} className="admin-nav-icon" />
              <span>Orders</span>
            </div>
            {orders.length > 0 && (
              <span className="admin-nav-badge">{orders.length}</span>
            )}
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveSection('products'); setIsMobileSidebarOpen(false); }}
            id="nav-products"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shirt size={17} className="admin-nav-icon" />
              <span>Products</span>
            </div>
            {products.length > 0 && (
              <span className="admin-nav-badge">{products.length}</span>
            )}
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'categories' ? 'active' : ''}`}
            onClick={() => { setActiveSection('categories'); setIsMobileSidebarOpen(false); }}
            id="nav-categories"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={17} className="admin-nav-icon" />
              <span>Categories</span>
            </div>
            <span className="admin-nav-badge">{STANDARD_CATEGORIES.length}</span>
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveSection('inventory'); setIsMobileSidebarOpen(false); }}
            id="nav-inventory"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Boxes size={17} className="admin-nav-icon" />
              <span>Inventory</span>
            </div>
            {lowStockItems.length > 0 && (
              <span className="admin-nav-badge" style={{ backgroundColor: '#E50914' }}>
                {lowStockItems.length}
              </span>
            )}
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'customers' ? 'active' : ''}`}
            onClick={() => { setActiveSection('customers'); setIsMobileSidebarOpen(false); }}
            id="nav-customers"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={17} className="admin-nav-icon" />
              <span>Customers</span>
            </div>
            <span className="admin-nav-badge">{customers.length}</span>
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'homepage' ? 'active' : ''}`}
            onClick={() => { setActiveSection('homepage'); setIsMobileSidebarOpen(false); }}
            id="nav-homepage"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={17} className="admin-nav-icon" />
              <span>Homepage</span>
            </div>
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSection('reports'); setIsMobileSidebarOpen(false); }}
            id="nav-reports"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={17} className="admin-nav-icon" />
              <span>Reports</span>
            </div>
          </button>

          <button
            className={`admin-sidebar-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveSection('settings'); setIsMobileSidebarOpen(false); }}
            id="nav-settings"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={17} className="admin-nav-icon" />
              <span>Settings</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Supabase Connected</span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 95 }}
        />
      )}

      {/* 2. MAIN VIEWPORT */}
      <div className="admin-main">
        {/* Header Bar */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              style={{ display: 'inline-flex', md: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              aria-label="Toggle Navigation"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem', color: '#171717', margin: 0, lineHeight: 1.1 }}>
                {sectionTitles[activeSection] || 'Management'}
              </h2>
              <span style={{ fontSize: '0.7rem', color: '#666666' }}>
                Blush Pune Boutique Control • Synced {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchAdminData(authToken)}
              className="btn-outline-dark"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh all metrics from Supabase"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="btn-outline-dark"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Return to customer website"
            >
              <Store size={14} />
              <span>Storefront</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn-outline-dark"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="admin-body">
          {/* =============================================================== */}
          {/* 1. DASHBOARD OVERVIEW                                           */}
          {/* =============================================================== */}
          {activeSection === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 5 KPI Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666666', fontWeight: 600 }}>
                    Total Revenue (Paid)
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-editorial)', color: '#171717' }}>
                    ₹{metrics.totalRev.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#0E7B3B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Verified database ledger
                  </span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666666', fontWeight: 600 }}>
                    Paid Orders
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-editorial)', color: '#171717' }}>
                    {metrics.paidCount}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                    Out of {orders.length} total orders placed
                  </span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666666', fontWeight: 600 }}>
                    Average Order Value
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-editorial)', color: '#171717' }}>
                    ₹{metrics.aov.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                    Average spend per customer
                  </span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666666', fontWeight: 600 }}>
                    Active Garment Styles
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-editorial)', color: '#171717' }}>
                    {metrics.totalStyles}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                    Across {STANDARD_CATEGORIES.length} categories
                  </span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666666', fontWeight: 600 }}>
                    Inventory Units
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-editorial)', color: '#171717' }}>
                    {metrics.totalUnits}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                    ₹{metrics.totalValuation.toLocaleString('en-IN')} retail valuation
                  </span>
                </div>
              </div>

              {/* Visual Sales Overview & Order Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Visual Sales Overview SVG Chart */}
                <div className="admin-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart3 size={16} style={{ color: '#E50914' }} /> Sales Progression Timeline
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#666666' }}>Cumulative Order Intake</span>
                  </div>

                  {orders.length > 0 ? (
                    <div>
                      {/* Simple Responsive SVG Trendline */}
                      <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 500 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#E50914" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#E50914" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const sorted = [...orders].reverse();
                            let cumulative = 0;
                            const pts = sorted.map((o, idx) => {
                              if (o.payment_status === 'paid') cumulative += Number(o.total_amount || 0);
                              return { x: (idx / Math.max(sorted.length - 1, 1)) * 480 + 10, y: cumulative };
                            });
                            const maxVal = Math.max(cumulative, 1);
                            const pathStr = pts
                              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${(110 - (p.y / maxVal) * 90).toFixed(1)}`)
                              .join(' ');
                            const areaStr = `${pathStr} L 490 115 L 10 115 Z`;

                            return (
                              <>
                                <line x1="10" y1="115" x2="490" y2="115" stroke="#E5E7EB" strokeWidth="1" />
                                <path d={areaStr} fill="url(#salesGrad)" />
                                <path d={pathStr} fill="none" stroke="#E50914" strokeWidth="2.5" strokeLinecap="round" />
                                {pts.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={110 - (p.y / maxVal) * 90} r="3" fill="#FFF" stroke="#E50914" strokeWidth="2" />
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#666666', marginTop: '0.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.5rem' }}>
                        <span>First Order Recorded</span>
                        <span>Total: ₹{metrics.totalRev.toLocaleString('en-IN')}</span>
                        <span>Latest Order</span>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#666666', textAlign: 'center', padding: '2rem 0' }}>No sales records yet.</p>
                  )}
                </div>

                {/* Order Status Distribution */}
                <div className="admin-card">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} style={{ color: '#171717' }} /> Order Fulfillment Distribution
                  </h4>
                  {stats?.status_breakdown && stats.status_breakdown.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stats.status_breakdown.map((s) => {
                        const pct = orders.length > 0 ? Math.round((s.count / orders.length) * 100) : 0;
                        return (
                          <div key={s.order_status}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                              <span className={`status-badge status-${s.order_status}`}>{s.order_status}</span>
                              <strong style={{ color: '#171717' }}>{s.count} orders ({pct}%)</strong>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: s.order_status === 'paid' ? '#0E7B3B' : s.order_status === 'processing' ? '#6D28D9' : s.order_status === 'shipped' ? '#0369A1' : '#E50914' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#666666' }}>No order lifecycle records logged yet.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="admin-card" style={{ backgroundColor: 'var(--color-warm-white, #FFFDFC)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666666', marginBottom: '0.75rem' }}>
                  Quick Operational Actions
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenAddProduct()}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Add New Garment
                  </button>
                  <button
                    onClick={() => { setActiveSection('orders'); setOrderStatusFilter('paid_ready'); }}
                    className="btn-outline-dark"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Package size={14} /> Fulfill Pending Orders
                  </button>
                  <button
                    onClick={() => { setActiveSection('inventory'); setInventoryFilter('low'); }}
                    className="btn-outline-dark"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Boxes size={14} /> Manage Low Stock
                  </button>
                  <button
                    onClick={() => setActiveSection('homepage')}
                    className="btn-outline-dark"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={14} /> Update Homepage Banner
                  </button>
                </div>
              </div>

              {/* Recent Orders & Low Stock split */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Recent Orders Table */}
                <div className="admin-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recent Customer Orders</h4>
                    <button
                      onClick={() => setActiveSection('orders')}
                      style={{ border: 'none', background: 'none', color: '#E50914', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {recentOrders.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table" style={{ margin: 0, fontSize: '0.82rem' }}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map(ord => (
                            <tr key={ord.id} onClick={() => setViewingOrder(ord)} style={{ cursor: 'pointer' }}>
                              <td><strong style={{ fontFamily: 'monospace' }}>#{ord.id}</strong></td>
                              <td>{ord.customer_name}</td>
                              <td>₹{Number(ord.total_amount).toLocaleString('en-IN')}</td>
                              <td><span className={`status-badge status-${ord.order_status}`}>{ord.order_status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#666666' }}>No orders placed yet.</p>
                  )}
                </div>

                {/* Low Stock Alerts */}
                <div className="admin-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} /> Low Stock Watchlist ({lowStockItems.length})
                    </h4>
                    <button
                      onClick={() => { setActiveSection('inventory'); setInventoryFilter('low'); }}
                      style={{ border: 'none', background: 'none', color: '#E50914', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      Inventory <ChevronRight size={14} />
                    </button>
                  </div>
                  {lowStockItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lowStockItems.slice(0, 5).map(prod => (
                        <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', border: '1px solid #FEE2E2', borderRadius: '4px', backgroundColor: '#FEF2F2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={prod.images?.[0] || '/images/Golden-Hour Mediterranean Terrace Portrait.webp'} alt="" style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                            <div>
                              <strong style={{ fontSize: '0.82rem', color: '#171717' }}>{prod.name}</strong>
                              <br />
                              <span style={{ fontSize: '0.7rem', color: '#666' }}>{prod.category}</span>
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: prod.stock === 0 ? '#DC2626' : '#D97706', fontSize: '0.8rem' }}>
                            {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} units`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#0E7B3B' }}>
                      <CheckCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.82rem' }}>All styles have healthy stock levels.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. ORDERS SECTION                                               */}
          {/* =============================================================== */}
          {activeSection === 'orders' && (
            <div>
              <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Search order ID, customer, phone, email..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      style={{ paddingLeft: '2.2rem' }}
                    />
                    {orderSearch && (
                      <button onClick={() => setOrderSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <select
                      className="admin-select"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      style={{ width: 'auto', fontSize: '0.82rem' }}
                    >
                      <option value="all">All Order Statuses</option>
                      <option value="paid_ready">Paid / Processing (Ready to Ship)</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="admin-select"
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      style={{ width: 'auto', fontSize: '0.82rem' }}
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <ShoppingBag size={40} style={{ color: '#D1D5DB', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>No orders match filters</h4>
                  <p style={{ fontSize: '0.82rem', color: '#666' }}>Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Order ID & Date</th>
                          <th>Customer</th>
                          <th>Destination</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          <th>Order Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(ord => (
                          <tr key={ord.id}>
                            <td>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>#{ord.id}</strong>
                              <br />
                              <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                {new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.85rem' }}>{ord.customer_name}</strong>
                              <br />
                              <span style={{ fontSize: '0.72rem', color: '#666' }}>{ord.customer_phone}</span>
                            </td>
                            <td style={{ maxWidth: '160px' }}>
                              <span style={{ fontSize: '0.8rem' }}>{ord.city}, {ord.state}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ord.items?.length || 0} items</span>
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.92rem' }}>₹{Number(ord.total_amount).toLocaleString('en-IN')}</strong>
                            </td>
                            <td>
                              <span className={`status-badge status-${ord.payment_status}`}>{ord.payment_status}</span>
                            </td>
                            <td>
                              <select
                                value={ord.order_status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="admin-select"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto' }}
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="paid">Paid</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => setViewingOrder(ord)}
                                className="btn-outline-dark"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* 3. PRODUCTS SECTION                                             */}
          {/* =============================================================== */}
          {activeSection === 'products' && (
            <div>
              <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Search title, category, fabric..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ paddingLeft: '2.2rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <select
                      className="admin-select"
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      style={{ width: 'auto', fontSize: '0.82rem' }}
                    >
                      <option value="all">All Categories</option>
                      {STANDARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button
                      onClick={() => handleOpenAddProduct()}
                      className="btn-primary"
                      id="add-product-btn"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={15} /> Add New Garment
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Garment</th>
                        <th>Category</th>
                        <th>Price (₹)</th>
                        <th>Stock</th>
                        <th>Showcase Flags</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(prod => (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={prod.images?.[0] || '/images/Golden-Hour Mediterranean Terrace Portrait.webp'}
                                alt=""
                                style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#F3F4F6' }}
                              />
                              <div>
                                <strong style={{ fontSize: '0.88rem' }}>{prod.name}</strong>
                                <br />
                                <span style={{ fontSize: '0.7rem', color: '#666', fontFamily: 'monospace' }}>slug: {prod.slug}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                              {prod.category}
                            </span>
                          </td>
                          <td>
                            <strong>₹{Number(prod.price).toLocaleString('en-IN')}</strong>
                            {prod.compare_at_price && Number(prod.compare_at_price) > Number(prod.price) && (
                              <span style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: '#9CA3AF', marginLeft: '4px' }}>
                                ₹{Number(prod.compare_at_price).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: prod.stock === 0 ? '#DC2626' : prod.stock < 5 ? '#D97706' : '#0E7B3B' }}>
                              {prod.stock} units
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleToggleProductFlag(prod.id, 'is_featured', prod.is_featured)}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '9999px',
                                  border: '1px solid',
                                  borderColor: prod.is_featured ? '#171717' : '#E5E7EB',
                                  backgroundColor: prod.is_featured ? '#171717' : '#FFF',
                                  color: prod.is_featured ? '#FFF' : '#666',
                                  cursor: 'pointer'
                                }}
                              >
                                {prod.is_featured ? '★ Featured' : 'Featured: Off'}
                              </button>
                              <button
                                onClick={() => handleToggleProductFlag(prod.id, 'is_new_arrival', prod.is_new_arrival)}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '9999px',
                                  border: '1px solid',
                                  borderColor: prod.is_new_arrival ? '#E50914' : '#E5E7EB',
                                  backgroundColor: prod.is_new_arrival ? '#FEF2F2' : '#FFF',
                                  color: prod.is_new_arrival ? '#E50914' : '#666',
                                  cursor: 'pointer'
                                }}
                              >
                                {prod.is_new_arrival ? '✦ New Arrival' : 'New: Off'}
                              </button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="btn-outline-dark"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                onClick={() => setDeletingProduct(prod)}
                                className="btn-outline-dark"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 4. CATEGORIES SECTION                                           */}
          {/* =============================================================== */}
          {activeSection === 'categories' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {categoryAnalytics.map(cat => (
                  <div key={cat.name} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem', margin: 0, color: '#171717' }}>{cat.name}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#F3F4F6', borderRadius: '4px', fontWeight: 600 }}>
                          {cat.count} Styles
                        </span>
                      </div>
                      {cat.sampleImage && (
                        <div style={{ height: '120px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem', backgroundColor: '#F3F4F6' }}>
                          <img src={cat.sampleImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#666' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Stock Units:</span>
                          <strong style={{ color: '#171717' }}>{cat.units} units</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Price Range:</span>
                          <strong style={{ color: '#171717' }}>
                            {cat.count > 0 ? `₹${cat.minPrice.toLocaleString('en-IN')} - ₹${cat.maxPrice.toLocaleString('en-IN')}` : 'N/A'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '1rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => { setActiveSection('products'); setProductCategoryFilter(cat.name); }}
                        className="btn-outline-dark"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                      >
                        Browse {cat.name}
                      </button>
                      <button
                        onClick={() => handleOpenAddProduct(cat.name)}
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        title={`Add garment to ${cat.name}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 5. INVENTORY & STOCK CONTROL                                    */}
          {/* =============================================================== */}
          {activeSection === 'inventory' && (
            <div>
              {/* Inventory KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Total Units</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.35rem 0', fontFamily: 'var(--font-editorial)' }}>{metrics.totalUnits}</h3>
                  <span style={{ fontSize: '0.72rem', color: '#0E7B3B' }}>Aggregated across all garments</span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Catalog Retail Valuation</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.35rem 0', fontFamily: 'var(--font-editorial)' }}>₹{metrics.totalValuation.toLocaleString('en-IN')}</h3>
                  <span style={{ fontSize: '0.72rem', color: '#666' }}>Combined inventory retail value</span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Low Stock Alert (&lt;5)</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.35rem 0', fontFamily: 'var(--font-editorial)', color: '#D97706' }}>{lowStockItems.length}</h3>
                  <span style={{ fontSize: '0.72rem', color: '#D97706' }}>Requires restock attention</span>
                </div>

                <div className="admin-stat-card">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Out of Stock (0)</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.35rem 0', fontFamily: 'var(--font-editorial)', color: '#DC2626' }}>
                    {products.filter(p => p.stock === 0).length}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#DC2626' }}>Sold out styles</span>
                </div>
              </div>

              {/* Filters */}
              <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Search inventory items..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      style={{ paddingLeft: '2.2rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setInventoryFilter('all')}
                      className={`filter-pill ${inventoryFilter === 'all' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setInventoryFilter('in')}
                      className={`filter-pill ${inventoryFilter === 'in' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Healthy (≥5)
                    </button>
                    <button
                      onClick={() => setInventoryFilter('low')}
                      className={`filter-pill ${inventoryFilter === 'low' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Low Stock (&lt;5)
                    </button>
                    <button
                      onClick={() => setInventoryFilter('out')}
                      className={`filter-pill ${inventoryFilter === 'out' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Out of Stock (0)
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Table with 1-Click Quick Updater */}
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Garment</th>
                        <th>Category</th>
                        <th>Unit Retail Price</th>
                        <th>Inventory Valuation</th>
                        <th>Current Stock</th>
                        <th>Quick Update Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map(prod => {
                        const currentVal = quickStockEdits[prod.id] !== undefined ? quickStockEdits[prod.id] : prod.stock;
                        const isSaving = quickStockSavingId === prod.id;
                        return (
                          <tr key={prod.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={prod.images?.[0] || '/images/Golden-Hour Mediterranean Terrace Portrait.webp'} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                <div>
                                  <strong style={{ fontSize: '0.85rem' }}>{prod.name}</strong>
                                  <br />
                                  <span style={{ fontSize: '0.7rem', color: '#666' }}>ID: #{prod.id}</span>
                                </div>
                              </div>
                            </td>
                            <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>{prod.category}</span></td>
                            <td><strong>₹{Number(prod.price).toLocaleString('en-IN')}</strong></td>
                            <td style={{ color: '#666', fontSize: '0.85rem' }}>
                              ₹{(Number(prod.price) * Number(prod.stock)).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: prod.stock === 0 ? '#DC2626' : prod.stock < 5 ? '#D97706' : '#0E7B3B' }}>
                                {prod.stock} units
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  className="admin-input"
                                  value={currentVal}
                                  onChange={(e) => setQuickStockEdits({ ...quickStockEdits, [prod.id]: e.target.value })}
                                  style={{ width: '75px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                                />
                                <button
                                  onClick={() => handleQuickStockSave(prod.id)}
                                  className="btn-outline-dark"
                                  disabled={isSaving || quickStockEdits[prod.id] === undefined || Number(quickStockEdits[prod.id]) === prod.stock}
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {isSaving ? <RefreshCw size={11} className="spin" /> : <Save size={11} />}
                                  <span>Save</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 6. CUSTOMERS SECTION                                            */}
          {/* =============================================================== */}
          {activeSection === 'customers' && (
            <div>
              <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Search customer name, email, phone, city..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      style={{ paddingLeft: '2.2rem' }}
                    />
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600 }}>
                    {filteredCustomers.length} Verified Boutique Clients
                  </span>
                </div>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <Users size={40} style={{ color: '#D1D5DB', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>No clients found</h4>
                  <p style={{ fontSize: '0.82rem', color: '#666' }}>Customer profiles will be generated automatically as orders are placed.</p>
                </div>
              ) : (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Contact Details</th>
                          <th>Primary Location</th>
                          <th>Orders Placed</th>
                          <th>Total Lifetime Spend</th>
                          <th>Latest Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((c, idx) => (
                          <tr key={idx}>
                            <td><strong style={{ fontSize: '0.88rem' }}>{c.name}</strong></td>
                            <td>
                              <span style={{ fontSize: '0.8rem' }}>{c.phone}</span>
                              <br />
                              <span style={{ fontSize: '0.72rem', color: '#666' }}>{c.email}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.8rem' }}>{c.city}, {c.state}</span>
                              <br />
                              <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>PIN: {c.pincode}</span>
                            </td>
                            <td><strong style={{ fontSize: '0.85rem' }}>{c.orderCount} orders</strong></td>
                            <td><strong style={{ fontSize: '0.92rem', color: '#0E7B3B' }}>₹{c.totalSpent.toLocaleString('en-IN')}</strong></td>
                            <td>
                              <button
                                onClick={() => {
                                  const ord = orders.find(o => o.id === c.lastOrderId);
                                  if (ord) setViewingOrder(ord);
                                }}
                                style={{ border: 'none', background: 'none', color: '#E50914', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem' }}
                              >
                                #{c.lastOrderId}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* 7. HOMEPAGE & PROMOTIONAL SHOWCASE                              */}
          {/* =============================================================== */}
          {activeSection === 'homepage' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Marquee Banner Control */}
              <div className="admin-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#E50914' }} /> Homepage Announcement Marquee
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
                  Set the continuous banner announcement broadcast across the top of the boutique website.
                </p>

                <form onSubmit={handleSaveSettings}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Banner Text</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settingsForm.announcement_banner || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcement_banner: e.target.value })}
                      placeholder="Complimentary Express Shipping on Orders Above ₹2,499"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={settingsSaving}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    {settingsSaving ? 'Saving...' : 'Update Announcement Banner'}
                  </button>
                </form>
              </div>

              {/* Homepage Featured Curation */}
              <div className="admin-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shirt size={18} /> Featured & New Arrivals Showcase
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
                  Toggle promotional placement on the boutique homepage grid.
                </p>

                <div style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {products.map(prod => (
                    <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={prod.images?.[0] || '/images/Golden-Hour Mediterranean Terrace Portrait.webp'} alt="" style={{ width: '36px', height: '46px', objectFit: 'cover', borderRadius: '2px' }} />
                        <div>
                          <strong style={{ fontSize: '0.82rem' }}>{prod.name}</strong>
                          <br />
                          <span style={{ fontSize: '0.72rem', color: '#666' }}>₹{prod.price}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleProductFlag(prod.id, 'is_featured', prod.is_featured)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: prod.is_featured ? '#171717' : '#D1D5DB',
                            backgroundColor: prod.is_featured ? '#171717' : '#FFF',
                            color: prod.is_featured ? '#FFF' : '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {prod.is_featured ? 'Featured ✓' : '+ Feature'}
                        </button>
                        <button
                          onClick={() => handleToggleProductFlag(prod.id, 'is_new_arrival', prod.is_new_arrival)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: prod.is_new_arrival ? '#E50914' : '#D1D5DB',
                            backgroundColor: prod.is_new_arrival ? '#FEF2F2' : '#FFF',
                            color: prod.is_new_arrival ? '#E50914' : '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {prod.is_new_arrival ? 'New ✓' : '+ New'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 8. REPORTS & ANALYTICS                                          */}
          {/* =============================================================== */}
          {activeSection === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Financial Summary */}
                <div className="admin-card">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} style={{ color: '#0E7B3B' }} /> Financial Realization
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>Realized Paid Revenue:</span>
                      <strong style={{ color: '#0E7B3B' }}>₹{metrics.totalRev.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>Pending Payment Orders:</span>
                      <strong>₹{orders.filter(o => o.payment_status === 'pending').reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>Average Basket Value:</span>
                      <strong>₹{metrics.aov.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                      <span style={{ color: '#666' }}>Active Catalog Valuation:</span>
                      <strong>₹{metrics.totalValuation.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Operations Velocity */}
                <div className="admin-card">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={16} /> Operational Fulfillment Velocity
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>Delivered Packages:</span>
                      <strong style={{ color: '#0E7B3B' }}>{orders.filter(o => o.order_status === 'delivered').length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>In Transit (Shipped):</span>
                      <strong style={{ color: '#0369A1' }}>{orders.filter(o => o.order_status === 'shipped').length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#666' }}>Awaiting Dispatch (Processing):</span>
                      <strong style={{ color: '#6D28D9' }}>{orders.filter(o => o.order_status === 'processing').length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                      <span style={{ color: '#666' }}>Total Orders Processed:</span>
                      <strong>{orders.length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 9. SETTINGS SECTION                                             */}
          {/* =============================================================== */}
          {activeSection === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div className="admin-card">
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={18} /> Boutique Operational Rules
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
                  Persisted directly to the Supabase PostgreSQL <code>store_settings</code> table.
                </p>

                <form onSubmit={handleSaveSettings}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Free Shipping Threshold (₹)</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={settingsForm.free_shipping_threshold || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, free_shipping_threshold: e.target.value })}
                      placeholder="2499"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Standard Shipping Fee (₹)</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={settingsForm.standard_shipping_fee || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, standard_shipping_fee: e.target.value })}
                      placeholder="150"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Studio Concierge Phone</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settingsForm.contact_phone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                      placeholder="9503917333"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Instagram Handle</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settingsForm.instagram_handle || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagram_handle: e.target.value })}
                      placeholder="@blushpune"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Boutique Location</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settingsForm.brand_location || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, brand_location: e.target.value })}
                      placeholder="Pune, Maharashtra, India"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={settingsSaving}
                    style={{ width: '100%', padding: '0.7rem' }}
                  >
                    {settingsSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </form>
              </div>

              {/* System Health Card */}
              <div className="admin-card">
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} style={{ color: '#0E7B3B' }} /> System Architecture & Security
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.25rem' }}>
                  Active infrastructure credentials and database guarantees.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                    <span style={{ color: '#666' }}>Database Engine:</span>
                    <strong>Supabase PostgreSQL (AWS ap-northeast-1)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                    <span style={{ color: '#666' }}>SSL Verification:</span>
                    <strong style={{ color: '#0E7B3B' }}>Enforced (Root CA Loaded)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                    <span style={{ color: '#666' }}>Payment Gateway:</span>
                    <strong>Razorpay Checkout & Webhooks</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                    <span style={{ color: '#666' }}>Authentication Protocol:</span>
                    <strong>Constant-Time Timing-Safe Token</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                    <span style={{ color: '#666' }}>Frontend Architecture:</span>
                    <strong>React 19 + Vite • Responsive Sidebar</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: ORDER DETAILS MODAL                                          */}
      {/* =================================================================== */}
      {viewingOrder && (
        <div className="admin-modal-backdrop" onClick={() => setViewingOrder(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>Order Summary</span>
                <h3 style={{ fontFamily: 'monospace', fontSize: '1.25rem', margin: '2px 0 0' }}>#{viewingOrder.id}</h3>
              </div>
              <button onClick={() => setViewingOrder(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: '#F9FAFB', padding: '0.85rem', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Client Contact</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingOrder.customer_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#4B5563' }}>{viewingOrder.customer_phone}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#666' }}>{viewingOrder.customer_email}</p>
                </div>

                <div style={{ backgroundColor: '#F9FAFB', padding: '0.85rem', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Delivery Address</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {viewingOrder.shipping_address}<br />
                    {viewingOrder.city}, {viewingOrder.state} - {viewingOrder.pincode}
                  </p>
                  {viewingOrder.order_notes && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#E50914', fontStyle: 'italic' }}>
                      Note: {viewingOrder.order_notes}
                    </p>
                  )}
                </div>

                <div style={{ backgroundColor: '#F9FAFB', padding: '0.85rem', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>Payment Reference</span>
                  <div style={{ margin: '4px 0' }}>
                    <span className={`status-badge status-${viewingOrder.payment_status}`}>{viewingOrder.payment_status}</span>
                  </div>
                  {viewingOrder.razorpay_payment_id && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                      ID: {viewingOrder.razorpay_payment_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ordered Garments ({viewingOrder.items?.length || 0})</h4>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Garment</th>
                      <th>Size / Color</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {it.image && <img src={it.image} alt="" style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />}
                            <strong style={{ fontSize: '0.82rem' }}>{it.product_name}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem' }}>{it.size || 'Standard'}</span>
                          {it.color && <span style={{ fontSize: '0.72rem', color: '#666', display: 'block' }}>{it.color}</span>}
                        </td>
                        <td>₹{Number(it.price).toLocaleString('en-IN')}</td>
                        <td>{it.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{(Number(it.price) * Number(it.quantity)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#666', display: 'block' }}>Order Status:</label>
                    <select
                      value={viewingOrder.order_status}
                      onChange={(e) => handleUpdateOrderStatus(viewingOrder.id, e.target.value)}
                      className="admin-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#666', display: 'block' }}>Payment Status:</label>
                    <select
                      value={viewingOrder.payment_status}
                      onChange={(e) => handleUpdateOrderStatus(viewingOrder.id, viewingOrder.order_status, e.target.value)}
                      className="admin-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>Total Amount:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#171717' }}>
                    ₹{Number(viewingOrder.total_amount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                           */}
      {/* =================================================================== */}
      {(isAddModalOpen || editingProduct) && (
        <div className="admin-modal-backdrop" onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem', margin: 0, color: '#171717' }}>
                {editingProduct ? `Edit Style: ${editingProduct.name}` : 'Add New Boutique Garment'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="admin-form-label">Garment Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Crimson Draped Satin Midi Dress"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Category *</label>
                  <select
                    className="admin-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {STANDARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">URL Slug (Optional)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="crimson-draped-satin-midi-dress"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="admin-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="3490"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Compare At / Strike Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                    placeholder="4290"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="admin-input"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="10"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Fabric Specification</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    placeholder="100% Poly-Satin with Chiffon Overlay"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Garment Care</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.care}
                  onChange={(e) => setFormData({ ...formData, care: e.target.value })}
                  placeholder="Dry clean only. Cool iron on reverse."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Editorial Description</label>
                <textarea
                  rows={3}
                  className="admin-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Silhouette details, tailoring cut, and styling suggestions..."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Available Sizes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {STANDARD_SIZES.map(s => {
                    const isSelected = formData.sizes.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          const next = isSelected ? formData.sizes.filter(x => x !== s) : [...formData.sizes, s];
                          setFormData({ ...formData, sizes: next });
                        }}
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: isSelected ? '#171717' : '#D1D5DB',
                          backgroundColor: isSelected ? '#171717' : '#FFF',
                          color: isSelected ? '#FFF' : '#374151',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {s} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Colours (Comma-separated)</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.colors.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Crimson Red, Blush Pink"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Garment Images (URLs)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter image URL or path (e.g. /images/...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-outline-dark"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setFormData({ ...formData, images: [...formData.images, newImageUrl.trim()] });
                        setNewImageUrl('');
                      }
                    }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Add Image
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {formData.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '60px', height: '75px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFF', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', margin: '1.25rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                  <span>Feature on Homepage</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.is_new_arrival} onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })} />
                  <span>Mark as New Arrival</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <button type="button" className="btn-outline-dark" onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Garment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                          */}
      {/* =================================================================== */}
      {deletingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setDeletingProduct(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Remove from Catalog?</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>"{deletingProduct.name}"</strong>? Previous customer purchase snapshots will remain preserved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button type="button" className="btn-outline-dark" onClick={() => setDeletingProduct(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }} onClick={handleDeleteProduct}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
