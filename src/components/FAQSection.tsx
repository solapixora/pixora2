'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronIcon } from './ui/Icons';
import { SectionWrapper, SectionTitle } from './ui/SectionWrapper';
import { faqData } from '../data/content';

export const FAQSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <SectionWrapper id="faq" background="white" padding="xl">
      <div className="max-w-4xl mx-auto">
        <SectionTitle>الأسئلة الشائعة</SectionTitle>
        
        <motion.p 
          className="text-xl text-gray-600 text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          كل ما تحتاج معرفته حول أداة التحويل لدينا
        </motion.p>

        <div className="space-y-4">
          {faqData.map((item, index) => {
            const isOpen = openFaq === item.id;
            
            return (
              <motion.div
                key={item.id}
                className={`
                  border-2 rounded-2xl overflow-hidden transition-all duration-300
                  ${isOpen 
                    ? 'border-blue-200 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button
                  className="w-full px-6 py-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors duration-200"
                  onClick={() => toggleFaq(item.id)}
                  aria-expanded={isOpen}
                  style={{ textAlign: 'start' }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`
                        w-3 h-3 rounded-full transition-colors duration-200
                        ${isOpen ? 'bg-blue-500' : 'bg-gray-300'}
                      `} 
                    />
                    <h3
                      className="text-lg md:text-xl font-semibold text-gray-900"
                      dir="auto"
                      style={{ paddingInlineStart: '1rem' }}
                    >
                      {item.question}
                    </h3>
                  </div>
                  <ChevronIcon 
                    open={isOpen} 
                    className={`
                      flex-shrink-0 transition-colors duration-200
                      ${isOpen ? 'text-blue-500' : 'text-gray-400'}
                    `} 
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6" style={{ paddingInlineStart: '3.25rem' }}>
                        <div className="bg-white rounded-xl p-6 border border-blue-100">
                          <p className="text-gray-700 leading-relaxed text-lg" dir="auto">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          className="mt-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            هل لازلت تملك أسئلة؟
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            فريق الدعم لدينا هنا لمساعدتك في الحصول على أفضل تجربة مع PIXORA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/967734444726"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
            >
              <span>💬</span>
              دعم واتساب
            </a>
            <a
              href="mailto:solapixora@gmail.com"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>📧</span>
              راسلنا عبر البريد
            </a>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};