'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '@/config';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { t } = useTranslation('common');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('email', email);

            await axios.post(`${BASE_URL}/api-movie/v1/auth/sendResetCaptcha`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            // Redirect to TAC code entry screen with email
            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to send reset password email. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
        if (axios.isAxiosError(err)) {
            const data = (err.response && (err.response.data )) || null;
            if (data && typeof data === 'object' && typeof data.message === 'string') return data.message;
            return err.message || fallback;
        }
        if (err instanceof Error) return err.message || fallback;
        try {
            const s = JSON.stringify(err);
            if (s && s !== '{}') return s;
        } catch (_e) {
            // ignore
        }
        return fallback;
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-black/80 p-8 rounded-lg w-full md:w-1/3 max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033]">
                    <h2 className="text-xl font-bold mb-4 text-center text-white">
                        {t('auth.resetEmailSent')}
                    </h2>
                    <p className="text-gray-300 text-center mb-6">
                        {t('auth.resetEmailInstructions')}
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="w-full bg-[#fbb033] text-white font-bold py-2 px-4 rounded"
                    >
                        {t('auth.backToLogin')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-black/80 p-8 rounded-lg w-full md:w-[30vw] max-w-md mx-auto inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033] z-100">
                <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.forgotPassword')}</h1>
                <p className="text-gray-300 mb-6 text-center">
                    {t('auth.enterEmailReset')}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            {t('auth.email')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#fbb033] focus:border-[#fbb033] sm:text-sm"
                            required
                        />
                    </div>
                    {error && <div className="text-[#fbb033] mb-4">{error}</div>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#fbb033] hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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

export default ForgotPasswordPage;