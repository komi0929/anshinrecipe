'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Bookmark } from 'lucide-react';
import './RecipeCard.css';
import { useRecipes } from '../hooks/useRecipes';
import { useProfile } from '../hooks/useProfile';

export const RecipeCard = ({ recipe, isSaved, onToggleSave, isLiked, onToggleLike }) => {
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const { previewImage } = useRecipes();
    const { user } = useProfile();

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

    return (
        <Link href={`/recipe/${recipe.id}`} className="recipe-card-visual">
            <div className="card-visual-container">
                {/* Image or Placeholder */}
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="card-visual-image"
                        loading="lazy"
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
