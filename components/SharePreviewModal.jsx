'use client'

import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Twitter, Facebook } from 'lucide-react';
import './SharePreviewModal.css';

/**
 * SharePreviewModal - シェア前にOGPプレビューを表示
 * 
 * シェアする前にSNSでどう見えるかをユーザーに確認させる。
 */
export const SharePreviewModal = ({
    isOpen,
    onClose,
    recipe,
    onShare
}) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/recipe/${recipe?.id}`
        : '';

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    if (!isOpen || !recipe) return null;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipe.title,
                    text: `あんしんレシピ: ${recipe.title}`,
                    url: shareUrl,
                });
                onClose();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }
    };

    return (
        <div className="share-preview-overlay" onClick={onClose}>
            <div className="share-preview-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="share-preview-header">
                    <h3>シェアプレビュー</h3>
                    <button className="share-preview-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* OGP Preview Card */}
                <div className="ogp-preview-card">
                    {recipe.image && (
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="ogp-preview-image"
                        />
                    )}
                    <div className="ogp-preview-content">
                        <div className="ogp-preview-site">あんしんレシピ</div>
                        <div className="ogp-preview-title">{recipe.title}</div>
                        {recipe.description && (
                            <div className="ogp-preview-description">
                                {recipe.description.slice(0, 100)}...
                            </div>
                        )}
                    </div>
                </div>

                {/* URL Copy */}
                <div className="share-url-container">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="share-url-input"
                    />
                    <button
                        onClick={handleCopyLink}
                        className={`share-copy-btn ${copied ? 'copied' : ''}`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'コピー済み' : 'コピー'}
                    </button>
                </div>

                {/* Share Buttons */}
                <div className="share-buttons">
                    {typeof navigator !== 'undefined' && navigator.share && (
                        <button
                            className="share-btn share-btn-native"
                            onClick={handleNativeShare}
                        >
                            <Share2 size={20} />
                            シェア
                        </button>
                    )}
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(recipe.title)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-btn share-btn-twitter"
                    >
                        <Twitter size={20} />
                        Twitter
                    </a>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-btn share-btn-facebook"
                    >
                        <Facebook size={20} />
                        Facebook
                    </a>
                    <a
                        href={`https://line.me/R/msg/text/?${encodeURIComponent(recipe.title + '\n' + shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-btn share-btn-line"
                    >
                        <MessageCircle size={20} />
                        LINE
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SharePreviewModal;
