'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, PartyPopper, Star } from 'lucide-react';
import './CelebrationModal.css';

/**
 * CelebrationModal - 投稿完了時のお祝い演出
 * 
 * noteの深津氏の「コンテンツを投稿したときにこだまが返ってくる」
 * という重要な体験を実装
 */

// 「あんしんレシピさん」からのメッセージ（人格化）
const CELEBRATION_MESSAGES = {
    firstPost: [
        'おめでとうございます！🎉\n初めてのレシピ投稿ありがとうございます！\nきっと同じ悩みを持つパパママの助けになりますね✨',
        '素敵な第一歩！🌟\nあなたのレシピが、誰かの「今日のごはん」になるかも。\n一緒に安心できる食卓を広げましょう！',
    ],
    regularPost: [
        'ありがとうございます！🍳\nまた素敵なレシピが増えましたね！\nみんなに届くのが楽しみです✨',
        '投稿ありがとう！💕\nあなたのレシピを待っている人がいます！\n今日も誰かの笑顔につながりますように✨',
        'レシピ登録完了！📝\nアレルギーっ子の食卓に、\nまた一つ選択肢が増えました！',
    ],
    milestones: {
        5: '🎊 5件目の投稿達成！\nたくさんのレシピをありがとうございます！\nあなたは本当にすごい！',
        10: '👨‍🍳 10件達成！シェフバッジ獲得！\nあなたのレシピがたくさんの家庭を救っています！',
        25: '🏆 25件達成！レシピマスター！\nあなたはあんしんレシピのスターです！',
        50: '🌟 50件達成！レジェンド級！\n感謝してもしきれません！',
    }
};

// Confetti particle component
const Confetti = ({ color, delay, left }) => {
    const style = {
        '--color': color,
        '--delay': `${delay}s`,
        '--left': `${left}%`,
    };
    return <div className="confetti-particle" style={style} />;
};

// Heart burst animation
const HeartBurst = () => {
    const hearts = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        rotation: i * 30,
        delay: i * 0.05,
    }));

    return (
        <div className="heart-burst-container">
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className="heart-burst-item"
                    style={{
                        '--rotation': `${heart.rotation}deg`,
                        '--delay': `${heart.delay}s`,
                    }}
                >
                    <Heart size={16} fill="currentColor" />
                </div>
            ))}
        </div>
    );
};

export const CelebrationModal = ({
    isOpen,
    onClose,
    isFirstPost = false,
    recipeCount = 0,
    recipeName = '',
    childName = '',
}) => {
    const [showContent, setShowContent] = useState(false);
    const [confettiColors] = useState([
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
        '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#FF9A8B'
    ]);

    useEffect(() => {
        if (isOpen) {
            // Slight delay to trigger animations
            setTimeout(() => setShowContent(true), 100);
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine message based on context
    const getMessage = () => {
        // Check for milestone
        if (CELEBRATION_MESSAGES.milestones[recipeCount]) {
            return CELEBRATION_MESSAGES.milestones[recipeCount];
        }

        // First post
        if (isFirstPost) {
            const messages = CELEBRATION_MESSAGES.firstPost;
            return messages[Math.floor(Math.random() * messages.length)];
        }

        // Regular post
        const messages = CELEBRATION_MESSAGES.regularPost;
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const message = getMessage();
    const isMilestone = CELEBRATION_MESSAGES.milestones[recipeCount];

    // Generate confetti particles
    const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        delay: Math.random() * 0.5,
        left: Math.random() * 100,
    }));

    return (
        <div className="celebration-overlay" onClick={onClose}>
            {/* Confetti */}
            <div className="confetti-container">
                {confettiParticles.map(particle => (
                    <Confetti
                        key={particle.id}
                        color={particle.color}
                        delay={particle.delay}
                        left={particle.left}
                    />
                ))}
            </div>

            <div
                className={`celebration-modal ${showContent ? 'show' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon with animation */}
                <div className="celebration-icon-wrapper">
                    {isMilestone ? (
                        <div className="milestone-icon">
                            <PartyPopper size={48} />
                            <HeartBurst />
                        </div>
                    ) : isFirstPost ? (
                        <div className="first-post-icon">
                            <Star size={48} fill="currentColor" />
                            <Sparkles className="sparkle-decoration sparkle-1" size={20} />
                            <Sparkles className="sparkle-decoration sparkle-2" size={16} />
                            <Sparkles className="sparkle-decoration sparkle-3" size={14} />
                        </div>
                    ) : (
                        <div className="regular-post-icon">
                            <Heart size={48} fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Sender label */}
                <div className="celebration-sender">
                    <span className="sender-label">あんしんレシピさんより</span>
                </div>

                {/* Message */}
                <div className="celebration-message">
                    {message.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                {/* Recipe info */}
                {recipeName && (
                    <div className="celebration-recipe-info">
                        <span className="recipe-name">「{recipeName}」</span>
                        {childName && (
                            <span className="child-safe-note">
                                {childName}ちゃんにぴったりのレシピですね！
                            </span>
                        )}
                    </div>
                )}

                {/* Stats (for returning users) */}
                {recipeCount > 1 && !isMilestone && (
                    <div className="celebration-stats">
                        <span>これで {recipeCount} 件目のレシピです！</span>
                    </div>
                )}

                {/* Close button */}
                <button className="celebration-close-btn" onClick={onClose}>
                    ありがとう！ ✨
                </button>
            </div>
        </div>
    );
};

export default CelebrationModal;
