import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showText = false
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeMap[size]} flex-shrink-0 flex items-center justify-center`}>
        <img
          src="/assets/dwps_logo.svg"
          alt="Disney World Public School Emblem - Knowledge is Our Magic"
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            // Fallback to shield symbol
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-[#021936] font-serif leading-tight text-base sm:text-lg">
            Disney World Public School
          </span>
          <span className="text-[11px] font-semibold text-[#904d00] tracking-wide">
            Knowledge is Our Magic • Ballabgarh
          </span>
        </div>
      )}
    </div>
  );
};
