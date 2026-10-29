import React, { useEffect, useState } from 'react';
import { MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { INSTAGRAM_POSTS_CONFIG } from '../data/instagramPosts';

const InstagramIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const InstagramSection = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Process embeds safely
    const processInstagramEmbeds = () => {
      if (window.instgrm && window.instgrm.Embeds) {
        try {
          window.instgrm.Embeds.process();
        } catch (e) {
          console.warn('Instagram Embeds.process caught error:', e);
        }
      }
    };

    // Load official Instagram embed script only once
    const SCRIPT_ID = 'instagram-embed-script';
    let scriptElement = document.getElementById(SCRIPT_ID);

    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = SCRIPT_ID;
      scriptElement.src = 'https://www.instagram.com/embed.js';
      scriptElement.async = true;
      scriptElement.onload = () => {
        setScriptLoaded(true);
        processInstagramEmbeds();
      };
      scriptElement.onerror = () => {
        console.warn('Instagram embed script failed to load (possibly blocked by privacy/ad-blocking extensions).');
      };
      document.body.appendChild(scriptElement);
    } else {
      setScriptLoaded(true);
      processInstagramEmbeds();
    }

    // Schedule processing after React mounts and reflows
    const timer1 = setTimeout(processInstagramEmbeds, 200);
    const timer2 = setTimeout(processInstagramEmbeds, 700);
    const timer3 = setTimeout(processInstagramEmbeds, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <section
      className="section"
      id="instagram-community-section"
      style={{ backgroundColor: 'var(--color-warm-white)', overflow: 'hidden' }}
      aria-label="Instagram Community Gallery"
    >
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <p className="section-eyebrow">Connect With Us</p>
          <h2 className="section-title">Follow @blushpune</h2>
          <p className="section-desc">
            Explore daily style lookbooks, behind-the-scenes fitting sessions, and new collection drops from our Pune boutique.
          </p>

          {/* Preserved Social CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.25rem',
              flexWrap: 'wrap'
            }}
          >
            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-dark"
              id="instagram-profile-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <InstagramIcon size={16} /> Follow on Instagram <ExternalLink size={14} />
            </a>
            <a
              href={`${BRAND_INFO.whatsappUrl}?text=${encodeURIComponent(
                "Hello Blush Boutique, I would like to enquire about your collection featured on Instagram."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              id="whatsapp-chat-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageCircle size={16} /> WhatsApp Enquiries
            </a>
          </div>
        </div>

        {/* Responsive Gallery Grid: 6 Unique Public Posts and Reels */}
        <div className="instagram-embed-grid" id="instagram-posts-container">
          {INSTAGRAM_POSTS_CONFIG.map((post) => (
            <div key={post.id} className="instagram-embed-card" id={`instagram-card-${post.id}`}>
              <blockquote
                className="instagram-media"
                data-instgrm-captioned
                data-instgrm-permalink={post.permalink}
                data-instgrm-version="14"
                style={{
                  background: '#FFFDFC',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(23, 23, 23, 0.04)',
                  margin: '0 auto',
                  width: '100%',
                  maxWidth: '540px',
                  minWidth: '260px',
                  padding: '0'
                }}
              >
                {/* Fallback card rendered while embed script loads or if blocked by client privacy tools */}
                <div className="instagram-fallback-card">
                  <div className="instagram-card-top">
                    <div className="instagram-card-brand">
                      <div className="instagram-avatar">
                        <img src={BRAND_INFO.logo} alt="Blush Pune" />
                      </div>
                      <div>
                        <span className="instagram-author">blushpune</span>
                        <span className="instagram-tag">
                          {post.type === 'reel' ? 'Instagram Reel' : 'Instagram Post'} • Pune
                        </span>
                      </div>
                    </div>
                    <InstagramIcon size={18} />
                  </div>

                  <div className="instagram-card-body">
                    <div className="instagram-pill">
                      <Sparkles size={11} style={{ color: 'var(--color-brand-red)' }} />
                      <span>{post.category}</span>
                    </div>
                    <p className="instagram-caption">{post.caption}</p>
                  </div>

                  <div className="instagram-card-footer">
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="instagram-view-cta"
                    >
                      View {post.type === 'reel' ? 'Reel' : 'Post'} on Instagram <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
