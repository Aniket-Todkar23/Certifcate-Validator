import React from 'react';
import PramanMitraLogo from './PramanMitraLogo';
import { SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Header = ({ title, subtitle, description }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white py-16 text-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-500/20 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-cyan-500/20 rounded-full blur-md animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        {/* Floating Icons */}
        <SparklesIcon className="absolute top-20 right-32 w-6 h-6 text-yellow-400/60 animate-bounce" style={{animationDelay: '3s'}} />
        <ShieldCheckIcon className="absolute bottom-32 left-20 w-8 h-8 text-blue-400/60 animate-pulse" style={{animationDelay: '1.5s'}} />
        <SparklesIcon className="absolute top-1/2 left-10 w-4 h-4 text-purple-400/60 animate-ping" style={{animationDelay: '2.5s'}} />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="transform hover:scale-105 transition-transform duration-500">
            <PramanMitraLogo size="xl" showText={true} animated={true} />
          </div>
        </div>
        
        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4 header-text-bright animate-fade-in">
          {title}
        </h1>
        
        {/* Subtitle with Animation */}
        <p className="text-xl md:text-2xl opacity-95 mb-4 text-blue-100 animate-slide-up" style={{animationDelay: '0.5s'}}>
          {subtitle}
        </p>
        
        {/* Description */}
        {description && (
          <p className="text-lg opacity-90 max-w-3xl mx-auto text-slate-200 animate-slide-up" style={{animationDelay: '1s'}}>
            {description}
          </p>
        )}
        
        {/* Decorative Elements */}
        <div className="flex justify-center items-center mt-8 space-x-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default Header;