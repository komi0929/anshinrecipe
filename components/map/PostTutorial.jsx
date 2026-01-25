"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Camera,
  Star,
  Search,
  Bookmark,
} from "lucide-react";

/**
 * 初回投稿チュートリアルモーダル（92件改善 Phase4）
 * 4.3 初回投稿チュートリアル実装
 */

const TUTORIAL_STEPS = [
  {
    title: "お店を探そう",
    description: "地図上でお店を探すか、検索バーで店名を入力してください",
    icon: Search,
    color: "orange",
  },
  {
    title: "口コミを投稿",
    description:
      "お店ページの「口コミを書く」ボタンをタップ。写真も追加できます！",
    icon: Camera,
    color: "pink",
  },
  {
    title: "評価をつけよう",
    description:
      "アレルギー対応の満足度を★で評価。具体的なエピソードも書いてみて",
    icon: Star,
    color: "amber",
  },
  {
    title: "お気に入り登録",
    description: "気に入ったお店はブックマークして、いつでも見返せます",
    icon: Bookmark,
    color: "blue",
  },
];

export const PostTutorial = ({ show, onClose, onComplete }) => {
  const [step, setStep] = useState(0);

  // localStorage でチュートリアル完了を記録
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("post_tutorial_completed");
      if (completed) {
        onClose?.();
      }
    }
  }, []);

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("post_tutorial_completed", "true");
    }
    onComplete?.();
    onClose?.();
  };

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const currentStep = TUTORIAL_STEPS[step];
  const Icon = currentStep.icon;
  const colorClasses = {
    orange: "bg-orange-100 text-orange-600",
    pink: "bg-pink-100 text-pink-600",
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <X size={16} />
          </button>
          <h2 className="text-xl font-black">はじめての投稿ガイド</h2>
          <p className="text-sm text-white/80 mt-1">4ステップで完了！</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className={`w-20 h-20 ${colorClasses[currentStep.color]} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <Icon size={40} />
          </div>

          {/* Step Info */}
          <div className="mb-6">
            <span className="text-xs text-slate-400 font-bold">
              STEP {step + 1}
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              {currentStep.title}
            </h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? "bg-orange-500 w-6" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-100">
          {step > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-1"
            >
              <ChevronLeft size={18} /> 戻る
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
            >
              スキップ
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-1"
          >
            {step === TUTORIAL_STEPS.length - 1 ? (
              "はじめる"
            ) : (
              <>
                次へ <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostTutorial;
