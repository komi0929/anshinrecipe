'use client';

import React, { useState } from 'react';
import { Heart, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import './ThanksButton.css';

/**
 * ThanksButton - 感謝を送る機能
 * 
 * noteのチップ機能のエッセンスを取り入れた、
 * 金銭ではなく「感情的報酬」を届ける機能
 */

const THANKS_OPTIONS = [
    { id: 'helped', emoji: '🙏', label: '助かりました！', color: '#10B981' },
    { id: 'genius', emoji: '💡', label: '天才！', color: '#F59E0B' },
    { id: 'kid_loved', emoji: '😋', label: 'うちの子喜んでました', color: '#EC4899' },
    { id: 'will_try', emoji: '🍳', label: '作ってみます！', color: '#6366F1' },
    { id: 'inspiring', emoji: '✨', label: '参考になります', color: '#8B5CF6' },
];

export const ThanksButton = ({ recipeId, authorId, currentUserId, recipeName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [hasSent, setHasSent] = useState(false);
    const { addToast } = useToast();

    // Don't show for own recipes
    if (currentUserId === authorId) return null;
    // Don't show if not logged in
    if (!currentUserId) return null;

    const handleSendThanks = async (option) => {
        if (isSending) return;

        setSelectedOption(option);
        setIsSending(true);

        try {
            // Create notification for the author
            const { error } = await supabase
                .from('notifications')
                .insert({
                    recipient_id: authorId,
                    actor_id: currentUserId,
                    recipe_id: recipeId,
                    type: 'thanks',
                    metadata: {
                        thanks_type: option.id,
                        message: option.label,
                        emoji: option.emoji,
                    }
                });

            if (error) throw error;

            setHasSent(true);
            setIsOpen(false);
            addToast(`${option.emoji} 感謝を送りました！`, 'success');

            // Track analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'send_thanks', {
                    thanks_type: option.id,
                    recipe_id: recipeId,
                });
            }
        } catch (error) {
            console.error('Error sending thanks:', error);
            addToast('送信に失敗しました', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (hasSent) {
        return (
            <div className="thanks-sent-badge">
                <span className="thanks-sent-icon">{selectedOption?.emoji || '💕'}</span>
                <span className="thanks-sent-text">感謝を送りました</span>
            </div>
        );
    }

    return (
        <div className="thanks-button-wrapper">
            <button
                className={`thanks-trigger-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Heart size={18} className="thanks-heart-icon" />
                <span>感謝を送る</span>
            </button>

            {isOpen && (
                <div className="thanks-options-panel">
                    <div className="thanks-panel-header">
                        <Sparkles size={16} />
                        <span>気持ちを選んで送ろう</span>
                    </div>
                    <div className="thanks-options-grid">
                        {THANKS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                className="thanks-option-btn"
                                onClick={() => handleSendThanks(option)}
                                disabled={isSending}
                                style={{ '--option-color': option.color }}
                            >
                                <span className="thanks-option-emoji">{option.emoji}</span>
                                <span className="thanks-option-label">{option.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        className="thanks-panel-close"
                        onClick={() => setIsOpen(false)}
                    >
                        キャンセル
                    </button>
                </div>
            )}
        </div>
    );
};

export default ThanksButton;
