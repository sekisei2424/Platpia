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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4 font-pixel">
                <div className="relative w-full max-w-md bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                    
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                            <Mail size={32} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">メール確認</h2>
                        <p className="text-sm text-gray-700 font-bold mb-6">
                            確認リンクを <strong>{email}</strong> に送信しました。<br />
                            メールを確認してサインアップを完了してください。
                        </p>
                        <button
                            onClick={onClose}
                            className={`
                                w-full py-3 px-4 border-2 border-gray-900 font-bold transition-all text-sm
                                bg-gray-900 text-white shadow-[inset_2px_2px_0px_rgba(50,50,50,1)] translate-y-[2px]
                            `}
                        >
                            了解
                        </button>
                    </div>
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
            className="w-full max-w-md font-pixel" 
            onClick={(e) => {
                e.stopPropagation();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div 
                className="relative bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] overflow-hidden"
                onClick={e => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Decorative corners */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-gray-900"></div>
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-gray-900"></div>
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-gray-900"></div>
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-gray-900"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-900 hover:bg-gray-100 transition-colors z-10 hover:text-gray-700 border-2 border-gray-900 bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                >
                    <X size={18} strokeWidth={3} />
                </button>

                <div className="p-8">
                    <div className="mb-8 flex items-center gap-3 border-b-2 border-gray-900 pb-4">
                        <div className="bg-gray-900 p-2 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                            <User className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                                {isSignUp ? 'アカウント作成' : 'サインイン'}
                            </h2>
                            <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-widest">
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* User Type Selection (Only for Sign Up) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">ユーザータイプを選択</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setUserType('individual')}
                                        className={`
                                            flex flex-col items-center justify-center p-4 border-2 transition-all font-bold text-sm
                                            ${userType === 'individual'
                                                ? "bg-gray-900 text-white border-gray-900 shadow-[inset_2px_2px_0px_rgba(255,255,255,0.2)] translate-y-[2px]" 
                                                : "bg-white text-gray-900 border-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]"
                                            }
                                        `}
                                    >
                                        <User size={20} className="mb-2" strokeWidth={2.5} />
                                        <span>個人</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUserType('company')}
                                        className={`
                                            flex flex-col items-center justify-center p-4 border-2 transition-all font-bold text-sm
                                            ${userType === 'company'
                                                ? "bg-gray-900 text-white border-gray-900 shadow-[inset_2px_2px_0px_rgba(255,255,255,0.2)] translate-y-[2px]" 
                                                : "bg-white text-gray-900 border-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]"
                                            }
                                        `}
                                    >
                                        <Building size={20} className="mb-2" strokeWidth={2.5} />
                                        <span>法人</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Username Input (Only for Sign Up) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">ユーザー名</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} strokeWidth={2.5} />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full h-12 pl-10 pr-4 text-gray-900 border-2 border-gray-900 bg-white shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-sm placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                                        placeholder="ユーザー名を入力..."
                                        minLength={2}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} strokeWidth={2.5} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 pl-10 pr-4 text-gray-900 border-2 border-gray-900 bg-white shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-sm placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                                    placeholder="example@mail.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">パスワード</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} strokeWidth={2.5} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-10 pr-4 text-gray-900 border-2 border-gray-900 bg-white shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-sm placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                w-full h-12 border-2 border-gray-900 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center
                                ${loading 
                                    ? "bg-gray-500 text-white opacity-50 cursor-not-allowed shadow-[inset_2px_2px_0px_rgba(50,50,50,1)] translate-y-[2px]"
                                    : "bg-gray-900 text-white shadow-[inset_-2px_-2px_0px_rgba(50,50,50,1),3px_3px_0px_#000] hover:bg-gray-800 active:shadow-none active:translate-y-[3px]"
                                }
                            `}
                        >
                            {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'サインイン')}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t-2 border-gray-200 pt-4">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-widest"
                        >
                            {isSignUp ? 'アカウントをお持ちですか？サインイン' : 'アカウントを作成'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
