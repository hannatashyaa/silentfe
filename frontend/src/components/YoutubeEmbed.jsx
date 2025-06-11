// src/components/YouTubeEmbed.jsx
import React from 'react';

const YouTubeEmbed = ({ videoId, title, description }) => {
  return (
    <div className="youtube-card bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
      <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={`https://www.youtube.com/embed/91kmtjMvOR4`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        {description && <p className="text-gray-600 text-sm">{description}</p>}
      </div>
    </div>
  );
};

export default YouTubeEmbed;