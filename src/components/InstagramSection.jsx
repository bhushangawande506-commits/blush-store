import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Heart, Send, Bookmark, Play } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { INSTAGRAM_POSTS_CONFIG } from '../data/instagramPosts';

const InstagramIcon = ({ size = 16, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const InstagramSection = () => {
  const [likedPosts, setLikedPosts] = useState({});

  const toggleLike = (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <section
      className="section instagram-section"
      id="instagram-community-section"
      aria-label="Instagram Community Gallery"
    >
      {/* Decorative cursive script accent on top right */}
      <div className="insta-accent-callout" aria-hidden="true">
        <span>Style</span><br />
        <span>Inspiration</span><br />
        <span>Updates 💕</span>
      </div>

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
          {INSTAGRAM_POSTS_CONFIG.map((post) => {
            const isLiked = likedPosts[post.id];
            return (
              <article
                key={post.id}
                className="instagram-embed-card"
                id={`instagram-card-${post.id}`}
                data-instgrm-permalink={post.permalink}
              >
                {/* Card Top: Brand avatar, handle, subtitle & View profile button */}
                <div className="insta-card-header">
                  <a
                    href={BRAND_INFO.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insta-card-user"
                    title="View @blushpune profile"
                  >
                    <div className="insta-card-avatar">
                      <img src={BRAND_INFO.logo} alt="Blush Pune" />
                    </div>
                    <div className="insta-card-meta">
                      <span className="insta-card-name">blushpune</span>
                      <span className="insta-card-sub">{post.subtitle || 'blushpune'}</span>
                    </div>
                  </a>

                  <a
                    href={BRAND_INFO.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insta-card-follow-btn"
                  >
                    View profile
                  </a>
                </div>

                {/* Card Media: 1:1 Aspect Ratio thumbnail with Reel play badge */}
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insta-card-media"
                  aria-label={`View ${post.category} on Instagram`}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="insta-card-img"
                    loading="lazy"
                  />
                  {post.type === 'reel' && (
                    <div className="insta-play-badge" title="Watch reel on Instagram">
                      <Play size={16} fill="white" strokeWidth={0} />
                    </div>
                  )}
                </a>

                {/* Card Footer: View more on Instagram link & Action icons */}
                <div className="insta-card-footer">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insta-card-permalink"
                  >
                    View more on Instagram
                  </a>

                  <div className="insta-card-actions">
                    <div className="insta-card-actions-left">
                      <button
                        type="button"
                        onClick={(e) => toggleLike(post.id, e)}
                        className={`insta-action-btn ${isLiked ? 'liked' : ''}`}
                        aria-label={isLiked ? "Unlike post" : "Like post"}
                        title={isLiked ? "Liked" : "Like"}
                      >
                        <Heart
                          size={18}
                          fill={isLiked ? "#E50914" : "none"}
                          stroke={isLiked ? "#E50914" : "#262626"}
                          strokeWidth={isLiked ? 0 : 1.75}
                        />
                      </button>

                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insta-action-btn"
                        aria-label="Comment on Instagram"
                        title="Comment"
                      >
                        <MessageCircle size={18} stroke="#262626" strokeWidth={1.75} />
                      </a>

                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insta-action-btn"
                        aria-label="Share on Instagram"
                        title="Share"
                      >
                        <Send size={18} stroke="#262626" strokeWidth={1.75} />
                      </a>
                    </div>

                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="insta-action-btn"
                      aria-label="Save on Instagram"
                      title="Save"
                    >
                      <Bookmark size={18} stroke="#262626" strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA Button: Instagram Gradient Pill with Sparkle Accents */}
        <div className="insta-bottom-cta-wrapper">
          <div className="insta-cta-inner">
            <span className="insta-sparkle-decor insta-sparkle-left" aria-hidden="true">✦ ✧</span>
            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-instagram-gradient"
              id="instagram-explore-cta"
            >
              <InstagramIcon size={18} />
              <span>EXPLORE MORE ON INSTAGRAM</span>
              <ExternalLink size={15} />
            </a>
            <span className="insta-sparkle-decor insta-sparkle-right" aria-hidden="true">✧ ✦</span>
          </div>
        </div>
      </div>
    </section>
  );
};
