'use client'

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from './ui/Icons';
import { scrollToTop } from '../utils/helpers';

export const Footer: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {/* Scroll to Top Button */}
      <motion.button
        onClick={isClient ? scrollToTop : undefined}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowUpIcon size={24} />
      </motion.button>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PIXORA
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                  نحوّل ذكرياتك الثمينة إلى تجربة جميلة وسهلة.
                  إطارات رقمية مصممة بأناقة ومدعومة بالابتكار.
                </p>
              </motion.div>
            </div>

            {/* Quick Links */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h4 className="text-xl font-semibold mb-6">روابط سريعة</h4>
                <ul className="space-y-3">
                  {[
                    { name: 'أداة التحويل', href: '#converter' },
                    { name: 'كيف تعمل', href: '#guide' },
                    { name: 'الأسئلة الشائعة', href: '#faq' },
                    { name: 'التقييمات', href: '#reviews' },
                  ].map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Support */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h4 className="text-xl font-semibold mb-6">الدعم</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://wa.me/967734444726"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-400 transition-colors duration-200 hover:underline"
                    >
                      دعم واتساب
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:solapixora@gmail.com"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 hover:underline"
                    >
                      دعم البريد الإلكتروني
                    </a>
                  </li>
                  <li>
                    <span className="text-gray-400">تحويل ملفات مجاني</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Bottom Section */}
          <motion.div
            className="border-t border-gray-800 pt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-gray-400 text-center">
                <p>© {new Date().getFullYear()} PIXORA. جميع الحقوق محفوظة.</p>
                <p className="text-sm mt-1">ذكريات تُحفظ للأبد.</p>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  سياسة الخصوصية
                </a>
              </div>
            </div>

            {/* Made with love */}
            <div className="text-center mt-8 text-gray-500">
              <p className="flex items-center justify-center gap-2">
                صُنع بحب <span className="text-red-400 animate-pulse">❤️</span> للحفاظ على الذكريات
              </p>
            </div>
          </motion.div>
        </div>
      </footer>
    </>
  );
};