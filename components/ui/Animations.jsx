"use client";

import React from "react";

/**
 * 共通アニメーションCSS（92件改善 Phase5）
 * 5.21-5.25 UX改善: マイクロアニメーション
 */

export const AnimationStyles = () => (
  <style jsx global>{`
    /* Fade In */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }

    /* Fade In Up */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fadeInUp {
      animation: fadeInUp 0.4s ease-out;
    }

    /* Slide In */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slideIn {
      animation: slideIn 0.3s ease-out;
    }

    /* Slide In Right */
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .animate-slideInRight {
      animation: slideInRight 0.3s ease-out;
    }

    /* Scale In */
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out;
    }

    /* Bounce */
    @keyframes bounce-soft {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    .animate-bounce-soft {
      animation: bounce-soft 2s ease-in-out infinite;
    }

    /* Pulse Glow */
    @keyframes pulseGlow {
      0%,
      100% {
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(249, 115, 22, 0);
      }
    }
    .animate-pulseGlow {
      animation: pulseGlow 2s ease-in-out infinite;
    }

    /* Shake */
    @keyframes shake {
      0%,
      100% {
        transform: translateX(0);
      }
      20%,
      60% {
        transform: translateX(-5px);
      }
      40%,
      80% {
        transform: translateX(5px);
      }
    }
    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    /* Spin Slow */
    @keyframes spinSlow {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .animate-spin-slow {
      animation: spinSlow 3s linear infinite;
    }

    /* Skeleton Shimmer */
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    .animate-shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    /* Heart Pop */
    @keyframes heartPop {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.3);
      }
      100% {
        transform: scale(1);
      }
    }
    .animate-heartPop {
      animation: heartPop 0.3s ease-out;
    }

    /* Confetti */
    @keyframes confetti-fall {
      0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    /* Staggered Animation Helper */
    .stagger-1 {
      animation-delay: 0.1s;
    }
    .stagger-2 {
      animation-delay: 0.2s;
    }
    .stagger-3 {
      animation-delay: 0.3s;
    }
    .stagger-4 {
      animation-delay: 0.4s;
    }
    .stagger-5 {
      animation-delay: 0.5s;
    }

    /* Smooth Transitions */
    .transition-smooth {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Hover Effects */
    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .hover-scale:hover {
      transform: scale(1.02);
    }

    /* Active State */
    .active-shrink:active {
      transform: scale(0.98);
    }
  `}</style>
);

// アニメーション付きラッパー
export const Animated = ({
  children,
  animation = "fadeIn",
  delay = 0,
  className = "",
}) => {
  return (
    <div
      className={`animate-${animation} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// スタガードリスト
export const StaggeredList = ({ children, baseDelay = 100 }) => {
  return React.Children.map(children, (child, index) => (
    <div
      className="animate-fadeInUp"
      style={{ animationDelay: `${index * baseDelay}ms` }}
    >
      {child}
    </div>
  ));
};

export default { AnimationStyles, Animated, StaggeredList };
