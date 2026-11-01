import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('blush_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('blush_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Clean and deduplicate IDs
      return Array.from(new Set(parsed)).filter(
        id => id !== null && id !== undefined && id !== ''
      );
    } catch (e) {
      console.error('Failed to parse blush_wishlist from localStorage', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('blush_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('blush_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (product, selectedSize, quantity = 1) => {
    if (!selectedSize) {
      showToast('Please select a size first');
      return false;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.product_id === product.id && item.size === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          showToast(`Maximum stock limit reached (${product.stock})`);
          return prevCart;
        }
        updated[existingIndex].quantity = newQty;
        showToast(`Updated quantity in Bag: ${product.name} (${selectedSize})`);
        return updated;
      } else {
        showToast(`Added to Bag: ${product.name} (${selectedSize})`);
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            size: selectedSize,
            color: product.colors?.[0] || '',
            quantity,
            image: product.images?.[0] || '',
            stock: product.stock
          }
        ];
      }
    });

    setIsCartOpen(true);
    return true;
  };

  const updateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      if (newQty > updated[index].stock) {
        showToast(`Only ${updated[index].stock} items available in stock`);
        return prev;
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    showToast('Item removed from shopping bag');
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInWishlist = (productId) => {
    if (productId === undefined || productId === null) return false;
    return wishlist.some(id => String(id) === String(productId));
  };

  const toggleWishlist = (productId) => {
    if (productId === undefined || productId === null) return;
    setWishlist(prev => {
      const exists = prev.some(id => String(id) === String(productId));
      if (exists) {
        showToast('Removed from Wishlist');
        return prev.filter(id => String(id) !== String(productId));
      } else {
        showToast('Saved to Wishlist');
        return [...prev, productId];
      }
    });
  };

  const removeFromWishlist = (productId) => {
    if (productId === undefined || productId === null) return;
    setWishlist(prev => {
      const exists = prev.some(id => String(id) === String(productId));
      if (exists) {
        showToast('Removed from Wishlist');
        return prev.filter(id => String(id) !== String(productId));
      }
      return prev;
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    showToast('Wishlist cleared');
  };

  const moveToBag = (product, selectedSize, quantity = 1) => {
    if (!selectedSize) {
      showToast('Please choose your size first');
      return false;
    }
    const success = addToCart(product, selectedSize, quantity);
    if (success) {
      removeFromWishlist(product.id);
      showToast(`Moved to Bag: ${product.name} (${selectedSize})`);
    }
    return success;
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 2499;
  const shippingFee = cart.length === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 150;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const totalAmount = subtotal + shippingFee;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        shippingFee,
        freeShippingRemaining,
        totalAmount,
        totalItemsCount,
        toastMessage,
        showToast,
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        moveToBag
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
