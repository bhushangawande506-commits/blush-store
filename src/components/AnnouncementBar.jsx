import React from 'react';

export const AnnouncementBar = () => {
  const announcements = [
    "Boutique Western Wear & Occasionwear",
    "Established 2014 in Pune",
    "Complimentary Express Shipping on Orders Above ₹2,499",
    "Hand-Finished Silhouettes & Tailored Fits",
    "Pan-India Delivery & Pune Studio Concierge"
  ];

  return (
    <div className="announcement-bar" id="announcement-bar" role="region" aria-label="Store Announcements">
      <div className="announcement-marquee">
        <div className="announcement-track">
          {/* Primary Sequence */}
          <div className="announcement-group">
            {announcements.map((text, idx) => (
              <React.Fragment key={`seq1-${idx}`}>
                <span className="announcement-text">{text}</span>
                <span className="announcement-dot" aria-hidden="true">•</span>
              </React.Fragment>
            ))}
          </div>
          {/* Seamless Duplicate Sequence */}
          <div className="announcement-group" aria-hidden="true">
            {announcements.map((text, idx) => (
              <React.Fragment key={`seq2-${idx}`}>
                <span className="announcement-text">{text}</span>
                <span className="announcement-dot" aria-hidden="true">•</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
