import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import { BRAND_INFO } from '../data/products';

export const HeroVideo = ({ onShopNow, onExplorePartywear }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setVideoLoaded(true))
          .catch((err) => {
            console.log('Autoplay deferred by browser policy:', err.message);
          });
      }
    }
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
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
          src={BRAND_INFO.heroVideo}
          poster={BRAND_INFO.heroPoster}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
        >
          {/* Fallback source in case of original path */}
          <source src="/video/blush hiro section video desktop mode.mp4" type="video/mp4" />
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
