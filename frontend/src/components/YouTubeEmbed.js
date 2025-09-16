import React from 'react';

const YouTubeEmbed = ({ videoUrl, title = "PramanMitra Demo", className = "" }) => {
  // Extract video ID from various YouTube URL formats
  const getVideoId = (url) => {
    if (!url) return null;
    
    // Handle youtu.be format
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split(/[?#]/)[0];
    }
    
    // Handle youtube.com/watch format
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get('v');
    }
    
    // Handle youtube.com/embed format
    if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
    }
    
    return null;
  };

  const videoId = getVideoId(videoUrl);

  if (!videoId) {
    return (
      <div className={`bg-slate-800 rounded-lg p-8 text-center ${className}`}>
        <p className="text-slate-400">Video not available</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-2xl">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default YouTubeEmbed;