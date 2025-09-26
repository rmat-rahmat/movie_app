'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { FiUser, FiGlobe, FiChevronDown, FiPlay, FiStar } from "react-icons/fi";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function ProfileEmpty() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    useEffect(() => {
    }, []);

    const handleSignIn = () => {
        router.push('/auth/login');
    };

    const handleRegister = () => {
        router.push('/auth/register');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-[#fbb033]/5 to-transparent rounded-full"></div>
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-[#f69c05]/5 to-transparent rounded-full"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col justify-center items-center">
                {/* Language Switcher - Top Right */}
                <div className="absolute top-4 left-4 z-50">

                            <LanguageSwitcher  />
                    </div>

                {/* Main Content */}
                <div className="text-center max-w-2xl mx-auto space-y-8">
                    {/* Hero Icon */}
                    <div className="relative">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#fbb033] to-[#f69c05] rounded-full flex items-center justify-center shadow-2xl">
                            <FiUser className="w-16 h-16 text-black" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <FiPlay className="w-4 h-4 text-white ml-1" />
                        </div>
                    </div>

                    {/* Main Heading */}
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#fbb033] to-[#f69c05] bg-clip-text text-transparent">
                            {t('profileEmpty.welcome', 'Welcome to OTalk TV')}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 font-light">
                            {t('profileEmpty.subtitle', 'Your entertainment journey starts here')}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-6 my-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#fbb033]/20 rounded-lg flex items-center justify-center mb-4">
                                <FiPlay className="w-6 h-6 text-[#fbb033]" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{t('profileEmpty.feature1Title', 'Unlimited Movies')}</h3>
                            <p className="text-sm text-gray-400">{t('profileEmpty.feature1Desc', 'Stream thousands of movies and TV shows')}</p>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#fbb033]/20 rounded-lg flex items-center justify-center mb-4">
                                <FiStar className="w-6 h-6 text-[#fbb033]" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{t('profileEmpty.feature2Title', 'Personalized')}</h3>
                            <p className="text-sm text-gray-400">{t('profileEmpty.feature2Desc', 'Get recommendations based on your taste')}</p>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#fbb033]/20 rounded-lg flex items-center justify-center mb-4">
                                <FiGlobe className="w-6 h-6 text-[#fbb033]" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{t('profileEmpty.feature3Title', 'Multi-language')}</h3>
                            <p className="text-sm text-gray-400">{t('profileEmpty.feature3Desc', 'Content in multiple languages')}</p>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="space-y-6">
                        <p className="text-lg text-gray-300">
                            {t('profileEmpty.encourageText', 'Join millions of users and discover your next favorite show')}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={handleSignIn}
                                className="w-full sm:w-auto bg-gradient-to-r from-[#fbb033] to-[#f69c05] text-black font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:shadow-[#fbb033]/25 transition-all duration-300 transform hover:scale-105"
                            >
                                {t('auth.loginButton', 'Sign In')}
                            </button>
                            
                            <button
                                onClick={handleRegister}
                                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/20 transition-all duration-300"
                            >
                                {t('auth.registerButton', 'Create Account')}
                            </button>
                        </div>
                        
                        {/* Terms and Conditions */}
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                            {t('profileEmpty.termsText', 'By continuing, you agree to our')}{' '}
                            <button className="text-[#fbb033] hover:text-[#f69c05] underline transition-colors">
                                {t('profileEmpty.termsLink', 'Terms and Conditions')}
                            </button>
                            {' '}{t('profileEmpty.andText', 'and')}{' '}
                            <button className="text-[#fbb033] hover:text-[#f69c05] underline transition-colors">
                                {t('profileEmpty.privacyLink', 'Privacy Policy')}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Bottom Stats */}
                {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-8 text-sm text-gray-400">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#fbb033]">10K+</div>
                            <div>{t('profileEmpty.moviesCount', 'Movies')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#fbb033]">500K+</div>
                            <div>{t('profileEmpty.usersCount', 'Users')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#fbb033]">50+</div>
                            <div>{t('profileEmpty.countriesCount', 'Countries')}</div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

