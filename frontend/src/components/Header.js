import React from 'react';

const Header = ({ title, subtitle, description }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white py-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">{title}</h1>
        <p className="text-lg opacity-95 mb-2">{subtitle}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
    </div>
  );
};

export default Header;