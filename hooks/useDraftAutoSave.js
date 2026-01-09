'use client'

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDraftAutoSave - 下書き自動保存フック
 * 
 * フォーム入力内容をLocalStorageに自動保存し、
 * ブラウザクラッシュや誤った戻る操作からデータを守ります。
 * 
 * @param {Object} options
 * @param {string} options.key - LocalStorageのキー
 * @param {Object} options.data - 保存するデータオブジェクト
 * @param {number} options.debounceMs - デバウンス時間（デフォルト: 3000ms）
 * @param {boolean} options.enabled - 自動保存を有効にするか（新規作成時のみtrueなど）
 * 
 * @returns {Object} { hasDraft, restoreDraft, clearDraft, lastSaved }
 */
export const useDraftAutoSave = ({
    key,
    data,
    debounceMs = 3000,
    enabled = true,
}) => {
    const [hasDraft, setHasDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [draftData, setDraftData] = useState(null);
    const isInitialMount = useRef(true);
    const saveTimeoutRef = useRef(null);

    const storageKey = `anshin_draft_${key}`;

    // Check for existing draft on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Check if draft is less than 24 hours old
                const isRecent = Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;
                if (isRecent && parsed.data) {
                    setHasDraft(true);
                    setDraftData(parsed.data);
                } else {
                    // Clear old draft
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (e) {
            console.error('Failed to check draft:', e);
        }
    }, [storageKey]);

    // Auto-save with debounce
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Skip initial mount to avoid saving empty data
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Check if data has meaningful content
        const hasContent = data && Object.values(data).some(value => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return Boolean(value);
        });

        if (!hasContent) return;

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Schedule save
        saveTimeoutRef.current = setTimeout(() => {
            try {
                const saveData = {
                    data,
                    savedAt: Date.now(),
                };
                localStorage.setItem(storageKey, JSON.stringify(saveData));
                setLastSaved(new Date());
                console.log('📝 Draft auto-saved');
            } catch (e) {
                console.error('Failed to save draft:', e);
            }
        }, debounceMs);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [data, debounceMs, enabled, storageKey]);

    /**
     * restoreDraft - 保存された下書きを復元
     * @returns {Object|null} 復元されたデータ
     */
    const restoreDraft = useCallback(() => {
        if (!draftData) return null;
        setHasDraft(false);
        return draftData;
    }, [draftData]);

    /**
     * clearDraft - 下書きを削除（送信成功時に呼び出し）
     */
    const clearDraft = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
            setHasDraft(false);
            setDraftData(null);
            setLastSaved(null);
            console.log('🗑️ Draft cleared');
        } catch (e) {
            console.error('Failed to clear draft:', e);
        }
    }, [storageKey]);

    /**
     * dismissDraft - 下書きを破棄（復元しない場合）
     */
    const dismissDraft = useCallback(() => {
        clearDraft();
    }, [clearDraft]);

    return {
        hasDraft,
        draftData,
        restoreDraft,
        clearDraft,
        dismissDraft,
        lastSaved,
    };
};

export default useDraftAutoSave;
