'use client'

import { useState, useEffect, useRef } from 'react';

/**
 * useScrollHeader - スクロールに応じてヘッダーを縮小
 * 
 * スクロール位置が閾値を超えるとisScrolledがtrueになり、
 * ヘッダーの高さを縮小するCSSクラスを適用できる。
 * 
 * @param {number} threshold - スクロール閾値（デフォルト: 100px）
 * @returns {{ isScrolled: boolean, headerRef: React.RefObject }}
 */
export const useScrollHeader = (threshold = 100) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > threshold);
        };

        // Passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Check initial scroll position
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return { isScrolled, headerRef };
};

export default useScrollHeader;
