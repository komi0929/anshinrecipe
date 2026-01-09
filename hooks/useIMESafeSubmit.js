'use client'

import { useState, useCallback, useRef } from 'react';

/**
 * useIMESafeSubmit - IME入力での誤送信を防ぐカスタムフック
 * 
 * 日本語入力時のEnterキー押下が「文字確定」なのか「送信」なのか
 * を正しく判別し、誤送信を100%防止します。
 * 
 * Inspired by: use-chat-submit (Nani翻訳ツール / catnose氏)
 * 
 * @param {Object} options
 * @param {Function} options.onSubmit - 送信時に呼ばれるコールバック
 * @param {'enter' | 'mod-enter'} options.mode - 送信モード
 *   - 'enter': Enterキーで送信 (Shift+Enterで改行)
 *   - 'mod-enter': Cmd/Ctrl+Enterで送信 (Enterで改行)
 * 
 * @returns {Object} { getInputProps, isComposing }
 */
export const useIMESafeSubmit = ({ onSubmit, mode = 'enter' }) => {
    const [isComposing, setIsComposing] = useState(false);
    const composingRef = useRef(false);

    // Detect OS for modifier key
    const isMac = typeof window !== 'undefined' &&
        navigator.userAgent.toLowerCase().includes('mac');

    const handleCompositionStart = useCallback(() => {
        composingRef.current = true;
        setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(() => {
        // Safari fires compositionend AFTER keydown, so we use a small delay
        setTimeout(() => {
            composingRef.current = false;
            setIsComposing(false);
        }, 10);
    }, []);

    const handleKeyDown = useCallback((event) => {
        // 🛡️ IME入力中は何もしない（完全ガード）
        if (event.nativeEvent?.isComposing || composingRef.current) {
            return;
        }

        if (event.key !== 'Enter') {
            return;
        }

        if (mode === 'enter') {
            // Enter = submit, Shift+Enter = newline
            if (event.shiftKey) {
                return; // Allow newline
            }
            event.preventDefault();
            onSubmit?.();
        } else if (mode === 'mod-enter') {
            // Cmd/Ctrl+Enter = submit, Enter = newline
            const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
            if (!isModifierPressed) {
                return; // Allow newline
            }
            event.preventDefault();
            onSubmit?.();
        }
    }, [mode, onSubmit, isMac]);

    /**
     * getInputProps - input/textareaに適用するprops
     * Usage: <input {...getInputProps()} />
     */
    const getInputProps = useCallback(() => ({
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
        onKeyDown: handleKeyDown,
    }), [handleCompositionStart, handleCompositionEnd, handleKeyDown]);

    /**
     * getSubmitHint - 送信方法のヒントテキストを返す
     * Usage: <span>{getSubmitHint()}</span>
     */
    const getSubmitHint = useCallback(() => {
        if (mode === 'enter') {
            return '⏎ で送信';
        }
        return isMac ? '⌘ + ⏎ で送信' : 'Ctrl + ⏎ で送信';
    }, [mode, isMac]);

    return {
        getInputProps,
        getSubmitHint,
        isComposing,
    };
};

export default useIMESafeSubmit;
