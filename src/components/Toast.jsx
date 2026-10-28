import React from 'react';
import { useCart } from '../context/CartContext';
import { Check } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;

  return (
    <div className="toast-container" id="toast-notification-pill">
      <div className="toast-pill">
        <Check size={16} style={{ color: '#22c55e' }} />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
