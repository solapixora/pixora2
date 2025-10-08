'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { colors } from '../styles/colors';

interface HeroProps {
  onCTAClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCTAClick }) => {
  return (
    <div
      className="relative flex items-center justify-center w-full min-h-screen text-center text-white overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundColor: colors.primary[950] }}
    >
      {/* Subtle overlay only (no image background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
      
      <motion.div 
        className="relative z-10 flex flex-col items-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Main Heading */}
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 max-w-4xl mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          اجعل ذكرياتك جاهزة لـ{' '}
          <span 
            className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent"
          >
            PIXORA
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl text-blue-100 mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          حوّل واضغط الصور ومقاطع الفيديو لإطار PIXORA الرقمي — بسرعة، مجانًا وبأمان.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Button
            onClick={onCTAClick}
            variant="primary"
            size="xl"
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-2xl border-0 px-8 py-4 md:px-12 md:py-5 text-lg md:text-xl font-bold"
          >
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              ابدأ التحويل الآن
            </span>
          </Button>
        </motion.div>

        {/* Features List */}
        <motion.div
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {[
            { icon: '🚀', text: 'سرعة خاطفة' },
            { icon: '🔒', text: 'آمن وخصوصي' },
            { icon: '💎', text: 'جودة فائقة' },
          ].map((feature, index) => (
            <div key={index} className="flex items-center justify-center gap-3 text-blue-100">
              <span className="text-2xl">{feature.icon}</span>
              <span className="font-semibold text-lg">{feature.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};