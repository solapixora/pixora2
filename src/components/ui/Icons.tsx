import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const UploadIcon: React.FC<IconProps> = ({ className = "", size = 48 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`text-gray-400 ${className}`}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const ChevronIcon: React.FC<IconProps & { open?: boolean }> = ({ 
  className = "", 
  size = 20, 
  open = false 
}) => (
  <svg
    className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = "", size = 28 }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ className = "", size = 28 }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const TikTokIcon: React.FC<IconProps> = ({ className = "", size = 28 }) => (
  <svg 
    viewBox="0 0 256 256" 
    className={className} 
    width={size} 
    height={size} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="currentColor"
  >
    <path d="M157.3 46.9c-6.4-2.6-13.2-3.9-20.2-3.9-1.3 0-2.6.03-3.9.08v70.7c0 20.3-16.4 36.7-36.7 36.7-20.2 0-36.6-16.4-36.6-36.7s16.4-36.7 36.6-36.7c2.5 0 5 .3 7.4.9v-39.2c-6.7-2.6-13.8-4-21.3-4-34 0-61.6 27.6-61.6 61.6s27.6 61.6 61.6 61.6c34 0 61.6-27.6 61.6-61.6V61.1c12.1 5.7 25.6 8.9 39.5 9v-23.6c-12.3-.2-24.3-3-35.0-8.6z" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ 
  className = "", 
  size = 20, 
  filled = false 
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);