'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-4 text-white">{t('legal.privacy.title', 'Privacy Policy')}</h1>
        <p className="text-gray-400 mb-8">{t('legal.lastUpdated', 'Last Updated')}: {new Date().toLocaleDateString()}</p>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">1. {t('legal.privacy.section1.title')}</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">1.1 {t('legal.privacy.section1.subtitle1')}</h3>
                <p>{t('legal.privacy.section1.content1')}</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{t('legal.privacy.section1.item1')}</li>
                  <li>{t('legal.privacy.section1.item2')}</li>
                  <li>{t('legal.privacy.section1.item3')}</li>
                  <li>{t('legal.privacy.section1.item4')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 text-white">1.2 {t('legal.privacy.section1.subtitle2')}</h3>
                <p>{t('legal.privacy.section1.content2')}</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{t('legal.privacy.section1.item5')}</li>
                  <li>{t('legal.privacy.section1.item6')}</li>
                  <li>{t('legal.privacy.section1.item7')}</li>
                  <li>{t('legal.privacy.section1.item8')}</li>
                  <li>{t('legal.privacy.section1.item9')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">2. {t('legal.privacy.section2.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.privacy.section2.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.privacy.section2.item1')}</li>
                <li>{t('legal.privacy.section2.item2')}</li>
                <li>{t('legal.privacy.section2.item3')}</li>
                <li>{t('legal.privacy.section2.item4')}</li>
                <li>{t('legal.privacy.section2.item5')}</li>
                <li>{t('legal.privacy.section2.item6')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">3. {t('legal.privacy.section3.title')}</h2>
            <div className="text-gray-300 space-y-4">
              <p>{t('legal.privacy.section3.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.privacy.section3.item1')}</li>
                <li>{t('legal.privacy.section3.item2')}</li>
                <li>{t('legal.privacy.section3.item3')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">4. {t('legal.privacy.section4.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.privacy.section4.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.privacy.section4.item1')}</li>
                <li>{t('legal.privacy.section4.item2')}</li>
                <li>{t('legal.privacy.section4.item3')}</li>
                <li>{t('legal.privacy.section4.item4')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">5. {t('legal.privacy.section5.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.privacy.section5.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.privacy.section5.item1')}</li>
                <li>{t('legal.privacy.section5.item2')}</li>
                <li>{t('legal.privacy.section5.item3')}</li>
                <li>{t('legal.privacy.section5.item4')}</li>
              </ul>
              <p className="mt-4">{t('legal.privacy.section5.content2')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">6. {t('legal.privacy.section6.title')}</h2>
            <div className="text-gray-300 space-y-2">
              <p>{t('legal.privacy.section6.content')}</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>{t('legal.privacy.section6.item1')}</li>
                <li>{t('legal.privacy.section6.item2')}</li>
                <li>{t('legal.privacy.section6.item3')}</li>
                <li>{t('legal.privacy.section6.item4')}</li>
                <li>{t('legal.privacy.section6.item5')}</li>
                <li>{t('legal.privacy.section6.item6')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">7. {t('legal.privacy.section7.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.privacy.section7.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">8. {t('legal.privacy.section8.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.privacy.section8.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">9. {t('legal.privacy.section9.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.privacy.section9.content')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#fbb033]">10. {t('legal.privacy.section10.title')}</h2>
            <div className="text-gray-300">
              <p>{t('legal.privacy.section10.content')}</p>
              <ul className="mt-2 space-y-1">
                <li>{t('legal.privacy.section10.email')} : </li>
                <li>{t('legal.privacy.section10.address')} : </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
