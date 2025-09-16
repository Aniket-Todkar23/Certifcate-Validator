import React, { useState, useEffect } from 'react';
import { PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

const VideoShowcase = ({ videoSrc, videoType = 'hosted', autoPlay = true }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay

  const handlePlayClick = () => {
    setShowVideo(true);
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlay) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowVideo(true);
      }, 1500); // 1.5 second delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // If we're unmuting, we might need to restart the video with sound
    if (isMuted && showVideo) {
      // Force re-render of the iframe with new mute state
      setShowVideo(false);
      setTimeout(() => setShowVideo(true), 100);
    }
  };

  // Render YouTube/Vimeo embed
  const renderHostedVideo = () => {
    if (videoType === 'youtube') {
      // Extract video ID from YouTube URL
      const videoId = videoSrc.includes('youtu.be/') 
        ? videoSrc.split('youtu.be/')[1]
        : videoSrc.split('v=')[1]?.split('&')[0];
      
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0${isMuted ? '&mute=1' : ''}`}
          title="PramanMitra Demo Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    } else if (videoType === 'vimeo') {
      const videoId = videoSrc.split('vimeo.com/')[1];
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1${isMuted ? '&muted=1' : ''}`}
          width="100%"
          height="100%"
          title="PramanMitra Demo Video"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    } else {
      // Local video file
      return (
        <video
          controls
          autoPlay
          muted={isMuted}
          playsInline // Better mobile support
          className="w-full h-full rounded-lg object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      );
    }
  };

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900/50"></div>
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-primary">
            See PramanMitra in Action
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Watch how our AI-powered certificate verification system detects fraud and ensures authenticity in real-time
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <span className="text-sm text-slate-400">🎥 Demo Video</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400">3 min watch</span>
          </div>
        </div>

        {/* Video Container with Card Design */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-card-enhanced p-2 md:p-3 lg:p-4 group hover:shadow-2xl transition-all duration-500">
            {/* Video Wrapper with Aspect Ratio */}
            <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 bg-slate-900">
                {isLoading ? (
                  /* Loading State */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                      </div>
                      <p className="text-white text-lg font-semibold">Loading Video...</p>
                      <p className="text-slate-400 text-sm mt-2">Preparing demo showcase</p>
                    </div>
                  </div>
                ) : !showVideo ? (
                  /* Video Thumbnail/Placeholder */
                  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80 cursor-pointer group"
                       onClick={handlePlayClick}>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    
                    {/* Animated Play Button */}
                    <button className="relative z-30 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-5 md:p-6 transform group-hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50">
                      <PlayIcon className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" />
                    </button>
                    
                    {/* Text below play button */}
                    <div className="absolute bottom-6 left-0 right-0 text-center z-30">
                      <p className="text-white text-lg font-semibold">Watch Demo Video</p>
                      <p className="text-slate-300 text-sm mt-1">See PramanMitra in action</p>
                    </div>

                    {/* Decorative pulse effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-500/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 bg-purple-500/20 rounded-full animate-ping animation-delay-200"></div>
                    </div>
                  </div>
                ) : (
                  /* Video Player */
                  <div className="w-full h-full relative">
                    {renderHostedVideo()}
                    {/* Mute/Unmute Button */}
                    <button
                      onClick={toggleMute}
                      className="absolute bottom-4 right-4 z-40 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <SpeakerXMarkIcon className="w-5 h-5" />
                      ) : (
                        <SpeakerWaveIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Decorative Border Gradient */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>

          {/* Feature Highlights below video */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center glass-card-enhanced p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-100">Real-time Processing</h3>
              <p className="text-slate-400 text-sm">Instant verification with AI-powered analysis</p>
            </div>
            
            <div className="text-center glass-card-enhanced p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-100">Smart Detection</h3>
              <p className="text-slate-400 text-sm">Advanced algorithms identify even subtle forgeries</p>
            </div>
            
            <div className="text-center glass-card-enhanced p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-100">Database Verification</h3>
              <p className="text-slate-400 text-sm">Cross-reference with official institution records</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;