'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // TODO: Replace with your authentication logic
        if (email === '' || password === '') {
            setError('Please enter both email and password.');
            return;
        }

        try {
            // Example: await login(email, password);
            alert('Logged in!');
            // Redirect or perform further actions after successful login
            router.replace('/');
        } catch (err) {
            setError('Invalid credentials.');
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
            <div className="md:flex z-1 flex-col items-center justify-center hidden  w-full md:w-1/2 h-full">
                {/* Background image for larger screens */}
                <h1
                    className="text-4xl font-bold text-white relative"
                    style={{
                        textShadow: "2px 2px 3px rgba(0,0,0,0.9), 0 0 0 #000, 0 0 8px #222"
                    }}
                >
                    Join Seefu TV Today!
                </h1>
                <p className="mt-4 text-lg text-gray-200 max-w-md">
                    Discover trending movies, connect with fellow fans, and unlock exclusive features. <span className="font-semibold text-green-400">Create your free account</span> and start your entertainment journey!
                </p>
            </div>
            <div className="bg-black/80 p-8 z-1 rounded-lg shadow-lg w-full md:w-1/3 max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            required
                        />
                    </div>
                    {error && <div className="text-red-600 mb-4">{error}</div>}
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Register
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <div className="mt-6 text-center text-gray-300">
                        Have an account?{' '}
                        <span
                            className="text-green-400 hover:underline font-semibold cursor-pointer"
                            onClick={() => router.replace('/auth/login')}
                        >
                            Login now
                        </span>
                    </div>

                </div>
            </div>
        </>
    );
};

export default LoginPage;