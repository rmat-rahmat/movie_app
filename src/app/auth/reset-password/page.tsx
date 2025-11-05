'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '@/config';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import { checkPasswordStrength } from '@/utils/passwordUtils';
import { resetPassword } from '@/lib/movieApi';

const ResetPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [tacCode, setTacCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation('common');

    // Password strength and validation
    const passwordStrength = checkPasswordStrength(password);
    const passwordsMatch = password === confirmPassword;

    // Get email from URL parameters
    useEffect(() => {
        const emailParam = searchParams?.get('email');
        if (!emailParam) {
            router.replace('/auth/forgot-password');
        } else {
            setEmail(emailParam);
        }
    }, [searchParams, router]);

    // Add countdown effect for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const handleResendCode = async () => {
        setError(null);
        setResendDisabled(true);
        setCountdown(60); // 60 seconds cooldown

        try {
            const params = new URLSearchParams();
            params.append('email', email);

            await axios.post(`${BASE_URL}/api-movie/v1/auth/sendResetCaptcha`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to resend verification code. Please try again.'));
            setResendDisabled(false);
            setCountdown(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!tacCode) {
            setError(t('auth.error.fill_required_fields'));
            return;
        }

        // Check password strength
        if (passwordStrength.score < 2) {
            setError(t('auth.error.password_too_weak'));
            return;
        }

        if (!passwordsMatch) {
            setError(t('auth.error.passwords_not_match'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await resetPassword({
                email,
                emailCaptcha: tacCode,
                newPassword: password,
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(
                    response.message || 
                    t('auth.error.reset_password_failed')
                );
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to extract error message safely from unknown errors (Axios or Error)
    function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
        // Axios error
        if (axios.isAxiosError(err)) {
            const data = (err.response && (err.response.data )) || null;
            if (data && typeof data === 'object' && typeof data.message === 'string') return data.message;
            return err.message || fallback;
        }

        // Error instance
        if (err instanceof Error) return err.message || fallback;

        // Fallback for unknown shapes
        try {
            const maybe = JSON.stringify(err);
            if (maybe && maybe !== '{}') return maybe;
        } catch (_e) {
            // ignore
        }
        return fallback;
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-black/80 p-8 rounded-lg w-full md:w-[50vw] z-100 max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033]">
                    <h2 className="text-xl font-bold mb-4 text-center text-white">
                        {t('auth.passwordResetSuccess')}
                    </h2>
                    <p className="text-gray-300 text-center mb-6">
                        {t('auth.passwordResetSuccessDesc')}
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="w-full bg-[#fbb033] text-white font-bold py-2 px-4 rounded"
                    >
                        {t('auth.proceedToLogin')}
                    </button>
                </div>
            </div>
        );
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-black/80 p-8 rounded-lg w-full md:w-[50vw] z-100 max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033]">
                    <h2 className="text-xl font-bold mb-4 text-center text-white">
                        {t('auth.invalidRequest')}
                    </h2>
                    <p className="text-gray-300 text-center mb-6">
                        {t('auth.startPasswordReset')}
                    </p>
                    <button
                        onClick={() => router.push('/auth/forgot-password')}
                        className="w-full bg-[#fbb033] text-white font-bold py-2 px-4 rounded"
                    >
                        {t('auth.resetPassword')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-black/80 p-8 rounded-lg w-full md:w-[50vw] z-100 max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033]">
                <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.resetPassword')}</h1>
                <form onSubmit={handleSubmit}>
                    {/* Email display */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300">
                            {t('auth.email')}
                        </label>
                        <div className="mt-1 block w-full px-3 py-2 bg-gray-700 rounded-full text-gray-300">
                            {email}
                        </div>
                    </div>

                    {/* TAC Code */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center">
                            <label htmlFor="tacCode" className="block text-sm font-medium text-gray-300">
                                {t('auth.verificationCode')}
                            </label>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendDisabled}
                                className="text-sm text-[#fbb033] hover:underline disabled:text-gray-500 disabled:no-underline"
                            >
                                {resendDisabled 
                                    ? t('auth.resendCodeIn', { seconds: countdown })
                                    : t('auth.resendCode')}
                            </button>
                        </div>
                        <input
                            id="tacCode"
                            type="text"
                            value={tacCode}
                            onChange={e => setTacCode(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-[#fbb033] rounded-full shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                            required
                            placeholder={t('auth.enterVerificationCode')}
                        />
                    </div>

                    {/* New Password */}
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            {t('auth.newPassword')}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border rounded-full shadow-sm focus:outline-none sm:text-sm ${
                                password ? (passwordStrength.score < 2 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-green-500 focus:ring-green-500 focus:border-green-500'
                                ) : 'border-[#fbb033] focus:ring-[#fbb033] focus:border-[#fbb033]'
                            }`}
                            required
                            minLength={8}
                        />
                        <PasswordStrengthMeter password={password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                            {t('auth.confirmPassword')}
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 rounded-full shadow-sm border-1 focus:outline-none sm:text-sm ${
                                confirmPassword ? (passwordsMatch 
                                    ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                                    : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                ) : 'border border-[#fbb033] focus:ring-[#fbb033] focus:border-[#fbb033]'
                            }`}
                            required
                        />
                        {!passwordsMatch && confirmPassword && (
                            <p className="text-xs text-red-400 mt-1">{t('auth.error.passwords_not_match')}</p>
                        )}
                    </div>


                    {error && <div className="text-[#fbb033] mb-4">{error}</div>}
                    
                    <button
                        type="submit"
                        disabled={isLoading || passwordStrength.score < 2 || !passwordsMatch || !tacCode}
                        className="w-full bg-[#fbb033] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
                    >
                        {isLoading ? t('common.loading') : t('auth.resetPassword')}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <span
                        className="text-[#fbb033] text-sm hover:underline cursor-pointer"
                        onClick={() => router.push('/auth/login')}
                    >
                        {t('auth.backToLogin')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;