import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { X, ShieldCheck, Lock, ArrowRight, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

// Helper to normalize Indian phone numbers (handles +91, 91, or leading 0)
const normalizeIndianPhone = (phone) => {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

export const CheckoutModal = ({ onClose, onOrderSuccess }) => {
  const { cart, subtotal, shippingFee, totalAmount, clearCart, showToast } = useCart();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
    order_notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const nameInputRef = useRef(null);

  // Lock background scrolling and set initial focus
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, []);

  // Keyboard accessibility: Escape to close when not submitting
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  // Validation function
  const validateField = (name, value) => {
    switch (name) {
      case 'customer_name': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Full name is required';
        if (trimmed.length < 2) return 'Please enter your complete full name';
        return null;
      }
      case 'customer_email': {
        const trimmed = (value || '').trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!trimmed) return 'Valid email is required for invoice delivery';
        if (!emailRegex.test(trimmed)) return 'Please enter a valid email address (e.g. name@example.com)';
        return null;
      }
      case 'customer_phone': {
        const clean = normalizeIndianPhone(value);
        if (!(value || '').trim()) return 'Mobile number is required';
        if (clean.length !== 10) return 'Please enter a valid 10-digit mobile number';
        if (!/^[6-9]\d{9}$/.test(clean)) return 'Indian mobile numbers should start with 6, 7, 8, or 9';
        return null;
      }
      case 'shipping_address': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Delivery address is required';
        if (trimmed.length < 5) return 'Please provide complete street address with house/flat number';
        return null;
      }
      case 'city': {
        if (!(value || '').trim()) return 'City is required';
        return null;
      }
      case 'state': {
        if (!(value || '').trim()) return 'State is required';
        return null;
      }
      case 'pincode': {
        const clean = (value || '').replace(/\D/g, '');
        if (!(value || '').trim()) return 'PIN code is required';
        if (clean.length !== 6) return 'PIN code must be exactly 6 digits';
        if (!/^[1-9]\d{5}$/.test(clean)) return 'Please enter a valid Indian postal PIN code';
        return null;
      }
      default:
        return null;
    }
  };

  const validateAll = () => {
    const errs = {};
    const fieldsToValidate = [
      'customer_name',
      'customer_email',
      'customer_phone',
      'shipping_address',
      'city',
      'state',
      'pincode'
    ];

    fieldsToValidate.forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) errs[field] = err;
    });

    setErrors(errs);

    // Move focus to first invalid field
    if (Object.keys(errs).length > 0) {
      const fieldIdMap = {
        customer_name: 'checkout-name',
        customer_email: 'checkout-email',
        customer_phone: 'checkout-phone',
        shipping_address: 'checkout-address',
        city: 'checkout-city',
        state: 'checkout-state',
        pincode: 'checkout-pincode'
      };

      const firstInvalidField = fieldsToValidate.find(f => errs[f]);
      if (firstInvalidField) {
        const el = document.getElementById(fieldIdMap[firstInvalidField]);
        if (el) {
          el.focus();
        }
      }
    }

    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for field while customer types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAll()) return;

    if (cart.length === 0) {
      showToast('Your shopping bag is empty');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const cleanPhone = normalizeIndianPhone(formData.customer_phone);

    try {
      // 1. Send order payload to server for authoritative validation
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customer_phone: cleanPhone,
          items: cart.map(item => ({
            product_id: item.product_id || item.id,
            quantity: parseInt(item.quantity, 10) || 1,
            size: item.size || 'Regular',
            color: item.color || ''
          }))
        })
      });

      let orderData;
      try {
        orderData = await createRes.json();
      } catch (parseErr) {
        orderData = null;
      }

      if (!createRes.ok || !orderData?.success) {
        throw new Error(
          orderData?.error ||
          'Online checkout server is currently offline or unreachable. You can complete your order directly with our Pune boutique via WhatsApp.'
        );
      }

      const internalOrderId = orderData.orderId;

      // 2. Request Razorpay payment order
      const paymentOrderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: internalOrderId })
      });

      let paymentData;
      try {
        paymentData = await paymentOrderRes.json();
      } catch (parseErr) {
        paymentData = null;
      }

      if (!paymentOrderRes.ok || !paymentData?.success) {
        throw new Error(paymentData?.error || 'Failed to initialize payment gateway. Please contact our boutique directly.');
      }

      // Check if window.Razorpay SDK is available
      if (typeof window.Razorpay === 'function' && paymentData.gateway === 'razorpay') {
        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Blush',
          description: `Order ${internalOrderId} - Fashion Boutique`,
          image: BRAND_INFO.logo,
          order_id: paymentData.razorpayOrderId,
          prefill: {
            name: formData.customer_name,
            email: formData.customer_email,
            contact: cleanPhone
          },
          theme: {
            color: '#E50914'
          },
          handler: async function (response) {
            await verifyPayment({
              orderId: internalOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              showToast('Payment window closed. You can retry anytime.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test Sandbox verification flow
        console.log('Completing payment via authenticated test verification mode...');
        const mockPaymentId = `pay_${Date.now().toString().slice(-8)}`;
        await verifyPayment({
          orderId: internalOrderId,
          razorpay_order_id: paymentData.razorpayOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'test_signature_verified'
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setServerError(err.message || 'Payment processing error');
      setIsSubmitting(false);
    }
  };

  const verifyPayment = async (verifyPayload) => {
    try {
      const verifyRes = await fetch('/api/payment/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload)
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      clearCart();
      setIsSubmitting(false);
      onOrderSuccess(verifyPayload.orderId, {
        customerName: formData.customer_name,
        customerEmail: formData.customer_email,
        customerPhone: normalizeIndianPhone(formData.customer_phone),
        address: `${formData.shipping_address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        total: totalAmount,
        paymentId: verifyPayload.razorpay_payment_id
      });
    } catch (vErr) {
      setServerError(vErr.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      id="checkout-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="modal-content checkout-modal-container"
        id="checkout-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          id="close-checkout-modal-btn"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close checkout modal"
          type="button"
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-red)', marginBottom: '4px' }}>
            <Lock size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Secure Encrypted Checkout
            </span>
          </div>
          <h2 id="checkout-modal-title" style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem' }}>
            Complete Your Boutique Order
          </h2>
        </div>

        {serverError && (
          <div
            role="alert"
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              borderRadius: '4px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              border: '1px solid #FCA5A5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: '600' }}>{serverError}</span>
            </div>
            <a
              href={`${BRAND_INFO.whatsappUrl}?text=${encodeURIComponent(`Hello Blush, I would like to place an order for the garments in my bag (Total: ₹${totalAmount.toLocaleString('en-IN')})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              id="checkout-fallback-whatsapp-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px', marginTop: '4px' }}
            >
              Order via Boutique WhatsApp Instead
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="checkout-grid">
            {/* Form Fields */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Delivery & Contact Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label htmlFor="checkout-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Full Name <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="customer_name"
                    id="checkout-name"
                    className={`checkout-input ${errors.customer_name ? 'has-error' : ''}`}
                    placeholder="e.g. Priyal Sharma"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={Boolean(errors.customer_name)}
                    aria-describedby={errors.customer_name ? "error-customer_name" : undefined}
                  />
                  {errors.customer_name && (
                    <span id="error-customer_name" role="alert" className="checkout-error-msg">
                      <AlertCircle size={12} /> {errors.customer_name}
                    </span>
                  )}
                </div>

                <div className="checkout-row-2col">
                  <div>
                    <label htmlFor="checkout-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      Email Address <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      id="checkout-email"
                      className={`checkout-input ${errors.customer_email ? 'has-error' : ''}`}
                      placeholder="name@example.com"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      autoComplete="email"
                      inputMode="email"
                      aria-required="true"
                      aria-invalid={Boolean(errors.customer_email)}
                      aria-describedby={errors.customer_email ? "error-customer_email" : undefined}
                    />
                    {errors.customer_email && (
                      <span id="error-customer_email" role="alert" className="checkout-error-msg">
                        <AlertCircle size={12} /> {errors.customer_email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      Mobile Phone (10 digits) <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      id="checkout-phone"
                      className={`checkout-input ${errors.customer_phone ? 'has-error' : ''}`}
                      placeholder="e.g. 98765 43210"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      autoComplete="tel"
                      inputMode="tel"
                      aria-required="true"
                      aria-invalid={Boolean(errors.customer_phone)}
                      aria-describedby={errors.customer_phone ? "error-customer_phone" : undefined}
                    />
                    {errors.customer_phone && (
                      <span id="error-customer_phone" role="alert" className="checkout-error-msg">
                        <AlertCircle size={12} /> {errors.customer_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-address" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Shipping Street Address <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                  </label>
                  <textarea
                    name="shipping_address"
                    id="checkout-address"
                    rows={2}
                    className={`checkout-input ${errors.shipping_address ? 'has-error' : ''}`}
                    placeholder="House/Apartment number, building, street, landmark"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    autoComplete="street-address"
                    aria-required="true"
                    aria-invalid={Boolean(errors.shipping_address)}
                    aria-describedby={errors.shipping_address ? "error-shipping_address" : undefined}
                    style={{ width: '100%', resize: 'none', minHeight: '64px' }}
                  />
                  {errors.shipping_address && (
                    <span id="error-shipping_address" role="alert" className="checkout-error-msg">
                      <AlertCircle size={12} /> {errors.shipping_address}
                    </span>
                  )}
                </div>

                <div className="checkout-row-3col">
                  <div>
                    <label htmlFor="checkout-city" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      City <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="checkout-city"
                      className={`checkout-input ${errors.city ? 'has-error' : ''}`}
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      autoComplete="address-level2"
                      aria-required="true"
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "error-city" : undefined}
                    />
                    {errors.city && (
                      <span id="error-city" role="alert" className="checkout-error-msg">
                        <AlertCircle size={12} /> {errors.city}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-state" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      State <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="checkout-state"
                      className={`checkout-input ${errors.state ? 'has-error' : ''}`}
                      value={formData.state}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      autoComplete="address-level1"
                      aria-required="true"
                      aria-invalid={Boolean(errors.state)}
                      aria-describedby={errors.state ? "error-state" : undefined}
                    />
                    {errors.state && (
                      <span id="error-state" role="alert" className="checkout-error-msg">
                        <AlertCircle size={12} /> {errors.state}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-pincode" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      PIN Code <span style={{ color: '#E50914' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      id="checkout-pincode"
                      maxLength={6}
                      className={`checkout-input ${errors.pincode ? 'has-error' : ''}`}
                      placeholder="411001"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="postal-code"
                      aria-required="true"
                      aria-invalid={Boolean(errors.pincode)}
                      aria-describedby={errors.pincode ? "error-pincode" : undefined}
                    />
                    {errors.pincode && (
                      <span id="error-pincode" role="alert" className="checkout-error-msg">
                        <AlertCircle size={12} /> {errors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-notes" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Order Notes or Custom Instructions <span style={{ color: 'var(--color-secondary-grey)', fontWeight: '400', fontSize: '0.75rem' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="order_notes"
                    id="checkout-notes"
                    className="checkout-input"
                    placeholder="Specific delivery time, custom sizing notes, or gift message"
                    value={formData.order_notes}
                    onChange={handleInputChange}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary & Payment Button */}
            <div className="checkout-summary-box">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Summary
              </h3>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-secondary-grey)' }}>
                  <ShoppingBag size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.88rem' }}>Your shopping bag is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
                  {cart.map((item, idx) => {
                    const itemQty = parseInt(item.quantity, 10) || 1;
                    const itemPrice = typeof item.price === 'number' ? item.price : 0;
                    return (
                      <div key={`${item.product_id || item.id}-${item.size || idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <div style={{ paddingRight: '8px' }}>
                          <p style={{ fontWeight: '600', lineHeight: 1.3 }}>{item.name}</p>
                          <span style={{ color: 'var(--color-secondary-grey)', fontSize: '0.75rem' }}>
                            Qty: {itemQty} • Size: {item.size || 'Standard'}
                            {item.color ? ` • ${item.color}` : ''}
                          </span>
                        </div>
                        <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                          ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? <strong style={{ color: '#0E7B3B' }}>FREE</strong> : `₹${shippingFee}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px', fontSize: '1.1rem', fontWeight: '700' }}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Gateway Provider Info */}
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}>
                  <ShieldCheck size={16} style={{ color: '#0E7B3B', flexShrink: 0 }} /> Razorpay Secure Gateway
                </div>
                <p style={{ color: 'var(--color-secondary-grey)', lineHeight: 1.4, margin: 0 }}>
                  Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and EMI.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary"
                id="checkout-submit-pay-btn"
                style={{ width: '100%', marginTop: '1.25rem', minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={isSubmitting || cart.length === 0}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-animation" />
                    <span>Securing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
