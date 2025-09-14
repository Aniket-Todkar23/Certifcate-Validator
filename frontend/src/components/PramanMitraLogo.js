import React from 'react';
import { ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PramanMitraLogo = ({ size = 'large', showText = true, animated = true }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${animated ? 'group' : ''}`}>
      {/* Logo Icon */}
      <div className="relative">
        {/* Main Shield */}
        <div className={`${sizeClasses[size]} relative`}>
          <ShieldCheckIcon 
            className={`w-full h-full text-primary-400 ${animated ? 'group-hover:text-primary-300 transition-all duration-500 group-hover:scale-110' : ''}`} 
          />
          
          {/* Sparkles Animation */}
          {animated && (
            <>
              <SparklesIcon 
                className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse opacity-80"
              />
              <SparklesIcon 
                className="absolute -bottom-1 -left-1 w-3 h-3 text-blue-400 animate-bounce opacity-60"
                style={{ animationDelay: '0.5s' }}
              />
              <SparklesIcon 
                className="absolute top-1/2 -right-2 w-2 h-2 text-purple-400 animate-ping opacity-70"
                style={{ animationDelay: '1s' }}
              />
            </>
          )}
        </div>

        {/* Rotating Ring */}
        {animated && (
          <div className="absolute inset-0 border-2 border-primary-500/30 rounded-full animate-spin-slow opacity-50"></div>
        )}

        {/* Pulsing Outer Glow */}
        {animated && (
          <div className="absolute inset-0 bg-primary-400/20 rounded-full animate-pulse scale-150 -z-10"></div>
        )}
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold logo-text-bright ${animated ? 'transition-all duration-500' : ''}`}>
            PramanMitra
          </h1>
          <p className={`${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'} text-blue-200 font-medium tracking-wide ${animated ? 'group-hover:text-blue-100 transition-colors duration-300' : ''}`}>
            प्रमाण मित्र
          </p>
          {(size === 'large' || size === 'xl') && (
            <p className="text-xs text-slate-300 mt-1 font-light italic">Certificate Guardian</p>
          )}
        </div>
      )}
    </div>
  );
};

// Add custom animation classes to Tailwind
const customStyles = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.3);
    }
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite alternate;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

export default PramanMitraLogo;