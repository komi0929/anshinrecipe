'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useProfile } from '../../../hooks/useProfile';
import { useRecipes } from '../../../hooks/useRecipes';
import { useToast } from '../../../components/Toast';
import { ArrowLeft, Bookmark, Share2, ExternalLink, User as UserIcon, Clock, Smile, Heart, CheckCircle, MessageCircle, Pencil } from 'lucide-react';
import { getReactionCounts, getUserReaction, toggleReaction, getTriedReports, deleteTriedReport } from '../../../lib/actions/socialActions';
import { getRecommendedRecipes } from '../../../lib/recommendations';
import TriedReportForm from '../../../components/TriedReportForm';
import TriedReportCard from '../../../components/TriedReportCard';
import { ReportButton } from '../../../components/ReportButton';
import { SmartEmbed } from '../../../components/SmartEmbed';
import { CookingLog } from '../../../components/CookingLog';
import './RecipeDetailPage.css';

const RecipeDetailPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { profile, user } = useProfile();
    const { recipes, addCookingLog } = useRecipes(); // Note: useRecipes normally returns { recipes, loading, addCookingLog } but trying to match existing usage if possible. 
    // Wait, the existing code uses `useProfile` and `supabase` directly to fetch the SINGLE recipe.
    // It does NOT use `useRecipes` hook for fetching the single recipe details currently.
    // It fetches manually in `useEffect`.
    // I should check if I should use `useRecipes` or just keep the manual fetch.
    // The existing code does: `const { addToast } = useToast(); ... useEffect(() => { ... fetch from supabase ... })`
    // It does NOT import `useRecipes`.
    // I need to import `useRecipes` to get `addCookingLog`.
    // Re-reading file content...
    // The top imports DO NOT include `useRecipes`.
    // I need to add that import first.
    // My previous 'Import SmartEmbed' step was fine.
    // Now I need to add `import { useRecipes } from '../../../hooks/useRecipes';`
    const { addToast } = useToast();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userReaction, setUserReaction] = useState(null);
    const [reactionCounts, setReactionCounts] = useState({ yummy: 0, helpful: 0, ate_it: 0 });
    const [isSaved, setIsSaved] = useState(false);
    const [triedReports, setTriedReports] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [showReportForm, setShowReportForm] = useState(false);

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                setLoading(true);

                // Fetch recipe with author
                const { data, error } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        profiles:user_id (
                            username,
                            avatar_url
                        ),
                        cooking_logs (id, content, rating, created_at, user_id)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setRecipe(data);

                // Fetch interaction status if logged in
                if (user) {
                    const reaction = await getUserReaction(id, user.id);
                    setUserReaction(reaction);

                    const { data: saveData } = await supabase
                        .from('saved_recipes')
                        .select('id')
                        .eq('recipe_id', id)
                        .eq('user_id', user.id)
                        .single();
                    setIsSaved(!!saveData);
                }

                // Fetch reaction counts
                const counts = await getReactionCounts(id);
                setReactionCounts(counts);

                // Fetch tried reports
                const reports = await getTriedReports(id);
                setTriedReports(reports);

                // Fetch recommendations
                const recs = await getRecommendedRecipes(data, 6);
                setRecommendations(recs);

            } catch (error) {
                console.error('Error fetching recipe:', error);
                addToast('レシピの読み込みに失敗しました', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRecipe();
        }
    }, [id, user, addToast]);

    const handleReaction = async (reactionType) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const newReaction = await toggleReaction(id, reactionType, user.id);
            setUserReaction(newReaction);

            // Refresh counts
            const counts = await getReactionCounts(id);
            setReactionCounts(counts);

            // Toast logic
            if (newReaction === null) {
                // Removed
            } else {
                // Added
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            addToast('エラーが発生しました', 'error');
        }
    };

    const handleSave = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            if (isSaved) {
                await supabase.from('saved_recipes').delete().eq('recipe_id', id).eq('user_id', user.id);
                setIsSaved(false);
                addToast('ブックマークを解除しました', 'info');
            } else {
                await supabase.from('saved_recipes').insert({ recipe_id: id, user_id: user.id });
                setIsSaved(true);
                addToast('レシピを保存しました', 'success');
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        }
    };

    const handleAddLog = async (logData) => {
        if (!user || !recipe) return;
        try {
            await addCookingLog({
                ...logData, // { content, rating, created_at }
                recipe_id: recipe.id,
                user_id: user.id
            });
            // Ideally refetch logs here, but for MVP standard fetchRefresh might be needed?
            // Since we manually fetch recipe in useEffect, we might need to manually update `recipe.cooking_logs`.
            // The `useRecipes` hook updates its own list, but this component manages its own `recipe` state.
            // I should update `recipe` state to include the new log.
            // Simplified: Refresh page or re-fetch.
            // Let's rely on standard re-fetch?
            // Or better: manual state update.
            const newLog = { ...logData, id: 'temp-' + Date.now(), user_id: user.id }; // Temp ID
            // Ideally we get the real object back.
            // But `addCookingLog` (in my hook) refetches `useRecipes` list, not this local state.
            // So I should reload the page for now or re-trigger fetch.
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="loading-spinner">読み込み中...</div>;
    if (!recipe) return <div className="error-state">レシピが見つかりません</div>;

    // Calculate Safety
    const safeFor = profile?.children?.filter(child => {
        if (!child.allergens || child.allergens.length === 0) return true;
        if (!recipe.free_from_allergens || recipe.free_from_allergens.length === 0) return false;
        return child.allergens.every(allergen => recipe.free_from_allergens.includes(allergen));
    }) || [];

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="container recipe-detail-page">
            <div className="detail-header">
                <Link href="/" className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <div className="header-actions">
                    {user && recipe.user_id === user.id && (
                        <Link href={`/recipe/${id}/edit`} className="action-btn edit-btn">
                            <Pencil size={24} />
                        </Link>
                    )}
                    <button
                        onClick={() => handleReaction('like')}
                        className={`action-btn ${userReaction === 'like' ? 'active text-rose-500' : ''}`}
                    >
                        <Heart size={24} fill={userReaction === 'like' ? "currentColor" : "none"} />
                        {totalReactions > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                                {totalReactions}
                            </span>
                        )}
                    </button>
                    <button onClick={handleSave} className={`action-btn ${isSaved ? 'active' : ''}`}>
                        <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={async () => {
                            const shareData = {
                                title: `【あんしんレシピ】${recipe.title}`,
                                text: `${recipe.title} #アレルギー対応 #あんしんレシピ`,
                                url: window.location.href,
                            };

                            if (navigator.share) {
                                try {
                                    await navigator.share(shareData);
                                } catch (err) {
                                    // User cancelled or failed
                                    console.log('Share skipped', err);
                                }
                            } else {
                                // Fallback for desktop: Copy link
                                try {
                                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                    addToast('リンクをコピーしました', 'success');
                                } catch (err) {
                                    // Fallback to LINE if copy fails?
                                    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
                                }
                            }
                        }}
                        className="action-btn"
                        aria-label="シェア"
                    >
                        <Share2 size={24} />
                    </button>
                </div>
            </div>

            <div className="recipe-hero">
                <img src={recipe.image_url} alt={recipe.title} className="hero-image" />
                {safeFor.length > 0 && (
                    <div className="hero-badges">
                        {safeFor.map(child => (
                            <span key={child.id} className="safe-badge">
                                {child.icon} {child.name}ちゃんOK
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="recipe-info">
                <h1 className="detail-title">{recipe.title}</h1>

                <div className="recipe-meta">
                    <div className="author-info">
                        {recipe.profiles?.avatar_url ? (
                            <img src={recipe.profiles.avatar_url} alt="" className="author-avatar-small" />
                        ) : (
                            <div className="author-avatar-placeholder small">
                                <UserIcon size={16} />
                            </div>
                        )}
                        <span className="author-name">{recipe.profiles?.username || 'ゲスト'}</span>
                    </div>
                    <div className="date-info">
                        <Clock size={14} />
                        {new Date(recipe.created_at).toLocaleDateString()}
                    </div>
                </div>

                {/* Heart Reaction moved to header */}

                {/* --- NEW: Smart Embed (YouTube/TikTok) --- */}
                {recipe.source_url && (
                    <SmartEmbed url={recipe.source_url} />
                )}
                {/* ----------------------------------------- */}

                {recipe.source_url && (
                    <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="source-link-btn">
                        レシピを見る <ExternalLink size={16} />
                    </a>
                )}

                <div className="detail-section">
                    <h3>アレルギー情報（使用していない素材）</h3>
                    <div className="allergen-list">
                        {recipe.free_from_allergens && recipe.free_from_allergens.length > 0 ? (
                            recipe.free_from_allergens.map(allergen => (
                                <span key={allergen} className="allergen-chip free-from">
                                    {allergen}
                                </span>
                            ))
                        ) : (
                            <p className="text-muted">アレルギー除去情報はありません</p>
                        )}
                    </div>
                </div>

                {recipe.positive_ingredients && recipe.positive_ingredients.length > 0 && (
                    <div className="detail-section">
                        <h3>使用している食材</h3>
                        <div className="ingredient-tags">
                            {recipe.positive_ingredients.map(ingredient => (
                                <Link
                                    key={ingredient}
                                    href={`/search/ingredient/${encodeURIComponent(ingredient)}`}
                                    className="ingredient-tag"
                                >
                                    {ingredient}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="detail-section">
                    <h3>おすすめポイント</h3>
                    <p className="recipe-description">
                        {recipe.memo || recipe.description || '説明はありません'}
                    </p>
                </div>

                {/* Scenes Section */}
                {recipe.scenes && recipe.scenes.length > 0 && (
                    <div className="detail-section">
                        <h3>おすすめシーン</h3>
                        <div className="scenes-list">
                            {recipe.scenes.map(scene => (
                                <span key={scene} className="scene-chip">{scene}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Memo Section - Removed as it's now merged with Description */
                    /* 
                                    {recipe.memo && (
                                        <div className="detail-section">
                                            <h3>メモ</h3>
                                            <p className="recipe-memo">{recipe.memo}</p>
                                        </div>
                                    )} 
                    */
                }

                <div className="detail-section">
                    <h3>タグ</h3>
                    <div className="tags-list">
                        {recipe.tags && recipe.tags.map(tag => (
                            <span key={tag} className="tag-chip">#{tag}</span>
                        ))}
                    </div>
                </div>

                {/* --- NEW LOCATION: My Kitchen Lab (Cooking Log) --- */}
                {user && (
                    <CookingLog
                        logs={recipe.cooking_logs || []}
                        onAddLog={handleAddLog}
                        currentUserId={user.id}
                    />
                )}
                {/* -------------------------------------------------- */}

                {/* Tried Reports Section */}
                <div className="detail-section tried-reports-section">
                    <div className="section-header-with-action">
                        <h3>試してみたレポート ({triedReports.length})</h3>
                        {user && (
                            <button
                                onClick={() => setShowReportForm(!showReportForm)}
                                className="add-report-btn"
                            >
                                <MessageCircle size={18} />
                                <span>{showReportForm ? 'キャンセル' : '投稿する'}</span>
                            </button>
                        )}
                    </div>

                    {showReportForm && (
                        <TriedReportForm
                            recipeId={id}
                            userId={user?.id}
                            onSuccess={(newReport) => {
                                setTriedReports([newReport, ...triedReports]);
                                setShowReportForm(false);
                            }}
                            onCancel={() => setShowReportForm(false)}
                        />
                    )}

                    <div className="tried-reports-list">
                        {triedReports.length > 0 ? (
                            triedReports.map(report => (
                                <TriedReportCard
                                    key={report.id}
                                    report={report}
                                    currentUserId={user?.id}
                                    onDelete={async (reportId) => {
                                        try {
                                            await deleteTriedReport(reportId, user.id);
                                            setTriedReports(triedReports.filter(r => r.id !== reportId));
                                            addToast('レポートを削除しました', 'info');
                                        } catch (error) {
                                            addToast('削除に失敗しました', 'error');
                                        }
                                    }}
                                />
                            ))
                        ) : (
                            <p className="empty-state">まだレポートはありません</p>
                        )}
                    </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="detail-section recommendations-section">
                        <h3>こちらもおすすめ</h3>
                        <div className="recommendations-grid">
                            {recommendations.map(rec => (
                                <Link key={rec.id} href={`/recipe/${rec.id}`} className="recommendation-card">
                                    <img src={rec.image_url} alt={rec.title} />
                                    <p className="rec-title">{rec.title}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}


                <ReportButton recipeId={id} userId={user?.id} />
            </div>
        </div>
    );
};

export default RecipeDetailPage;
