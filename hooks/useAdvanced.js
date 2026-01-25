"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * 追加のカスタムフック（92件改善 Phase5）
 * 5.93-5.97 追加hooks
 */

// フォーカス管理
export const useFocusWithin = () => {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocusIn = () => setFocused(true);
    const handleFocusOut = (e) => {
      if (!element.contains(e.relatedTarget)) {
        setFocused(false);
      }
    };

    element.addEventListener("focusin", handleFocusIn);
    element.addEventListener("focusout", handleFocusOut);

    return () => {
      element.removeEventListener("focusin", handleFocusIn);
      element.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return [ref, focused];
};

// キーボードショートカット
export const useKeyPress = (targetKey, callback, deps = []) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === targetKey) {
        callback(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [targetKey, callback, ...deps]);
};

// コピー機能
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error("Copy failed:", err);
      return false;
    }
  }, []);

  return { copy, copied };
};

// インターセクション監視（遅延読み込み用）
export const useIntersection = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isIntersecting];
};

// ホバー検出
export const useHover = () => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleEnter = () => setHovered(true);
    const handleLeave = () => setHovered(false);

    element.addEventListener("mouseenter", handleEnter);
    element.addEventListener("mouseleave", handleLeave);

    return () => {
      element.removeEventListener("mouseenter", handleEnter);
      element.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return [ref, hovered];
};

// マウント状態
export const useIsMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted;
};

// イベントリスナー
export const useEventListener = (
  eventName,
  handler,
  element = typeof window !== "undefined" ? window : null,
) => {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (e) => savedHandler.current(e);
    element.addEventListener(eventName, eventListener);

    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
};

// ロック（二重クリック防止）
export const useLock = () => {
  const [locked, setLocked] = useState(false);

  const lock = useCallback(
    async (asyncFn) => {
      if (locked) return;
      setLocked(true);
      try {
        await asyncFn();
      } finally {
        setLocked(false);
      }
    },
    [locked],
  );

  return { locked, lock };
};

// ステップ管理
export const useStep = (initialStep = 0, maxStep) => {
  const [step, setStep] = useState(initialStep);

  const next = useCallback(() => {
    setStep((s) => (maxStep !== undefined ? Math.min(s + 1, maxStep) : s + 1));
  }, [maxStep]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback((s) => {
    setStep(s);
  }, []);

  const reset = useCallback(() => {
    setStep(initialStep);
  }, [initialStep]);

  return {
    step,
    next,
    prev,
    goTo,
    reset,
    isFirst: step === 0,
    isLast: step === maxStep,
  };
};

export default {
  useFocusWithin,
  useKeyPress,
  useCopyToClipboard,
  useIntersection,
  useHover,
  useIsMounted,
  useEventListener,
  useLock,
  useStep,
};
