'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { InstagramIcon, FacebookIcon, TikTokIcon } from './ui/Icons';
import { SectionWrapper, SectionTitle } from './ui/SectionWrapper';
import { socialLinks, contactInfo } from '../data/content';

export const SocialSection: React.FC = () => {
  const socialIcons = [
    { icon: InstagramIcon, href: socialLinks.instagram, name: 'إنستغرام', color: 'hover:text-pink-500' },
    { icon: FacebookIcon, href: socialLinks.facebook, name: 'فيسبوك', color: 'hover:text-blue-600' },
    { icon: TikTokIcon, href: socialLinks.tiktok, name: 'تيك توك', color: 'hover:text-black' },
  ];

  return (
    <SectionWrapper id="social" background="white" padding="xl">
      <div className="max-w-4xl mx-auto text-center">
        <SectionTitle>ابقَ على تواصل</SectionTitle>
        
        <motion.p 
          className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          تابعنا على وسائل التواصل الاجتماعي لآخر التحديثات والنصائح وقصص العملاء
        </motion.p>

        {/* Social Media Icons */}
        <motion.div 
          className="flex justify-center gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {socialIcons.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative p-6 bg-gray-50 rounded-2xl transition-all duration-300 
                hover:bg-white hover:shadow-xl hover:scale-110 ${social.color}
              `}
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <social.icon className="w-10 h-10 text-gray-700 group-hover:scale-110 transition-all duration-300" />
              
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {social.name}
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* WhatsApp */}
            <motion.a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-4 p-6 bg-green-50 rounded-2xl hover:bg-green-100 transition-all duration-300 hover:scale-105"
              whileHover={{ y: -2 }}
            >
              <span className="text-3xl">💬</span>
              <div style={{ textAlign: 'start' }}>
                <div className="font-semibold text-gray-900 group-hover:text-green-700">
                  واتساب
                </div>
                <div className="text-gray-600 group-hover:text-green-600" dir="ltr">
                  {contactInfo.whatsapp}
                </div>
              </div>
            </motion.a>

            {/* Email */}
            <motion.a
              href={socialLinks.email}
              className="group flex items-center justify-center gap-4 p-6 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all duration-300 hover:scale-105"
              whileHover={{ y: -2 }}
            >
              <span className="text-3xl">📧</span>
              <div style={{ textAlign: 'start' }}>
                <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                  البريد الإلكتروني
                </div>
                <div className="text-gray-600 group-hover:text-blue-600 break-all" dir="ltr">
                  {contactInfo.email}
                </div>
              </div>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};