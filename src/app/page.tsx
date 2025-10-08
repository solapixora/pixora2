'use client'

import { useRef } from 'react'
import { Hero } from '../components/Hero'
import { ConverterTool } from '../components/ConverterTool'
import { AboutSection } from '../components/AboutSection'
import { GuideSection } from '../components/GuideSection'
import { FAQSection } from '../components/FAQSection'
import { ReviewsSection } from '../components/ReviewsSection'
import { SocialSection } from '../components/SocialSection'
import { Footer } from '../components/Footer'
import { scrollToElement } from '../utils/helpers'

export default function Home() {
  const converterRef = useRef<HTMLElement>(null)

  const handleCTAClick = () => {
    scrollToElement(converterRef.current)
  }

  return (
    <main className="antialiased overflow-x-hidden">
      <Hero onCTAClick={handleCTAClick} />
      <ConverterTool ref={converterRef} />
      <AboutSection />
      <GuideSection />
      <FAQSection />
      <ReviewsSection />
      <SocialSection />
      <Footer />
    </main>
  )
}
