'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';

import { Search, Plus, User as UserIcon, Grid, Bookmark, Heart, Baby, BookHeart, Sparkles } from 'lucide-react';
import { RecipeCardSkeleton } from '@/components/Skeleton';
import { RecipeCard } from '../components/RecipeCard';
import { MEAL_SCENES, SCENE_ICONS } from '@/lib/constants';
import { Footer } from '@/components/Footer';
import LineLoginButton from '@/components/LineLoginButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Onboarding Components
import WelcomeSlider from '@/components/WelcomeSlider';
import OnboardingWizard from '@/components/OnboardingWizard';
import CoachMark from '@/components/CoachMark';

const RecipeListPage = () => {
    const { recipes, loading, refreshRecipes } = useRecipes();
    const { profile, user, loading: profileLoading, savedRecipeIds, toggleSave, likedRecipeIds, toggleLike } = useProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [selectedScene, setSelectedScene] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(true); // Control wizard visibility


    // New Tab State
    const [activeTab, setActiveTab] = useState('recommend'); // 'recommend', 'saved', 'mine'
    const [tabRecipes, setTabRecipes] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    useEffect(() => {
        // No artificial delay needed, stabilize by checking actual data loading
        if (!loading && recipes.length > 0) {
            setImagesLoaded(true);
        }
    }, [loading, recipes]);

    // Fetch Logic based on Tab
    useEffect(() => {
        const fetchTabData = async () => {
            if (!user) {
                setTabRecipes([]);
                return;
            }

            setTabLoading(true);
            try {
                if (activeTab === 'recommend') {
                    // Use the data from useRecipes hook (already fetched)
                    setTabRecipes(recipes);
                } else if (activeTab === 'saved') {
                    const { data } = await supabase
                        .from('saved_recipes')
                        .select(`
                            recipe:recipes (
                                *,
                                profiles:user_id(username, avatar_url)
                            )
                        `)
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (data) {
                        const formatted = data.map(item => ({
                            id: item.recipe.id,
                            title: item.recipe.title,
                            image: item.recipe.image_url,
                            tags: item.recipe.tags,
                            scenes: item.recipe.scenes,
                            freeFromAllergens: item.recipe.free_from_allergens || [],
                            positiveIngredients: item.recipe.positive_ingredients || [],
                            author: item.recipe.profiles,
                            userId: item.recipe.user_id,
                            createdAt: item.recipe.created_at,
                        }));
                        setTabRecipes(formatted);
                    }
                } else if (activeTab === 'mine') {
                    const { data } = await supabase
                        .from('recipes')
                        .select('*, profiles:user_id(username, avatar_url)')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (data) {
                        const formatted = data.map(r => ({
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
                            sourceUrl: r.source_url
                        }));
                        setTabRecipes(formatted);
                    }
                }
            } catch (error) {
                console.error('Error fetching tab data:', error);
            } finally {
                setTabLoading(false);
            }
        };

        fetchTabData();
    }, [activeTab, user, recipes]);

    // Unified Safety Check & Filter Logic
    const processedRecipes = React.useMemo(() => {
        return tabRecipes.map(recipe => {
            if (!profile?.children) return { ...recipe, safeFor: [] };

            const safeFor = profile.children.filter(child => {
                const recipeAllergens = recipe.freeFromAllergens || recipe.free_from_allergens || [];
                if (!child.allergens || child.allergens.length === 0) return true;
                if (!recipeAllergens || recipeAllergens.length === 0) return false;
                return child.allergens.every(allergen =>
                    recipeAllergens.includes(allergen)
                );
            });

            return { ...recipe, safeFor };
        });
    }, [tabRecipes, profile?.children]);

    const filteredRecipes = React.useMemo(() => {
        const filtered = processedRecipes.filter(recipe => {
            const matchesSearch = recipe.title.includes(searchTerm) ||
                (recipe.tags && recipe.tags.some(t => t.includes(searchTerm))) ||
                (recipe.positiveIngredients && recipe.positiveIngredients.some(pi => pi.includes(searchTerm)));

            if (!matchesSearch) return false;

            if (selectedChildId) {
                if (!recipe.safeFor.some(c => c.id === selectedChildId)) return false;
            }

            if (selectedScene) {
                if (!recipe.scenes || !recipe.scenes.includes(selectedScene)) return false;
            }

            return true;
        });

        // Sort by safety match first, then newest first, with stable ID tie-breaker
        return filtered.sort((a, b) => {
            const aSafe = a.safeFor.length > 0;
            const bSafe = b.safeFor.length > 0;

            // 1. Safety Match first
            if (aSafe && !bSafe) return -1;
            if (!aSafe && bSafe) return 1;

            // 2. Newest first
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            if (dateB - dateA !== 0) return dateB - dateA;

            // 3. Stable Tie-breaker (important for masonry stability)
            const idA = String(a.id || a.recipe_id);
            const idB = String(b.id || b.recipe_id);
            return idA.localeCompare(idB);
        });
    }, [processedRecipes, searchTerm, selectedChildId, selectedScene]);

    // ----------------------------------------------------
    // VIEW STATE MANAGEMENT
    // ----------------------------------------------------

    // 1. Loading State
    if (loading || profileLoading) {
        // While loading user state, show a minimal loading screen to prevent flash
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="animate-pulse">
                    <Image
                        src="/logo.png"
                        alt="Loading..."
                        width={180}
                        height={45}
                        className="object-contain opacity-50"
                    />
                </div>
            </div>
        );
    }

    // 2. Not Logged In -> Welcome Slider (Replaces old LP)
    if (!user) {
        return <WelcomeSlider />;
    }

    // 3. Logged In but No Children -> Onboarding Wizard
    if (profile?.children?.length === 0 && showOnboarding) {
        return (
            <OnboardingWizard
                onComplete={() => {
                    // Force refresh or just redirect to self to trigger main feed
                    window.location.reload();
                    // Or simpler: setShowOnboarding(false) if we had local state for children update, 
                    // but since profile updates via hook subscription, it might just work or need a refresh.
                    // Reload is safest for "Magic" feel to ensure everything is recalculated.
                }}
            />
        );
    }


    // 4. Main Feed (Logged In & Setup Complete)
    return (
        <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
            {/* Header with Personalization */}
            <div className="pt-6 pb-4 px-4 flex items-center justify-between">
                <div>
                    <Image
                        src="/logo.png"
                        alt="あんしんレシピ"
                        width={300} // Increased base width for better resolution
                        height={75}
                        priority
                        className="h-[40px] w-auto object-contain"
                    />
                    {/* Greeting Logic: Default to userName + San */}
                    <p className="text-xs text-text-sub font-bold mt-1 ml-1 flex items-center gap-1">
                        <Sparkles size={12} className="text-yellow-400" />
                        {profile?.userName || 'ユーザー'}さん、こんにちは！
                        {/* Optional: Add logic to use child name without 'Mama' if preferred? 
                                 "User-san" covers all bases as requested "San-zuke".
                             */}
                    </p>
                </div>
                {/* Optional: Add profile icon or notification bell here? */}
            </div>

            {user && (
                <>
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 mx-4 space-x-1">
                        {['recommend', 'saved', 'mine'].map((tab) => {
                            const labels = { recommend: 'みんな', saved: '保存済み', mine: '自分の投稿' };
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-text-sub hover:text-text-main hover:bg-white/50'
                                        }
                                    `}
                                >
                                    {labels[tab]}
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-4 mb-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={20} />
                            <input
                                type="text"
                                id="header-search-input" // For CoachMark
                                placeholder="レシピ名、食材、タグで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-2 border-transparent rounded-full pl-16 pr-5 py-3.5 text-slate-700 placeholder-slate-400 transition-all outline-none focus:border-orange-300 focus:shadow-[0_0_0_4px_rgba(251,146,60,0.1)] shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Child Selection Row */}
                    {profile?.children?.length > 0 && (
                        <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                                    ${selectedChildId === null
                                        ? 'bg-primary text-white shadow-md shadow-orange-200'
                                        : 'bg-white text-text-sub border border-slate-100 hover:bg-slate-50'
                                    }
                                `}
                                onClick={() => setSelectedChildId(null)}
                            >
                                全員
                            </button>
                            {profile.children.map(child => (
                                <button
                                    key={child.id}
                                    className={`
                                        px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                                        ${selectedChildId === child.id
                                            ? 'bg-primary text-white shadow-md shadow-orange-200'
                                            : 'bg-white text-text-sub border border-slate-100 hover:bg-slate-50'
                                        }
                                    `}
                                    onClick={() => setSelectedChildId(child.id)}
                                >
                                    <span>{child.icon || '👶'}</span>
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Scene Selection Row */}
                    <div className="flex gap-2 px-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            className={`
                                px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                                ${selectedScene === null
                                    ? 'bg-primary text-white shadow-md shadow-orange-200'
                                    : 'bg-white text-text-sub border border-slate-100 hover:bg-slate-50'
                                }
                            `}
                            onClick={() => setSelectedScene(null)}
                        >
                            すべてのシーン
                        </button>
                        {MEAL_SCENES.map(scene => (
                            <button
                                key={scene}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5
                                    ${selectedScene === scene
                                        ? 'bg-primary text-white shadow-md shadow-orange-200'
                                        : 'bg-white text-text-sub border border-slate-100 hover:bg-slate-50'
                                    }
                                `}
                                onClick={() => setSelectedScene(scene)}
                            >
                                <span>{SCENE_ICONS[scene] || '🍽️'}</span>
                                {scene}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Recipe Grid - Masonry Layout (Strict Max 3 Columns) */}
            <div className="px-3 columns-2 md:columns-3 gap-3 pb-24">
                {loading || tabLoading || !imagesLoaded ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="break-inside-avoid mb-3">
                            <RecipeCardSkeleton />
                        </div>
                    ))
                ) : filteredRecipes.length > 0 ? (
                    filteredRecipes.map(recipe => (
                        <div key={recipe.id} className="break-inside-avoid-column mb-3 inline-block w-full">
                            <RecipeCard
                                recipe={recipe}
                                profile={profile}
                                isSaved={savedRecipeIds?.includes(recipe.id)}
                                onToggleSave={() => toggleSave(recipe.id)}
                                isLiked={likedRecipeIds?.includes(recipe.id)}
                                onToggleLike={() => toggleLike(recipe.id)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-10 text-center break-inside-avoid">
                        <div className="mb-4 text-6xl opacity-20 filter grayscale">
                            {activeTab === 'saved' ? '🔖' : activeTab === 'mine' ? '🍳' : '🔍'}
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">
                            {activeTab === 'saved' ? '保存したレシピはありません' :
                                activeTab === 'mine' ? 'まだ投稿がありません' :
                                    'レシピが見つかりませんでした'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {activeTab === 'saved' ? '気に入ったレシピを保存して、\nあなただけのレシピブックを作りましょう！' :
                                activeTab === 'mine' ? 'お子さまのためのレシピを記録しませんか？' :
                                    '検索条件を変えて試してみてください'}
                        </p>
                        {activeTab === 'mine' && (
                            <Link href="/recipe/new">
                                <Button className="bg-orange-500 text-white shadow-lg shadow-orange-200">
                                    最初のレシピを投稿
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Coach Marks */}
            <CoachMark
                targetId="header-search-input"
                message="冷蔵庫の余り物でも検索できますよ。"
                position="bottom"
                uniqueKey="search_intro"
                delay={2000}
            />
            {/* Note: Save button coach mark would need an ID on the save button in RecipeCard, 
                or we can add one here if there is a global save button, but there isn't.
                Ideally we pass a prop to RecipeCard to show coachmark on the first one, 
                but let's stick to the search one for now as per plan "Search Coach".
            */}

        </div>
    );
};

export default RecipeListPage;
