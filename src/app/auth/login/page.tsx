'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const router = useRouter();
    const { login, isLoading, error,clearError } = useAuthStore();
    const { t } = useTranslation('common');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        if (email === '' || password === '') {
            setLocalError('Please enter both email and password.');
            return;
        }

        try {
            await login(email, password);
            router.push('/');
        } catch (err) {
            // Error is handled by the store
            console.error('Login failed:', err);
        }
    };

    useEffect(() => {
        // Only inject keyframes once after mount
        if (typeof window !== "undefined") {
            const styleSheet = document.styleSheets[0];
            // For movies
            for (let idx = 0; idx < 30; idx++) {
                const animationName = `rainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule =>
                            rule.type === window.CSSRule.KEYFRAMES_RULE &&
                            (rule as CSSKeyframesRule).name === animationName
                    )
                ) {
                    styleSheet.insertRule(
                        `
                        @keyframes ${animationName} {
                            0% { top: -120px; opacity: 0.7; transform: rotate(0deg) scale(1);}
                            10% { opacity: 1;}
                            90% { opacity: 1;}
                            100% { top: 100vh; opacity: 0.7; transform: rotate(0deg) scale(1.05);}
                        }
                        `,
                        styleSheet.cssRules.length
                    );
                }
            }
            // For emojis
            for (let idx = 0; idx < 12; idx++) {
                const animationName = `emojiRainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule =>
                            rule.type === window.CSSRule.KEYFRAMES_RULE &&
                            (rule as CSSKeyframesRule).name === animationName
                    )
                ) {
                    styleSheet.insertRule(
                        `
                        @keyframes ${animationName} {
                            0% { top: -60px; opacity: 0.8; transform: rotate(0deg) scale(1);}
                            10% { opacity: 1;}
                            90% { opacity: 1;}
                            100% { top: 100vh; opacity: 0.8; transform: rotate(0deg) scale(1.1);}
                        }
                        `,
                        styleSheet.cssRules.length
                    );
                }
            }
        }
    }, []); // Only run once

    return (
        <>
            <div className="md:flex z-1 items-center justify-center hidden  w-full md:w-1/2 h-full">
                {/* Background image for larger screens */}
                <h1
                    className="text-4xl font-bold text-white relative"
                    style={{
                        textShadow: "2px 2px 3px rgba(0,0,0,0.9), 0 0 0 #000, 0 0 8px #222"
                    }}
                >
                    {t('auth.welcomeBack')}
                </h1>
            </div>
            <div className="bg-black/80 p-8 z-1 rounded-lg w-full md:w-1/3 max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033]">
                <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.loginTitle')}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('auth.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t('auth.password')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#fbb033] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {isLoading ? t('common.loading') : t('auth.loginButton')}
                    </button>
                    {(error || localError) && <div className="text-[#fbb033] mb-4">{error || localError}</div>}
                </form>
                <div className="mt-6 text-center text-gray-300">
                    {t('auth.dontHaveAccount')}{' '}
                    <span
                        className="text-[#fbb033] hover:underline font-semibold cursor-pointer"
                        onClick={() => {clearError()
                            router.replace('/auth/register')}}
                    >
                        {t('navigation.register')}
                    </span>
                </div>
                <div className="mt-2 text-center">
                    <span
                        className="text-[#fbb033] text-sm hover:underline cursor-pointer"
                        onClick={() => {
                            clearError();
                            router.push('/auth/forgot-password');
                        }}
                    >
                        {t('auth.forgotPassword')}
                    </span>
                </div>
            </div>
        </>
    );
};

export default LoginPage;