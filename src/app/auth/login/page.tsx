'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
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
            // Redirect to return URL if available, otherwise to home
            const redirectPath = returnUrl ? decodeURIComponent(returnUrl) : '/';
            router.push(redirectPath);
        } catch (err) {
            // Error is handled by the store
            console.error('Login failed:', err);
        }
    };

    useEffect(() => {
    }, []); // Only run once

    return (
        <>
            <div className="md:flex z-1 flex-col items-center justify-center hidden w-full md:w-1/2 h-full">
                {/* Welcome text */}
                <h1
                    className="text-4xl font-bold text-white relative mb-[-100]"
                    style={{
                        textShadow: "2px 2px 3px rgba(0,0,0,0.9), 0 0 0 #000, 0 0 8px #222"
                    }}
                >
                    {t('auth.welcomeBack')}
                </h1>
                {/* Background image centered below text */}
                <div className="relative w-full max-w-md">
                    <Image
                        src="/ip_1.png"
                        alt="Login Background"
                        width={400}
                        height={400}
                        className="object-contain mx-auto"
                    />
                </div>
            </div>
            <div className="bg-black/80 p-8 z-1 rounded-lg w-full md:w-1/3 max-w-md mx-auto ">
                <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.loginTitle')}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('auth.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-[#fbb033] rounded-full shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t('auth.password')}</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-[#fbb033] rounded-full shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm pr-10"
                                required
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#fbb033] focus:outline-none"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                            
                        </div>
                         <div className="mt-2 text-right">
                    <span
                        className="text-[#fbb033] text-sm hover:underline cursor-pointer underline"
                        onClick={() => {
                            clearError();
                            router.push('/auth/forgot-password');
                        }}
                    >
                        {t('auth.forgotPassword')}
                    </span>
                </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#fbb033] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
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
               {/* Terms and Conditions */}
                        <p className="hidden md:block text-md text-gray-500 max-w-md mx-auto mt-5 text-center">
                            {t('profileEmpty.termsText', 'By continuing, you agree to our')}{' '}
                            <button 
                                onClick={() => router.push('/legal/terms')}
                                className="text-[#fbb033] hover:text-[#f69c05] underline transition-colors cursor-pointer"
                            >
                                {t('profileEmpty.termsLink', 'Terms and Conditions')}
                            </button>
                            {' '}{t('profileEmpty.andText', 'and')}{' '}
                            <button 
                                onClick={() => router.push('/legal/privacy-policy')}
                                className="text-[#fbb033] hover:text-[#f69c05] underline transition-colors cursor-pointer"
                            >
                                {t('profileEmpty.privacyLink', 'Privacy Policy')}
                            </button>
                        </p>
            </div>
        </>
    );
};

export default LoginPage;