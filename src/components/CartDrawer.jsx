import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export const CartDrawer = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    freeShippingRemaining,
    totalAmount
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer"
        id="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} />
            <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem' }}>
              Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>
          </div>
          <button
            className="modal-close-btn"
            id="close-cart-drawer-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Tracker */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-border)' }}>
          {freeShippingRemaining > 0 ? (
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-near-black)', marginBottom: '6px' }}>
                Add <strong>₹{freeShippingRemaining.toLocaleString('en-IN')}</strong> more to enjoy <strong>Free Express Shipping</strong>!
              </p>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(23, 23, 23, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (subtotal / 2499) * 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-brand-red)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#0E7B3B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✓ You have unlocked Complimentary Express Shipping!
            </p>
          )}
        </div>

        {/* Cart Items List */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', margin: 'auto 0' }}>
              <ShoppingBag size={48} style={{ color: 'var(--color-border)', margin: '0 auto 1rem' }} />
              <h4 style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Your Bag is Empty
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-secondary-grey)', marginBottom: '1.5rem' }}>
                Discover elegant dresses, tops, and co-ords to fill your wardrobe.
              </p>
              <button
                className="btn-outline-dark"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.product_id}-${item.size}-${index}`} className="cart-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-img"
                />
                <div className="cart-item-details">
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '600', marginBottom: '4px' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-secondary-grey)' }}>
                      Size: <strong>{item.size}</strong> {item.color && `• Color: ${item.color}`}
                    </p>
                    <p style={{ fontSize: '0.88rem', fontWeight: '700', marginTop: '4px' }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        style={{ padding: '4px 8px', color: 'var(--color-near-black)' }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        style={{ padding: '4px 8px', color: 'var(--color-near-black)' }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Remove Item */}
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{ color: 'var(--color-secondary-grey)', padding: '4px', transition: 'color 0.2s' }}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--color-secondary-grey)' }}>Subtotal</span>
              <span style={{ fontWeight: '600' }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--color-secondary-grey)' }}>Estimated Shipping</span>
              <span>{shippingFee === 0 ? <strong style={{ color: '#0E7B3B' }}>FREE</strong> : `₹${shippingFee}`}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', paddingTop: '10px', borderTop: '1px solid var(--color-border)', fontSize: '1.1rem', fontWeight: '700' }}>
              <span>Total Payable</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <button
              className="btn-primary"
              id="cart-proceed-checkout-btn"
              style={{ width: '100%', marginBottom: '0.75rem' }}
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-secondary-grey)' }}>
              <ShieldCheck size={14} style={{ color: '#22c55e' }} /> 100% Encrypted & Authenticated Payments
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
