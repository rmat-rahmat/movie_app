'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

export default function TermsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#fbb033] hover:text-[#f69c05] mb-6 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>{t('common.back', 'Back')}</span>
        </button>

        {/* Header */}
        <h1 className="text-4xl font-bold mb-4 text-white">{t('legal.terms.title', 'Terms and Conditions')}</h1>
        <p className="text-gray-400 mb-8">{t('legal.lastUpdated', 'Last Updated')}: {new Date().toLocaleDateString()}</p>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">1. {t('legal.terms.section1.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.terms.section1.content1')}</p>
              <p>{t('legal.terms.section1.content2')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">2. {t('legal.terms.section2.title')}</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">2.1 {t('legal.terms.section2.subtitle1')}</h3>
                <p>{t('legal.terms.section2.content1')}</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{t('legal.terms.section2.item1')}</li>
                  <li>{t('legal.terms.section2.item2')}</li>
                  <li>{t('legal.terms.section2.item3')}</li>
                  <li>{t('legal.terms.section2.item4')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">2.2 {t('legal.terms.section2.subtitle2')}</h3>
                <p>{t('legal.terms.section2.content2')}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">3. {t('legal.terms.section3.title')}</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">3.1 {t('legal.terms.section3.subtitle1')}</h3>
                <p>{t('legal.terms.section3.content1')}</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">3.2 {t('legal.terms.section3.subtitle2')}</h3>
                <p>{t('legal.terms.section3.content2')}</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{t('legal.terms.section3.item1')}</li>
                  <li>{t('legal.terms.section3.item2')}</li>
                  <li>{t('legal.terms.section3.item3')}</li>
                  <li>{t('legal.terms.section3.item4')}</li>
                  <li>{t('legal.terms.section3.item5')}</li>
                  <li>{t('legal.terms.section3.item6')}</li>
                  <li>{t('legal.terms.section3.item7')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">4. {t('legal.terms.section4.title')}</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">4.1 {t('legal.terms.section4.subtitle1')}</h3>
                <p>{t('legal.terms.section4.content1')}</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{t('legal.terms.section4.item1')}</li>
                  <li>{t('legal.terms.section4.item2')}</li>
                  <li>{t('legal.terms.section4.item3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">4.2 {t('legal.terms.section4.subtitle2')}</h3>
                <p>{t('legal.terms.section4.content2')}</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">4.3 {t('legal.terms.section4.subtitle3')}</h3>
                <p>{t('legal.terms.section4.content3')}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">5. {t('legal.terms.section5.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.terms.section5.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">6. {t('legal.terms.section6.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.terms.section6.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.terms.section6.item1')}</li>
                <li>{t('legal.terms.section6.item2')}</li>
                <li>{t('legal.terms.section6.item3')}</li>
                <li>{t('legal.terms.section6.item4')}</li>
                <li>{t('legal.terms.section6.item5')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">7. {t('legal.terms.section7.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.terms.section7.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">8. {t('legal.terms.section8.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.terms.section8.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.terms.section8.item1')}</li>
                <li>{t('legal.terms.section8.item2')}</li>
                <li>{t('legal.terms.section8.item3')}</li>
                <li>{t('legal.terms.section8.item4')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">9. {t('legal.terms.section9.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.terms.section9.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">10. {t('legal.terms.section10.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.terms.section10.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.terms.section10.item1')}</li>
                <li>{t('legal.terms.section10.item2')}</li>
                <li>{t('legal.terms.section10.item3')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">11. {t('legal.terms.section11.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.terms.section11.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">12. {t('legal.terms.section12.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.terms.section12.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">13. {t('legal.terms.section13.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.terms.section13.content')}</p>
              <ul className="mt-2 space-y-1">
                <li>{t('legal.terms.section13.email')} : </li>
                <li>{t('legal.terms.section13.address')} : </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
