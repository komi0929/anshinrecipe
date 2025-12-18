'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import IconPicker from '@/components/IconPicker';
import AllergySelector from '@/components/AllergySelector';
import { useProfile } from '@/hooks/useProfile';
import { ArrowRight, Check, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';

const OnboardingWizard = ({ onComplete }) => {
    const { addChild } = useProfile();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [childName, setChildName] = useState('');
    const [childIcon, setChildIcon] = useState('👶');
    const [childAllergens, setChildAllergens] = useState([]);

    const handleNext = async () => {
        if (step === 3) {
            // Final Step - Submit
            setLoading(true);
            try {
                await addChild({
                    name: childName,
                    icon: childIcon,
                    allergens: childAllergens
                });

                // Show success animation briefly
                setStep(4);

                setTimeout(() => {
                    onComplete(); // Parent component handles the transition to main feed
                }, 2500);
            } catch (error) {
                console.error("Setup failed", error);
                setLoading(false);
            }
        } else {
            setStep(prev => prev + 1);
        }
    };

    const isStepValid = () => {
        if (step === 1) return true; // Intro
        if (step === 2) return childName.trim().length > 0;
        if (step === 3) return true; // Allergens optional
        return true;
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col safe-area-inset-bottom">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-100">
                <div
                    className="h-full bg-orange-400 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full animate-in fade-in duration-500">

                {/* Step 1: Intro */}
                {step === 1 && (
                    <div className="text-center space-y-6">
                        <div className="relative w-32 h-32 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-8">
                            <span className="text-6xl animate-bounce">👋</span>
                            <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-8 h-8 animate-spin-slow" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            はじめまして！<br />
                            あんしんレシピへようこそ
                        </h2>
                        <p className="text-slate-500 leading-relaxed">
                            大切なお子様のために、<br />
                            ぴったりのレシピを見つけましょう。<br />
                            <br />
                            まずは、お子様のことを<br />
                            少しだけ教えてください。
                        </p>
                    </div>
                )}

                {/* Step 2: Name & Icon */}
                {step === 2 && (
                    <div className="w-full space-y-8">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">お子様のお名前は？</h2>
                            <p className="text-slate-400 text-sm">アプリ内での呼び名を決めましょう</p>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="w-full">
                                <label className="block text-sm font-bold text-slate-500 mb-2 text-center">アイコンを選んでね</label>
                                <IconPicker
                                    selected={childIcon}
                                    onChange={setChildIcon}
                                />
                            </div>

                            <div className="w-full">
                                <label className="block text-sm font-bold text-slate-500 mb-2 text-center">お名前</label>
                                <Input
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="例：たろう、はなちゃん"
                                    className="text-center text-lg py-6"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Allergens */}
                {step === 3 && (
                    <div className="w-full h-full flex flex-col">
                        <div className="text-center mb-6 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">気をつけたい食材は？</h2>
                            <p className="text-slate-400 text-sm">該当するものを選んでください（複数可）</p>
                        </div>

                        <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
                            <AllergySelector
                                selected={childAllergens}
                                onChange={setChildAllergens}
                                layout="grid" // Assuming AllergySelector can support a grid layout prop or we just rely on its default
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Success Loading */}
                {step === 4 && (
                    <div className="text-center space-y-6 animate-in zoom-in duration-300">
                        <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4">
                            <Check size={48} strokeWidth={4} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">準備完了！</h2>
                        <p className="text-slate-500">
                            {childName}ちゃん専用の<br />
                            レシピを探しています...
                        </p>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            {step < 4 && (
                <div className="p-6 border-t border-slate-50 bg-white">
                    <Button
                        onClick={handleNext}
                        disabled={!isStepValid() || loading}
                        className="w-full h-14 text-lg rounded-full shadow-lg shadow-orange-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            step === 1 ? "はじめる" :
                                step === 3 ? "設定を完了する" : "次へ"
                        )}
                        {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                    </Button>

                    {step > 1 && !loading && (
                        <button
                            onClick={() => setStep(prev => prev - 1)}
                            className="w-full mt-4 text-slate-400 text-sm font-bold py-2"
                        >
                            戻る
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnboardingWizard;
