'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper, SectionTitle } from './ui/SectionWrapper';

export const GuideSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'ارفع ملفاتك',
      description: 'حدد صورك ومقاطع الفيديو من أي جهاز',
      icon: '📁',
    },
    {
      number: 2,
      title: 'تحويل وضغط تلقائي',
      description: 'أداتنا تقوم بتحويل وضغط ملفاتك لتناسب منتجاتنا',
      icon: '⚡',
    },
    {
      number: 3,
      title: 'حمّل واستمتع',
      description: 'احصل على ملفاتك المحسّنة ثم ارفعها إلى PIXORA',
      icon: '✨',
    },
  ];

  return (
    <SectionWrapper id="guide" background="gray" padding="xl">
      <div className="max-w-6xl mx-auto">
        <SectionTitle>كيف تعمل</SectionTitle>
        
        <motion.p 
          className="text-xl text-gray-600 max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          اتبع هذه الخطوات الثلاث البسيطة لإعداد وسائطك لإطار PIXORA
        </motion.p>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 right-full w-full h-0.5 bg-gradient-to-l from-blue-300 to-purple-300 -z-10" />
              )}
              
              {/* Step Circle */}
              <div className="relative inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-2xl mb-6 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-10" />
                <div className="absolute -top-2 -left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                <span className="text-5xl" aria-hidden="true">{step.icon}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                <span dir="auto">{step.title}</span>
              </h3>
              
              <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto" dir="auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Video Tutorial */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              شاهد دليلنا السريع
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              شاهد عملية التحويل وتعرّف على نصائح للحصول على أفضل النتائج
            </p>
          </div>

          <div className="relative group">
            {/* Video Container */}
            <div className="relative w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="دليل محول PIXORA"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Video Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};