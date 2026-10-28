import React from 'react';
import { X, Ruler } from 'lucide-react';

export const SizeGuideModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose} id="size-guide-modal-overlay">
      <div
        className="modal-content"
        id="size-guide-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close size guide">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-red)', marginBottom: '4px' }}>
          <Ruler size={18} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Boutique Sizing Reference
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Women's Garment Size Guide
        </h2>
        <p style={{ color: 'var(--color-secondary-grey)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          All measurements are in inches. For custom tailoring or assistance, contact our Pune boutique concierge.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Size</th>
                <th>Bust (inches)</th>
                <th>Waist (inches)</th>
                <th>Hips (inches)</th>
                <th>UK / IND</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>XS</strong></td>
                <td>32 - 33</td>
                <td>25 - 26</td>
                <td>35 - 36</td>
                <td>6 - 8</td>
              </tr>
              <tr>
                <td><strong>S</strong></td>
                <td>34 - 35</td>
                <td>27 - 28</td>
                <td>37 - 38</td>
                <td>8 - 10</td>
              </tr>
              <tr>
                <td><strong>M</strong></td>
                <td>36 - 37</td>
                <td>29 - 30</td>
                <td>39 - 40</td>
                <td>10 - 12</td>
              </tr>
              <tr>
                <td><strong>L</strong></td>
                <td>38 - 40</td>
                <td>31 - 33</td>
                <td>41 - 43</td>
                <td>12 - 14</td>
              </tr>
              <tr>
                <td><strong>XL</strong></td>
                <td>41 - 43</td>
                <td>34 - 36</td>
                <td>44 - 46</td>
                <td>14 - 16</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-soft-cream)', borderRadius: '4px', fontSize: '0.82rem' }}>
          <strong>How to measure:</strong>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '6px', color: 'var(--color-secondary-grey)', lineHeight: 1.6 }}>
            <li><strong>Bust:</strong> Measure around the fullest part of your chest with relaxed arms.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline, typically narrowest point above navel.</li>
            <li><strong>Hips:</strong> Stand with feet together and measure around fullest part of your hips.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
