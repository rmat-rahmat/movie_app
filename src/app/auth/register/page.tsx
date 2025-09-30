'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { getDeviceId } from '@/lib/authAPI';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import { checkPasswordStrength } from '@/utils/passwordUtils';

type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [emailCaptcha, setEmailCaptcha] = useState('');
    const [captchaSent, setCaptchaSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [localError, setLocalError] = useState<string | null>(null);
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const router = useRouter();
    const { register, sendEmailVerification, isLoading, error, clearError } = useAuthStore();
    const { t } = useTranslation('common');
    // compute password strength for render-time checks
    const passwordStrength = checkPasswordStrength(password);
    // live match check for confirm password
    const passwordsMatch = password === confirmPassword;
    // live email format validation (start when length > 5)
    const isEmailValid = email.length > 4 ? /^[\w-.+]+@[\w-]+\.[\w-.]+$/.test(email) : false;

    const handleSendCaptcha = async (e: ButtonClickEvent): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!email) {
            setLocalError(t('auth.error.enter_email_first'));
            return;
        }

        try {
            setLocalError(null);
            setCaptchaLoading(true);
            await sendEmailVerification(email);
            setCaptchaSent(true);
            setCountdown(60); // 60 second countdown
        } catch (err: unknown) {
            console.error('Send captcha error:', err);
            setLocalError(t('auth.error.send_captcha_failed'));
        } finally {
            setCaptchaLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (email === '' || password === '' || emailCaptcha === '') {
            setLocalError(t('auth.error.fill_required_fields'));
            return;
        }

        // Check password strength
        const passwordStrength = checkPasswordStrength(password);
        if (passwordStrength.score < 2) {
            setLocalError(t('auth.error.password_too_weak'));
            return;
        }

        if (password !== confirmPassword) {
            setLocalError(t('auth.error.passwords_not_match'));
            return;
        }

        if (!captchaSent) {
            setLocalError(t('auth.error.verify_email_first'));
            return;
        }

        try {
            const deviceId = getDeviceId();
            await register({
                email,
                password,
                deviceId,
                emailCaptcha,
                nickname: nickname || undefined
            });
            router.push('/');
        } catch (err) {
            // Error is handled by the store
            console.error('Registration failed:', err);
        }
    };

    useEffect(() => {
        // Countdown timer for captcha resend
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (captchaSent && countdown === 0) {
            setCaptchaSent(false);
        }
    }, [countdown, captchaSent]);

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
            <div className="md:flex z-1 flex-col items-center justify-center hidden  w-full md:w-1/2 h-full">
                {/* Background image for larger screens */}
                <h1
                    className="text-4xl font-bold text-white relative"
                    style={{
                        textShadow: "2px 2px 3px rgba(0,0,0,0.9), 0 0 0 #000, 0 0 8px #222"
                    }}
                >
                    {t('auth.joinTitle')}
                </h1>
                <p className="mt-4 text-lg text-gray-200 max-w-md">
                    {t('auth.joinDesc1')} <span className="font-semibold text-[#fbb033]">{t('auth.createAccountCTA')}</span> {t('auth.joinDesc2')}
                </p>
            </div>
            <div className="bg-black/80 p-8 z-1 rounded-lg shadow-lg w-full md:w-1/3 max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.registerTitle')}</h1>
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
                        {email.length > 4 && !isEmailValid && (
                            <p className="text-xs text-red-400 mt-1">{t('auth.error.invalid_email') || 'Invalid email format'}</p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="emailCaptcha" className="block text-sm font-medium text-gray-300">{t('auth.emailVerification')}</label>
                        <div className="flex gap-2">
                            <input
                                id="emailCaptcha"
                                type="text"
                                value={emailCaptcha}
                                onChange={e => setEmailCaptcha(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                                placeholder={t('auth.enterVerificationCode')}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleSendCaptcha}
                                disabled={!email || captchaSent || captchaLoading || !isEmailValid}
                                className="mt-1 px-4 py-2 bg-[#fbb033] text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {captchaLoading ? t('common.loading') : captchaSent ? `${countdown}s` : t('auth.sendCode')}
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t('auth.password')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            minLength={8}
                            onChange={e => setPassword(e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm ${password && (passwordStrength.score < 2 ? 'border border-red-500 focus:ring-red-500 focus:border-red-500' : 'border border-green-500 focus:ring-green-500 focus:border-green-500')}`}
                            required
                        />
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">{t('auth.confirmPassword')}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none sm:text-sm ${confirmPassword ? (passwordsMatch ? 'border border-green-500 focus:ring-green-500 focus:border-green-500' : 'border border-red-500 focus:ring-red-500 focus:border-red-500') : 'border border-gray-300 focus:ring-[#fbb033] focus:border-[#fbb033]'}`}
                            required
                        />
                        {!passwordsMatch && confirmPassword && (
                            <p className="text-xs text-red-400 mt-1">{t('auth.error.passwords_not_match')}</p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-300">{t('auth.nickname')}</label>
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                        />
                    </div>
                    
                    {(error || localError) && <div className="text-[#fbb033] mb-4">{error || localError}</div>}
                    <button
                        type="submit"
                        disabled={isLoading || passwordStrength.score < 2 || !passwordsMatch || !isEmailValid || !nickname.trim()}
                        className="w-full bg-[#fbb033] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {isLoading ? t('common.loading') : t('auth.registerButton')}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <div className="mt-6 text-center text-gray-300">
                        {t('auth.alreadyHaveAccount')}{' '}
                        <span
                            className="text-[#fbb033] hover:underline font-semibold cursor-pointer"
                            onClick={() => {clearError()
                                router.replace('/auth/login')}}
                        >
                            {t('navigation.login')}
                        </span>
                    </div>

                </div>
            </div>
        </>
    );
};

export default RegisterPage;