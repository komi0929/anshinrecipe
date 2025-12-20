'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, User as UserIcon, Heart, Bookmark, Pencil, UtensilsCrossed } from 'lucide-react';
import './RecipeCard.css';
import { useRecipes } from '../hooks/useRecipes';
import { useProfile } from '../hooks/useProfile';
import { SCENE_ICONS } from '../lib/constants';

export const RecipeCard = ({ recipe, isSaved, onToggleSave, isLiked, onToggleLike }) => {
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const { previewImage } = useRecipes();
    const { user, profile } = useProfile(); // Get current user


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
        const recipeAllergens = recipe.freeFromAllergens || recipe.free_from_allergens || [];
        if (!child.allergens || child.allergens.length === 0) return true;
        if (!recipeAllergens || recipeAllergens.length === 0) return false;
        return child.allergens.every(allergen => recipeAllergens.includes(allergen));
    })) || [];

    // Trigger async preview image fetch if image missing but sourceUrl exists
    useEffect(() => {
        if (!recipe.image && recipe.sourceUrl) {
            previewImage(recipe.sourceUrl, recipe.id);
        }
    }, [recipe.image, recipe.sourceUrl, recipe.id, previewImage]);

    return (
        <Link href={`/recipe/${recipe.id}`} className="recipe-card">
            <div className="recipe-image-wrapper">
                {/* Use standard img tag for Masonry compatibility (Next.js Image with fill needs fixed container) */}
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="recipe-image"
                        loading="lazy"
                    />
                ) : (
                    <div className="recipe-image-placeholder">
                        <UtensilsCrossed size={32} />
                        <span>タップで詳細を見る</span>
                    </div>
                )}

                {/* Only show child badges for own recipes */}
                {user && recipe.userId === user.id && safeFor.length > 0 && (
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

                {/* Scene Tags - Show max 2, compact display */}
                {recipe.scenes && recipe.scenes.length > 0 && (
                    <div className="recipe-scene-tags compact">
                        {recipe.scenes.slice(0, 2).map(scene => (
                            <span key={scene} className="recipe-scene-tag">
                                <span className="tag-icon">{SCENE_ICONS[scene] || '🍽️'}</span>
                                {scene}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions Row - Now separated from image */}
                <div className="card-actions-row">
                    <button
                        className={`action-btn-new like ${likedState ? 'active' : ''}`}
                        onClick={handleLike}
                        type="button"
                        aria-label={likedState ? "いいねを取り消す" : "いいね"}
                    >
                        <Heart size={20} fill={likedState ? "currentColor" : "none"} />
                    </button>

                    <button
                        className={`action-btn-new save ${savedState ? 'active' : ''}`}
                        onClick={handleSave}
                        type="button"
                        aria-label={savedState ? "保存を取り消す" : "保存する"}
                    >
                        <Bookmark size={20} fill={savedState ? "currentColor" : "none"} />
                    </button>

                    {user && recipe.userId === user.id && (
                        <button
                            className="action-btn-new edit"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/recipe/edit/${recipe.id}`;
                            }}
                            type="button"
                            aria-label="編集"
                        >
                            <Pencil size={20} />
                        </button>
                    )}
                </div>
            </div>
        </Link>
    );
};
