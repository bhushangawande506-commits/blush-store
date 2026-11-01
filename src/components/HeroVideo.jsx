import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export const HeroVideo = ({ onShopNow, onExplorePartywear }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce muted on the native DOM element for strict browser autoplay compliance
    video.muted = true;
    video.defaultMuted = true;

    let isSubscribed = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isSubscribed) setVideoPlaying(true);
        })
        .catch((err) => {
          console.log('Autoplay deferred by browser policy:', err.message);
          // Graceful one-time listener on first user tap/click without forcing playback on scroll
          const handleFirstInteraction = () => {
            if (video && video.paused) {
              video.play()
                .then(() => {
                  if (isSubscribed) setVideoPlaying(true);
                })
                .catch(() => {});
            }
          };
          window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
          window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, []);

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      try {
        video.muted = false;
        // In browsers with strict media policies, unmuting can pause media; ensure playback continues
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsMuted(video.muted);
      } catch (err) {
        console.warn('Playback with audio prevented by browser policy:', err);
        // Autoplay policy prevented unmuted playback: revert to muted so video continues uninterrupted
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <section className="hero-section" id="hero-section" aria-label="Featured Collection Showcase">
      {/* Background Video Wrapper */}
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          className="hero-video-element"
          id="hero-fashion-video"
          poster={BRAND_INFO.heroPoster}
          autoPlay
          loop
          muted={isMuted}
          defaultMuted
          playsInline
          preload="metadata"
          onPlaying={() => setVideoPlaying(true)}
          onVolumeChange={() => {
            if (videoRef.current) {
              setIsMuted(videoRef.current.muted);
            }
          }}
        >
          <source src={BRAND_INFO.heroVideo} type="video/mp4" />
          Your browser does not support HTML5 video playback.
        </video>
        <div className="hero-gradient-overlay" />
      </div>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-badge" id="hero-badge">
          <Sparkles size={14} style={{ color: '#E50914' }} />
          <span>Curated Western & Occasionwear</span>
        </div>

        <h1 className="hero-title" id="hero-title">
          Timeless Silhouettes, <br />
          <em>Effortless Sophistication</em>
        </h1>

        <p className="hero-subtitle" id="hero-subtitle">
          Established in 2014 in Pune. Discover signature evening dresses, coordinated sets,
          and contemporary western wear crafted for enduring elegance.
        </p>

        <div className="hero-cta-group">
          <button
            className="btn-primary"
            id="hero-shop-now-btn"
            onClick={onShopNow}
          >
            Shop The Collection <ArrowRight size={16} />
          </button>

          <button
            className="btn-secondary"
            id="hero-partywear-btn"
            onClick={onExplorePartywear}
          >
            Explore Partywear
          </button>
        </div>
      </div>

      {/* Floating Video Audio Control */}
      <div className="hero-video-controls">
        <button
          className="video-control-pill"
          id="hero-video-audio-toggle"
          onClick={toggleSound}
          title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
        >
          {isMuted ? (
            <>
              <VolumeX size={14} /> <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 size={14} style={{ color: '#E50914' }} /> <span>Sound On</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
