'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Search, ShieldCheck, MessageCircle } from 'lucide-react';
import LineLoginButton from '@/components/LineLoginButton';

const WelcomeSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "アレルギー除去レシピが\nすぐ見つかる",
            description: "卵・牛乳・小麦など、除去したい食材を選んで検索。\nもう「食べられるかな？」と迷う必要はありません。",
            icon: <Search className="w-16 h-16 text-orange-400" />,
            bgColor: "bg-orange-50",
            image: "/illustrations/onboarding_search.png"
        },
        {
            id: 2,
            title: "お子様に合せて\n自動チェック",
            description: "登録したプロフィールに合わせて、\n食べられるレシピには「OK」マークを表示します。",
            icon: <ShieldCheck className="w-16 h-16 text-green-500" />,
            bgColor: "bg-green-50",
            image: null // Fallback to icon
        },
        {
            id: 3,
            title: "LINEで簡単に\nはじめよう",
            description: "面倒な登録は不要。\n普段使っているLINEですぐに始められます。",
            icon: <MessageCircle className="w-16 h-16 text-[#06C755]" />,
            bgColor: "bg-blue-50",
            type: "login",
            image: null
        }
    ];

    useEffect(() => {
        // Auto-advance only for first 2 slides
        if (currentSlide < 2) {
            const timer = setTimeout(() => {
                setCurrentSlide(prev => prev + 1);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentSlide]);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col safe-area-inset-bottom">
            {/* Header / Skip */}
            <div className="flex justify-between items-center p-6">
                <Image
                    src="/logo.png"
                    alt="あんしんレシピ"
                    width={120}
                    height={40}
                    className="object-contain"
                />
                {currentSlide < 2 && (
                    <button
                        onClick={() => setCurrentSlide(2)}
                        className="text-slate-400 font-bold text-sm"
                    >
                        スキップ
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                <div
                    className="absolute inset-0 flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide) => (
                        <div key={slide.id} className="w-full h-full flex-shrink-0 flex flex-col items-center justify-center px-8 text-center">

                            {slide.image ? (
                                <div className="mb-10 w-64 h-64 relative animate-in zoom-in duration-500 rounded-3xl overflow-hidden shadow-sm">
                                    <Image
                                        src={slide.image}
                                        alt={slide.title}
                                        fill
                                        className="object-cover"
                                        priority={slide.id === 1}
                                    />
                                </div>
                            ) : (
                                <div className={`w-64 h-64 rounded-full ${slide.bgColor} flex items-center justify-center mb-10 shadow-sm animate-in zoom-in duration-500`}>
                                    {slide.icon}
                                </div>
                            )}

                            <h2 className="text-2xl font-bold text-slate-700 mb-4 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-100">
                                {slide.title}
                            </h2>
                            <p className="text-slate-500 leading-relaxed whitespace-pre-wrap animate-in slide-in-from-bottom-4 duration-700 delay-200">
                                {slide.description}
                            </p>

                            {slide.type === 'login' && (
                                <div className="mt-8 w-full animate-in fade-in zoom-in duration-500 delay-300">
                                    <LineLoginButton />
                                    <p className="text-xs text-slate-400 mt-4">
                                        利用規約・プライバシーポリシーに同意の上<br />ログインしてください
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pb-12">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-orange-400 w-6' : 'bg-slate-200'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default WelcomeSlider;
