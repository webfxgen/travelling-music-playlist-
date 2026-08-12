import { useState, useRef, useEffect } from 'react';

const videos = [
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4", label: "Golden Hour" },
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4", label: "Still Water" },
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4", label: "Deep Woods" },
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4", label: "Quiet Dawn" }
];

interface SeamlessVideoProps {
  url: string;
  isActive: boolean;
}

function SeamlessVideo({ url, isActive }: SeamlessVideoProps) {
  const [activeBuffer, setActiveBuffer] = useState<1 | 2>(1);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Play/pause based on active tab state
  useEffect(() => {
    if (isActive) {
      if (activeBuffer === 1) {
        video1Ref.current?.play().catch(() => {});
      } else {
        video2Ref.current?.play().catch(() => {});
      }
    } else {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
      if (video1Ref.current) video1Ref.current.currentTime = 0;
      if (video2Ref.current) video2Ref.current.currentTime = 0;
    }
  }, [isActive, activeBuffer]);

  const handleTimeUpdate = (buffer: 1 | 2) => {
    if (!isActive) return;

    if (buffer === 1 && activeBuffer === 1) {
      const v1 = video1Ref.current;
      const v2 = video2Ref.current;
      if (v1 && v2 && v1.duration) {
        // Step 1: Warm up buffer 2 by calling play() slightly early at opacity-0
        if (v1.currentTime > v1.duration - 1.2 && v2.paused) {
          v2.currentTime = 0;
          v2.play().catch(() => {});
        }
        // Step 2: Trigger the opacity crossfade 0.9s early
        if (v1.currentTime > v1.duration - 0.9) {
          setActiveBuffer(2);
        }
      }
    } else if (buffer === 2 && activeBuffer === 2) {
      const v1 = video1Ref.current;
      const v2 = video2Ref.current;
      if (v1 && v2 && v2.duration) {
        // Step 1: Warm up buffer 1 by calling play() slightly early at opacity-0
        if (v2.currentTime > v2.duration - 1.2 && v1.paused) {
          v1.currentTime = 0;
          v1.play().catch(() => {});
        }
        // Step 2: Trigger the opacity crossfade 0.9s early
        if (v2.currentTime > v2.duration - 0.9) {
          setActiveBuffer(1);
        }
      }
    }
  };

  const handleTransitionEnd = (buffer: 1 | 2) => {
    // Pause and rewind offscreen buffer once transition opacity is fully faded
    if (buffer === 1 && activeBuffer === 2) {
      video1Ref.current?.pause();
      if (video1Ref.current) video1Ref.current.currentTime = 0;
    } else if (buffer === 2 && activeBuffer === 1) {
      video2Ref.current?.pause();
      if (video2Ref.current) video2Ref.current.currentTime = 0;
    }
  };

  const baseOpacityClass = isActive ? 'opacity-100' : 'opacity-0';

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${baseOpacityClass}`}>
      <video
        ref={video1Ref}
        src={url}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={() => handleTimeUpdate(1)}
        onTransitionEnd={() => handleTransitionEnd(1)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out transform-gpu ${
          activeBuffer === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />
      <video
        ref={video2Ref}
        src={url}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={() => handleTimeUpdate(2)}
        onTransitionEnd={() => handleTransitionEnd(2)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out transform-gpu ${
          activeBuffer === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />
    </div>
  );
}

function App() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [spotifyScale, setSpotifyScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 620) {
        // Fit 580px wide frame to mobile width with padding, min scale 0.5
        const newScale = Math.max(0.5, Math.min(1, (width - 32) / 580));
        setSpotifyScale(newScale);
      } else {
        setSpotifyScale(1);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVideoSwitch = (index: number) => {
    if (index === activeVideo || isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveVideo(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); // 1000ms transition cooldown
  };

  const isDeepWoods = activeVideo === 2;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black flex flex-col justify-between">
      
      {/* 1. Background Video Layer */}
      <div className="absolute inset-0 z-0 bg-black">
        {videos.map((vid, idx) => (
          <SeamlessVideo
            key={vid.url}
            url={vid.url}
            isActive={activeVideo === idx}
          />
        ))}
      </div>

      {/* 2. Transparent PNG Overlay (z-index 1) */}
      <img 
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 animate-train-bob"
        alt="Windshield reflection overlay"
      />

      {/* 3. Content Layer (z-index 2) */}
      <div className="relative z-20 flex flex-col justify-between h-full p-5 sm:p-8 md:p-10">
        
        {/* Top Middle Video Switcher Glass Pill */}
        <header className="w-full flex justify-center mt-2 select-none">
          <div className={`liquid-glass px-6 py-3 rounded-full flex items-center gap-6 sm:gap-8 transition-all duration-700 border ${
            isDeepWoods ? 'border-[#182C41]/25' : 'border-white/12'
          }`}>
            {videos.map((vid, idx) => {
              const isActive = activeVideo === idx;
              return (
                <button
                  key={vid.label}
                  onClick={() => handleVideoSwitch(idx)}
                  className={`text-xs sm:text-sm font-sans-system font-bold tracking-wide uppercase transition-all duration-700 cursor-pointer ${
                    isActive 
                      ? `${isDeepWoods ? 'text-[#182C41]' : 'text-white'} opacity-100` 
                      : `${isDeepWoods ? 'text-[#182C41]' : 'text-white'} opacity-50 hover:opacity-80`
                  }`}
                >
                  {vid.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Bottom Center Unified Container */}
        <div className="w-full flex flex-col items-center gap-4 mt-auto mb-2 select-none">
          
          {/* Spotify Music Player */}
          <footer 
            className="w-full flex justify-center pointer-events-auto overflow-visible relative"
            style={{ 
              height: `${152 * spotifyScale}px`, 
              minHeight: `${152 * spotifyScale}px`,
              transition: 'all 300ms ease-out' 
            }}
          >
            <div 
              className={`liquid-glass border transition-all duration-700 ${
                isDeepWoods ? 'border-[#182C41]/35' : 'border-white/12'
              }`}
              style={{ 
                width: '580px', 
                height: '152px', 
                transform: `scale(${spotifyScale})`,
                transformOrigin: 'top center',
                transition: 'all 300ms ease-out',
                position: 'absolute',
                top: 0,
                borderRadius: '12px'
              }}
            >
              {isMobile ? (
                <iframe 
                  data-testid="embed-iframe" 
                  style={{ borderRadius: '12px', border: 'none', width: '100%', height: '100%', opacity: 0.6 }} 
                  src="https://www.youtube.com/embed/zw_XhBrdwUI" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                />
              ) : (
                <iframe 
                  data-testid="embed-iframe" 
                  style={{ borderRadius: '12px', border: 'none', width: '100%', height: '100%', mixBlendMode: 'screen', opacity: 0.6 }} 
                  src="https://open.spotify.com/embed/playlist/3IpDoXyKOPgxJvUJYsagyM?utm_source=generator&theme=0&si=08a403c8efb34237" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                />
              )}
            </div>
          </footer>

          {/* Centered Promotion Badge (Entire card is clickable) */}
          <a 
            href="https://www.hanorastudio.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={`liquid-glass animate-border-glow border p-3 rounded-2xl max-w-md w-full flex flex-col items-center justify-center gap-1 text-xs font-sans-system transition-all duration-700 pointer-events-auto cursor-pointer hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] select-none ${
              isDeepWoods 
                ? 'text-[#182C41]/90 border-[#182C41]/35' 
                : 'text-white/90 border-white/20'
            }`}
            style={{
              transform: `scale(${spotifyScale})`,
              transformOrigin: 'top center',
              transition: 'all 300ms ease-out'
            }}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${isDeepWoods ? 'bg-[#182C41]' : 'bg-amber-400'} animate-pulse`} />
              <span>Design by Hanora Studio</span>
            </div>
            <p className={`leading-relaxed text-[11px] text-center ${isDeepWoods ? 'text-[#182C41]/80' : 'text-white/70'}`}>
              Create unforgettable moments with a personalized digital celebration page @299.
            </p>
          </a>

        </div>

      </div>

    </section>
  );
}

export default App;
