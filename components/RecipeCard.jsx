'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Star } from 'lucide-react';
import './RecipeCard.css';
import { useRecipePreview } from '../hooks/useRecipePreview';
import { useProfile } from '../hooks/useProfile';

export const RecipeCard = ({ recipe, isSaved, onToggleSave, isLiked, onToggleLike, priority = false }) => {
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const { previewImage } = useRecipePreview();
    const { user } = useProfile();
    const router = useRouter();
    const cardRef = useRef(null);

    // 🚀 Intersection Observer for mobile prefetch (100px before entering viewport)
    useEffect(() => {
        if (priority) return; // Skip for priority cards (already loaded)

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        router.prefetch(`/recipe/${recipe.id}`);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '100px' }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [recipe.id, router, priority]);

    // Prefetch on hover for faster navigation (desktop)
    const handleMouseEnter = useCallback(() => {
        router.prefetch(`/recipe/${recipe.id}`);
    }, [router, recipe.id]);

    const savedState = isSaved !== undefined ? isSaved : localIsSaved;
    const likedState = isLiked !== undefined ? isLiked : localIsLiked;

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleSave) {
            onToggleSave();
        } else {
            setLocalIsSaved(!localIsSaved);
        }
    };

    const handleLike = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleLike) {
            onToggleLike();
        } else {
            setLocalIsLiked(!localIsLiked);
        }
    };

    // Trigger async preview image fetch if image missing
    useEffect(() => {
        if (!recipe.image && recipe.sourceUrl) {
            previewImage(recipe.sourceUrl, recipe.id);
        }
    }, [recipe.image, recipe.sourceUrl, recipe.id, previewImage]);

    // Truncate title for display (max 30 chars on card)
    const displayTitle = recipe.title && recipe.title.length > 35
        ? recipe.title.substring(0, 35) + '...'
        : recipe.title;

    // プロユーザーかどうかを判定（authorにis_proがあればプロ）
    const isProUser = recipe.author?.is_pro || recipe.author?.isPro || false;

    return (
        <Link ref={cardRef} href={`/recipe/${recipe.id}`} className="recipe-card-visual" onMouseEnter={handleMouseEnter}>
            <div className="card-visual-container">
                {/* Pro User Badge */}
                {isProUser && (
                    <span className="card-pro-badge">
                        <Star size={10} fill="currentColor" />
                        プロ
                    </span>
                )}

                {/* Image or Placeholder */}
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="card-visual-image"
                        loading={priority ? "eager" : "lazy"}
                        fetchPriority={priority ? "high" : "auto"}
                    />
                ) : (
                    <div className="card-visual-placeholder">
                        <span className="placeholder-emoji">🍳</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="card-visual-gradient" />

                {/* Title on Image */}
                <div className="card-visual-title">
                    {displayTitle}
                </div>

                {/* Action Buttons - Minimal overlay */}
                <div className="card-visual-actions">
                    <button
                        className={`card-action-btn ${likedState ? 'active-like' : ''}`}
                        onClick={handleLike}
                        type="button"
                        aria-label="いいね"
                    >
                        <Heart size={18} fill={likedState ? "currentColor" : "none"} />
                    </button>
                    <button
                        className={`card-action-btn ${savedState ? 'active-save' : ''}`}
                        onClick={handleSave}
                        type="button"
                        aria-label="保存"
                    >
                        <Bookmark size={18} fill={savedState ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>
        </Link>
    );
};
