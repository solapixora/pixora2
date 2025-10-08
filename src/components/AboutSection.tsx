'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper, SectionTitle } from './ui/SectionWrapper';
import Image from 'next/image';
import pixphoto from '../app/pixphoto.jpg';

export const AboutSection: React.FC = () => {
  return (
    <SectionWrapper id="about" background="white" padding="xl">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <SectionTitle className="mb-8" size="lg">
            حول PIXORA
          </SectionTitle>
          
          <div className="space-y-6 text-lg leading-relaxed text-gray-700">
            <p dir="auto">
              في PIXORA، نؤمن بأن ذكرياتك الثمينة تستحق أن تُعرض بأجمل شكل. صُممت إطاراتنا الرقمية بأناقة وبساطة لتجعل صورك ومقاطع الفيديو تنبض بالحياة بوضوح رائع.
            </p>
            
            <p dir="auto">
              تضمن أداة التحويل هذه أن تكون ملفاتك مُهيأة تمامًا لإطار PIXORA، لتوفير تشغيل سلس وجودة عرض واضحة. سواء كانت صور إجازة عائلية أو مقاطع لحظات مميزة، سنجعلها تبدو بأفضل شكل.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl opacity-50 blur-2xl" />
            
            {/* Main image */}
            <div className="relative w-full">
              <Image
                src={pixphoto}
                alt="إطار PIXORA الرقمي"
                width={1280}
                height={720}
                className="w-full h-auto object-contain rounded-2xl shadow-2xl"
                priority
                sizes="(min-width: 1024px) 600px, (min-width: 768px) 48rem, 100vw"
              />
            </div>
            
            {/* Floating elements */}
            <motion.div
              className="absolute -top-6 -right-6 bg-white p-4 rounded-full shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-2xl">📸</span>
            </motion.div>
            
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-full shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <span className="text-2xl">🎥</span>
            </motion.div>
          </div>

          {/* Feature badges */}
          <div className="absolute top-6 right-6 space-y-2">
            <span className="inline-block bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
             
            </span>
            <span className="block bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
             
            </span>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};