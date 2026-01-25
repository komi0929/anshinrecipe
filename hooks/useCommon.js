'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 共通カスタムフック（92件改善 Phase5）
 * 5.35-5.37 UX改善: ユーティリティhooks
 */

// デバウンスフック
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

// ローカルストレージフック
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};

// スクロール位置フック
export const useScrollPosition = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [scrollDirection, setScrollDirection] = useState('up');
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollPosition(currentScrollY);
            setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return { scrollPosition, scrollDirection };
};

// ウィンドウサイズフック
export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

// メディアクエリフック
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

// モバイル判定フック
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

// 外側クリック検出フック
export const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// 前の値を保持するフック
export const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

// 非同期処理フック
export const useAsync = (asyncFunction, immediate = true) => {
    const [status, setStatus] = useState('idle');
    const [value, setValue] = useState(null);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setStatus('pending');
        setValue(null);
        setError(null);

        try {
            const response = await asyncFunction(...args);
            setValue(response);
            setStatus('success');
            return response;
        } catch (err) {
            setError(err);
            setStatus('error');
            throw err;
        }
    }, [asyncFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { execute, status, value, error, loading: status === 'pending' };
};

export default {
    useDebounce,
    useLocalStorage,
    useScrollPosition,
    useWindowSize,
    useMediaQuery,
    useIsMobile,
    useClickOutside,
    usePrevious,
    useAsync
};
