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
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
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

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('Removed from Wishlist');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Saved to Wishlist');
        return [...prev, productId];
      }
    });
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
        toggleWishlist
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
