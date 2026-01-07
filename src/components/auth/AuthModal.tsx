'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { X, Mail, User, Building, Lock } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [userType, setUserType] = useState<'individual' | 'company'>('individual');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (!isOpen) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Check your email!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        We've sent a confirmation link to <strong>{email}</strong>.<br />
                        Please verify your email to complete the registration.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(email, password, { user_type: userType, username });
                // Show success message (handled by alert in AuthProvider for now, but we can improve this later)
                // For now, let's just close the modal as requested by the user flow, 
                // BUT the user asked for a "check your mail" popup.
                // Since we are using password auth, email confirmation might still be on.
                // Let's rely on the alert in AuthProvider or replace it with a custom UI state here.
                // I'll update AuthProvider to NOT alert, and handle UI here.
                setShowSuccess(true);
            } else {
                await signIn(email, password);
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div 
                className="relative w-full max-w-md bg-[#FDFBF7] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10 hover:bg-gray-100 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Join the community today' : 'Sign in to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Type Selection (Only for Sign Up) */}
                        {isSignUp && (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setUserType('individual')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${userType === 'individual'
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <User size={24} className="mb-2" />
                                    <span className="font-medium">Individual</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('company')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${userType === 'company'
                                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Building size={24} className="mb-2" />
                                    <span className="font-medium">Company</span>
                                </button>
                            </div>
                        )}

                        {/* Username Input (Only for Sign Up) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Your Name"
                                        minLength={2}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-gray-500 hover:text-gray-700 underline decoration-dotted"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
