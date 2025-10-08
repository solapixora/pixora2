'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface SectionWrapperProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  background?: 'white' | 'gray' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const backgroundVariants = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  dark: 'bg-slate-900',
};

const paddingVariants = {
  sm: 'py-12 lg:py-16',
  md: 'py-16 lg:py-20',
  lg: 'py-20 lg:py-24',
  xl: 'py-24 lg:py-32',
};

const sectionVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" as const,
      staggerChildren: 0.1
    } 
  },
} as const;

export const SectionWrapper = React.forwardRef<HTMLElement, SectionWrapperProps>(({
  id,
  className = '',
  children,
  background = 'white',
  padding = 'lg',
}, ref) => {
  const backgroundClasses = backgroundVariants[background];
  const paddingClasses = paddingVariants[padding];

  return (
    <motion.section
      id={id}
      ref={ref}
      className={`w-full ${backgroundClasses} ${paddingClasses} ${className}`}
      variants={sectionVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {children}
      </div>
    </motion.section>
  );
});

SectionWrapper.displayName = 'SectionWrapper';

export const SectionTitle: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}> = ({ 
  children, 
  className = '',
  size = 'lg'
}) => {
  const sizeClasses = {
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl lg:text-5xl',
    xl: 'text-4xl md:text-5xl lg:text-6xl',
  };

  return (
    <motion.h2 
      className={`${sizeClasses[size]} font-bold text-center mb-6 md:mb-8 lg:mb-12 text-gray-900 leading-tight ${className}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {children}
    </motion.h2>
  );
};