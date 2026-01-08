'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Star,
    ArrowLeft,
    Instagram,
    Youtube,
    ExternalLink,
    Grid
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardSkeleton } from '@/components/Skeleton';
import { useProfile } from '@/hooks/useProfile';
import './ProProfile.css';

// X (Twitter) icon component
const XIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

/**
 * プロユーザー公開プロフィールページ
 * 自己紹介、SNSリンク、投稿レシピ一覧を表示
 */
export default function ProProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;

    const { user, savedRecipeIds, toggleSave, likedRecipeIds, toggleLike } = useProfile();
    const [proUser, setProUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProProfile = async () => {
            if (!userId) return;

            try {
                setLoading(true);

                // Fetch profile data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError) throw profileError;

                // Check if user is pro
                if (!profileData?.is_pro) {
                    setError('このユーザーはプロユーザーではありません');
                    setLoading(false);
                    return;
                }

                setProUser({
                    id: profileData.id,
                    userName: profileData.username || profileData.display_name || 'プロユーザー',
                    avatarUrl: profileData.avatar_url || '',
                    bio: profileData.bio || '',
                    instagramUrl: profileData.instagram_url || '',
                    twitterUrl: profileData.twitter_url || '',
                    youtubeUrl: profileData.youtube_url || '',
                    blogUrl: profileData.blog_url || ''
                });

                // Fetch user's recipes
                const { data: recipesData, error: recipesError } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        profiles:user_id(username, avatar_url, is_pro),
                        likes!recipe_id (id),
                        saved_recipes!recipe_id (id)
                    `)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (recipesError) throw recipesError;

                const formattedRecipes = recipesData?.map(r => ({
                    id: r.id,
                    title: r.title,
                    image: r.image_url,
                    tags: r.tags,
                    scenes: r.scenes,
                    freeFromAllergens: r.free_from_allergens || [],
                    positiveIngredients: r.positive_ingredients || [],
                    author: r.profiles,
                    userId: r.user_id,
                    createdAt: r.created_at,
                    likeCount: r.likes?.length || 0,
                    saveCount: r.saved_recipes?.length || 0,
                })) || [];

                setRecipes(formattedRecipes);
            } catch (err) {
                console.error('Error fetching pro profile:', err);
                setError('プロフィールの読み込みに失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchProProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="pro-profile-page">
                <div className="pro-profile-loading">
                    <div className="loading-spinner" />
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error || !proUser) {
        return (
            <div className="pro-profile-page">
                <div className="pro-profile-error">
                    <p>{error || 'ユーザーが見つかりません'}</p>
                    <button onClick={() => router.back()} className="pro-back-button">
                        <ArrowLeft size={18} />
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    const hasSocialLinks = proUser.instagramUrl || proUser.twitterUrl || proUser.youtubeUrl || proUser.blogUrl;

    return (
        <div className="pro-profile-page">
            {/* Header */}
            <div className="pro-profile-header">
                <button onClick={() => router.back()} className="pro-back-icon">
                    <ArrowLeft size={24} />
                </button>
                <h1>プロフィール</h1>
                <div className="pro-header-spacer" />
            </div>

            {/* Profile Card */}
            <div className="pro-profile-card">
                <div className="pro-avatar-section">
                    <div className="pro-avatar-large">
                        {proUser.avatarUrl ? (
                            <img
                                src={proUser.avatarUrl}
                                alt={proUser.userName}
                                className="pro-avatar-img"
                            />
                        ) : (
                            <div className="pro-avatar-placeholder-large">
                                <span>👨‍🍳</span>
                            </div>
                        )}
                        <span className="pro-avatar-badge-large">
                            <Star size={14} fill="currentColor" />
                        </span>
                    </div>
                </div>

                <h2 className="pro-user-name">{proUser.userName}</h2>
                <div className="pro-verified-badge">
                    <Star size={14} fill="currentColor" />
                    認証済みプロユーザー
                </div>

                {/* Bio */}
                {proUser.bio && (
                    <p className="pro-bio">{proUser.bio}</p>
                )}

                {/* Social Links */}
                {hasSocialLinks && (
                    <div className="pro-social-links">
                        {proUser.instagramUrl && (
                            <a
                                href={proUser.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pro-social-link instagram"
                            >
                                <Instagram size={20} />
                            </a>
                        )}
                        {proUser.twitterUrl && (
                            <a
                                href={proUser.twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pro-social-link twitter"
                            >
                                <XIcon size={18} />
                            </a>
                        )}
                        {proUser.youtubeUrl && (
                            <a
                                href={proUser.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pro-social-link youtube"
                            >
                                <Youtube size={20} />
                            </a>
                        )}
                        {proUser.blogUrl && (
                            <a
                                href={proUser.blogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pro-social-link blog"
                            >
                                <ExternalLink size={18} />
                            </a>
                        )}
                    </div>
                )}

                {/* Stats */}
                <div className="pro-stats">
                    <div className="pro-stat">
                        <span className="pro-stat-value">{recipes.length}</span>
                        <span className="pro-stat-label">レシピ</span>
                    </div>
                </div>
            </div>

            {/* Recipes Section */}
            <div className="pro-recipes-section">
                <h3 className="pro-recipes-title">
                    <Grid size={18} />
                    投稿したレシピ
                </h3>

                {recipes.length > 0 ? (
                    <div className="pro-recipes-grid">
                        {recipes.map((recipe, index) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                isSaved={savedRecipeIds?.includes(recipe.id)}
                                onToggleSave={() => toggleSave(recipe.id)}
                                isLiked={likedRecipeIds?.includes(recipe.id)}
                                onToggleLike={() => toggleLike(recipe.id)}
                                priority={index < 4}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="pro-no-recipes">
                        <span className="pro-no-recipes-emoji">📝</span>
                        <p>まだレシピが投稿されていません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
