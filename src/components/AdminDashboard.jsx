import React, { useState, useEffect } from 'react';
import { X, Shield, Package, DollarSign, RefreshCw, CheckCircle, Truck, AlertTriangle, Edit3, Save } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const AdminDashboard = ({ onClose }) => {
  const { showToast } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState(null);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'stats'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('Please enter your admin credentials.');
      return;
    }
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminKey.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthToken(data.token);
        fetchAdminData(data.token);
      } else {
        setAuthError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setAuthError('Authentication service unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async (token = authToken) => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-token': token }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // 2. Fetch orders
      const ordersRes = await fetch('/api/admin/orders', {
        headers: { 'x-admin-token': token }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.orders);

      // 3. Fetch products
      const prodsRes = await fetch('/api/products');
      const prodsData = await prodsRes.json();
      if (prodsData.success) setProducts(prodsData.products);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify({ order_status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} updated to "${newStatus}"`);
        fetchAdminData(authToken);
      }
    } catch (e) {
      showToast('Failed to update status');
    }
  };

  const handleSaveProduct = async (id) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify({
          price: Number(editPrice),
          stock: Number(editStock)
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Product inventory and price updated');
        setEditingProduct(null);
        fetchAdminData(authToken);
      }
    } catch (e) {
      showToast('Failed to update product');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="admin-dashboard-modal-overlay">
      <div
        className="modal-content"
        id="admin-dashboard-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1080px', width: '95%' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close admin">
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-near-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} style={{ color: '#E50914' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.8rem', lineHeight: 1 }}>
                Blush Boutique Management
              </h2>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-secondary-grey)' }}>
                Protected Operations & Order Fulfillment
              </span>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={fetchAdminData}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '0.4rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '2px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>
          )}
        </div>

        {/* Authentication Gate */}
        {!isAuthenticated ? (
          <div style={{ maxWidth: '380px', margin: '3rem auto', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Boutique Staff Authentication
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary-grey)', marginBottom: '1.5rem' }}>
              Enter your authorized management access key to view orders and edit inventory.
            </p>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                id="admin-key-input"
                className="search-input"
                placeholder="Enter admin password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                style={{ paddingLeft: '1rem', marginBottom: '1rem', textAlign: 'center' }}
                autoComplete="current-password"
              />

              {authError && (
                <p style={{ color: '#E50914', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                id="admin-login-btn"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Enter Admin Portal'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Nav Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <button
                className={`filter-pill ${activeTab === 'orders' ? 'active' : ''}`}
                id="admin-tab-orders"
                onClick={() => setActiveTab('orders')}
              >
                Orders ({orders.length})
              </button>
              <button
                className={`filter-pill ${activeTab === 'products' ? 'active' : ''}`}
                id="admin-tab-products"
                onClick={() => setActiveTab('products')}
              >
                Products & Inventory ({products.length})
              </button>
              <button
                className={`filter-pill ${activeTab === 'stats' ? 'active' : ''}`}
                id="admin-tab-stats"
                onClick={() => setActiveTab('stats')}
              >
                Revenue Metrics
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-soft-cream)', borderRadius: '4px' }}>
                    <Package size={36} style={{ color: 'var(--color-secondary-grey)', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>No orders recorded in database yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Contact & Address</th>
                          <th>Total Amount</th>
                          <th>Payment</th>
                          <th>Order Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <strong>#{ord.id}</strong>
                              <br />
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary-grey)' }}>
                                {new Date(ord.created_at).toLocaleDateString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <strong>{ord.customer_name}</strong>
                              <br />
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
                                {ord.customer_email}
                              </span>
                            </td>
                            <td style={{ maxWidth: '200px' }}>
                              <span>{ord.customer_phone}</span>
                              <br />
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
                                {ord.shipping_address}, {ord.city} - {ord.pincode}
                              </span>
                            </td>
                            <td>
                              <strong>₹{ord.total_amount.toLocaleString('en-IN')}</strong>
                            </td>
                            <td>
                              <span className={`status-badge status-${ord.payment_status}`}>
                                {ord.payment_status}
                              </span>
                              {ord.razorpay_payment_id && (
                                <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', marginTop: '2px' }}>
                                  {ord.razorpay_payment_id}
                                </p>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge status-${ord.order_status}`}>
                                {ord.order_status}
                              </span>
                            </td>
                            <td>
                              <select
                                style={{ fontSize: '0.75rem', padding: '3px 6px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                                value={ord.order_status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="paid">Paid</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price (₹)</th>
                      <th>Stock Inventory</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const isEditing = editingProduct === prod.id;
                      return (
                        <tr key={prod.id}>
                          <td>
                            <img
                              src={prod.images?.[0]}
                              alt=""
                              style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '2px' }}
                            />
                          </td>
                          <td>
                            <strong>{prod.name}</strong>
                          </td>
                          <td>{prod.category}</td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                className="search-input"
                                style={{ width: '90px', padding: '4px 8px' }}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                              />
                            ) : (
                              <span>₹{prod.price.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                className="search-input"
                                style={{ width: '70px', padding: '4px 8px' }}
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                              />
                            ) : (
                              <span style={{ fontWeight: '600', color: prod.stock < 5 ? '#E50914' : '#0E7B3B' }}>
                                {prod.stock} units
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                  onClick={() => handleSaveProduct(prod.id)}
                                >
                                  <Save size={12} /> Save
                                </button>
                                <button
                                  className="btn-outline-dark"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                  onClick={() => setEditingProduct(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn-outline-dark"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                onClick={() => {
                                  setEditingProduct(prod.id);
                                  setEditPrice(prod.price);
                                  setEditStock(prod.stock);
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: STATS */}
            {activeTab === 'stats' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ backgroundColor: 'var(--color-soft-cream)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary-grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Total Revenue (Paid)
                  </p>
                  <h3 style={{ fontSize: '2rem', fontWeight: '700' }}>
                    ₹{(stats?.total_revenue || 0).toLocaleString('en-IN')}
                  </h3>
                </div>

                <div style={{ backgroundColor: 'var(--color-soft-cream)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary-grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Total Paid Orders
                  </p>
                  <h3 style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {stats?.total_orders || 0}
                  </h3>
                </div>

                <div style={{ backgroundColor: 'var(--color-soft-cream)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary-grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Total Products in Inventory
                  </p>
                  <h3 style={{ fontSize: '2rem', fontWeight: '700' }}>
                    {stats?.total_products || products.length}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
                    {stats?.total_stock || 0} total units in stock
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
