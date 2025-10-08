'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from './ui/Icons';
import { SectionWrapper, SectionTitle } from './ui/SectionWrapper';
import { reviewsData } from '../data/content';

export const ReviewsSection: React.FC = () => {
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviewsData.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, []);

  const goToReview = (index: number) => {
    setCurrentReview(index);
  };

  return (
    <SectionWrapper id="reviews" background="gray" padding="xl">
      <div className="max-w-5xl mx-auto">
        <SectionTitle>ماذا يقول عملاؤنا</SectionTitle>
        
        <motion.p 
          className="text-xl text-gray-600 text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          انضم إلى آلاف عملاء PIXORA السعداء
        </motion.p>

        {/* Main Review Display */}
        <div className="relative mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReview}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-3xl mx-auto relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -translate-y-16 translate-x-16" />
              
              <div className="relative z-10">
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      size={32}
                      filled={i < reviewsData[currentReview].rating}
                      className="text-yellow-400 mx-1"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 text-center mb-8 leading-relaxed" dir="auto">
                  &ldquo;{reviewsData[currentReview].text}&rdquo;
                </blockquote>

                {/* Customer Info */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">
                      {reviewsData[currentReview].name.charAt(0)}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">
                    {reviewsData[currentReview].name}
                  </h4>
                  <p className="text-gray-600">
                    {reviewsData[currentReview].location}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mb-12">
          {reviewsData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToReview(index)}
              className={`
                w-4 h-4 rounded-full transition-all duration-300
                ${index === currentReview 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`انتقل إلى التقييم ${index + 1}`}
            />
          ))}
        </div>

        {/* All Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviewsData.map((review, index) => (
            <motion.div
              key={review.id}
              className={`
                bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300
                ${index === currentReview 
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                  : 'hover:shadow-xl hover:scale-105'
                }
              `}
              onClick={() => goToReview(index)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon
                    key={i}
                    size={16}
                    filled={i < review.rating}
                    className="text-yellow-400"
                  />
                ))}
              </div>
              
              <p className="text-gray-700 text-sm mb-4 line-clamp-3" dir="auto">
                &ldquo;{review.text}&rdquo;
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {review.name}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {review.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { number: '4.9/5', label: 'متوسط التقييم' },
            { number: '150+', label: 'عملاء سعداء' },
            { number: '50+', label: 'ملفات محوّلة' },
            { number: '99.5%', label: 'نسبة النجاح' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
};