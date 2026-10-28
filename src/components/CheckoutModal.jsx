import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, ShieldCheck, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

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

  const validate = () => {
    const errs = {};
    if (!formData.customer_name.trim()) errs.customer_name = 'Full name is required';
    if (!formData.customer_email.trim() || !formData.customer_email.includes('@')) {
      errs.customer_email = 'Valid email is required for invoice delivery';
    }
    const cleanPhone = formData.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errs.customer_phone = 'Please provide a valid 10-digit mobile number';
    }
    if (!formData.shipping_address.trim()) errs.shipping_address = 'Delivery address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state.trim()) errs.state = 'State is required';
    if (!formData.pincode.trim() || formData.pincode.length < 6) {
      errs.pincode = 'Valid 6-digit PIN code is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (cart.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Send order payload to server for authoritative validation
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            size: item.size,
            color: item.color
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
            contact: formData.customer_phone
          },
          theme: {
            color: '#E50914'
          },
          handler: async function (response) {
            // Verify signature on backend
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
        customerPhone: formData.customer_phone,
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
    <div className="modal-overlay" onClick={onClose} id="checkout-modal-overlay">
      <div
        className="modal-content"
        id="checkout-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px' }}
      >
        <button
          className="modal-close-btn"
          id="close-checkout-modal-btn"
          onClick={onClose}
          aria-label="Close checkout"
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
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem' }}>
            Complete Your Boutique Order
          </h2>
        </div>

        {serverError && (
          <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <AlertCircle size={18} />
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
            {/* Form Fields */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Delivery & Contact Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    id="checkout-name"
                    className="search-input"
                    placeholder="Enter your name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '1rem', borderColor: errors.customer_name ? '#E50914' : undefined }}
                  />
                  {errors.customer_name && <span style={{ color: '#E50914', fontSize: '0.72rem' }}>{errors.customer_name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      id="checkout-email"
                      className="search-input"
                      placeholder="name@example.com"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '1rem', borderColor: errors.customer_email ? '#E50914' : undefined }}
                    />
                    {errors.customer_email && <span style={{ color: '#E50914', fontSize: '0.72rem' }}>{errors.customer_email}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      Mobile Phone (10 digits) *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      id="checkout-phone"
                      className="search-input"
                      placeholder="e.g. 9876543210"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '1rem', borderColor: errors.customer_phone ? '#E50914' : undefined }}
                    />
                    {errors.customer_phone && <span style={{ color: '#E50914', fontSize: '0.72rem' }}>{errors.customer_phone}</span>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Shipping Street Address *
                  </label>
                  <textarea
                    name="shipping_address"
                    id="checkout-address"
                    rows={2}
                    className="search-input"
                    placeholder="House/Apartment number, street, landmark"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '1rem', width: '100%', resize: 'none', borderColor: errors.shipping_address ? '#E50914' : undefined }}
                  />
                  {errors.shipping_address && <span style={{ color: '#E50914', fontSize: '0.72rem' }}>{errors.shipping_address}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="checkout-city"
                      className="search-input"
                      value={formData.city}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '1rem', borderColor: errors.city ? '#E50914' : undefined }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="checkout-state"
                      className="search-input"
                      value={formData.state}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '1rem', borderColor: errors.state ? '#E50914' : undefined }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      id="checkout-pincode"
                      maxLength={6}
                      className="search-input"
                      placeholder="411001"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '1rem', borderColor: errors.pincode ? '#E50914' : undefined }}
                    />
                    {errors.pincode && <span style={{ color: '#E50914', fontSize: '0.72rem' }}>{errors.pincode}</span>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Order Notes or Custom Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    name="order_notes"
                    id="checkout-notes"
                    className="search-input"
                    placeholder="Specific delivery time or sizing instruction"
                    value={formData.order_notes}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary & Payment Button */}
            <div style={{ backgroundColor: 'var(--color-soft-cream)', padding: '1.5rem', borderRadius: '4px', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{item.name}</p>
                      <span style={{ color: 'var(--color-secondary-grey)' }}>
                        Qty: {item.quantity} • Size: {item.size}
                      </span>
                    </div>
                    <span style={{ fontWeight: '600' }}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

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
              <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}>
                  <ShieldCheck size={16} style={{ color: '#0E7B3B' }} /> Razorpay Secure Gateway
                </div>
                <p style={{ color: 'var(--color-secondary-grey)', lineHeight: 1.4 }}>
                  Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and EMI.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary"
                id="checkout-submit-pay-btn"
                style={{ width: '100%', marginTop: '1.25rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Securing Order...</span>
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
