'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, User as UserIcon, Heart, Bookmark } from 'lucide-react';
import './RecipeCard.css';
import { useRecipes } from '@/hooks/useRecipes';

export const RecipeCard = ({ recipe, profile, isSaved, onToggleSave, isLiked, onToggleLike }) => {
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const { previewImage } = useRecipes();

    // Use prop if available, otherwise local state
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

    // Get names of children who can eat this recipe
    const safeFor = recipe.safeFor || (profile?.children?.filter(child => {
        if (!child.allergens || child.allergens.length === 0) return true;
        if (!recipe.freeFromAllergens || recipe.freeFromAllergens.length === 0) return false;
        return child.allergens.every(allergen => recipe.freeFromAllergens.includes(allergen));
    })) || [];

    // Trigger async preview image fetch if image missing but sourceUrl exists
    useEffect(() => {
        if (!recipe.image && recipe.sourceUrl) {
            previewImage(recipe.sourceUrl, recipe.id);
        }
    }, [recipe.image, recipe.sourceUrl, recipe.id, previewImage]);

    return (
        <Link href={`/recipe/${recipe.id}`} className="recipe-card fade-in">
            <div className="recipe-image-wrapper">
                <Image
                    src={recipe.image || '/images/placeholder-recipe.png'}
                    alt={recipe.title}
                    fill
                    className="recipe-image"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                />

                <div className="action-overlay">
                    <button
                        className={`action-btn like ${likedState ? 'active' : ''}`}
                        onClick={handleLike}
                        type="button"
                        aria-label={likedState ? "いいねを取り消す" : "いいね"}
                    >
                        <Heart size={18} fill={likedState ? "currentColor" : "none"} />
                    </button>
                    <button
                        className={`action-btn save ${savedState ? 'active' : ''}`}
                        onClick={handleSave}
                        type="button"
                        aria-label={savedState ? "保存を取り消す" : "保存する"}
                    >
                        <Bookmark size={18} fill={savedState ? "currentColor" : "none"} />
                    </button>
                </div>

                {safeFor.length > 0 && (
                    <div className="safety-badges-overlay">
                        {safeFor.map(child => (
                            <span key={child.id} className="mini-child-badge" title={`${child.name}ちゃんOK`}>
                                {child.icon || '👶'}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="recipe-content">
                <h3 className="recipe-title">{recipe.title}</h3>

                <div className="recipe-tags">
                    {recipe.tags && recipe.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>

                <div className="recipe-footer">
                    {recipe.author && (
                        <div className="recipe-author">
                            {recipe.author.avatar_url ? (
                                <img src={recipe.author.avatar_url} alt="" className="author-avatar" />
                            ) : (
                                <div className="author-avatar-placeholder">
                                    <UserIcon size={12} />
                                </div>
                            )}
                            <span className="author-name">{recipe.author.username || 'ゲスト'}</span>
                        </div>
                    )}
                    {recipe.sourceUrl && (
                        <div className="recipe-source">
                            <ExternalLink size={12} />
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};
