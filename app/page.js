'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

// Onboarding Components - Removed per user request
import { useNotifications } from '@/hooks/useNotifications';
import ChildOnboardingPopup from '@/components/ChildOnboardingPopup';

// Random greeting messages
const GREETINGS = [
    'こんにちは！今日も素敵なレシピを探しましょう✨',
    'お料理日和ですね🍳',
    '今日のごはんは何にしますか？',
    '素敵なレシピが見つかりますように🌟',
    '今日もお子さまの笑顔のために😊',
    '新しいレシピが届いています🎉',
    '今日も安心おいしいごはんを🍽️',
];

const RecipeListPage = () => {
    const { recipes, loading, refreshRecipes } = useRecipes();
    const { profile, user, loading: profileLoading, savedRecipeIds, toggleSave, likedRecipeIds, toggleLike } = useProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [selectedScene, setSelectedScene] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(true); // Control wizard visibility


    // New Tab State
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || 'recommend'); // 'recommend', 'saved', 'mine'
    const [tabRecipes, setTabRecipes] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState(null); // null, 'newest', or 'likes'
    const { unreadCount } = useNotifications(user?.id);

    // Update activeTab when URL changes
    useEffect(() => {
        if (tabFromUrl && ['recommend', 'saved', 'mine'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    // Random greeting - stable per session
    const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

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
                    // Use the data from useRecipes hook, excluding own posts
                    const filtered = recipes.filter(r => r.userId !== user.id);
                    setTabRecipes(filtered);
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
                            like_count: item.recipe.like_count || 0,
                            save_count: item.recipe.save_count || 0,
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
                            sourceUrl: r.source_url,
                            like_count: r.like_count || 0,
                            save_count: r.save_count || 0,
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

    // GA Search Tracking
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm && searchTerm.length > 1) {
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'search', { search_term: searchTerm });
                }
            }
        }, 2000); // 2 seconds debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);

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

            // Child filter: if selectedChildId is set, filter for that child
            // If selectedChildId is null ("全員"), show recipes safe for ALL registered children
            if (profile?.children?.length > 0) {
                if (selectedChildId) {
                    // Specific child selected
                    if (!recipe.safeFor.some(c => c.id === selectedChildId)) return false;
                } else {
                    // "全員" selected - recipe must be safe for ALL children
                    if (recipe.safeFor.length !== profile.children.length) return false;
                }
            }

            if (selectedScene) {
                if (!recipe.scenes || !recipe.scenes.includes(selectedScene)) return false;
            }

            return true;
        });

        // Sort by safety match first, then by sortOrder
        return filtered.sort((a, b) => {
            const aSafe = a.safeFor.length > 0;
            const bSafe = b.safeFor.length > 0;

            // 1. Safety Match first
            if (aSafe && !bSafe) return -1;
            if (!aSafe && bSafe) return 1;

            // 2. Sort by user preference
            if (sortOrder === 'likes') {
                const aLikes = a.like_count || a.likeCount || 0;
                const bLikes = b.like_count || b.likeCount || 0;
                if (bLikes - aLikes !== 0) return bLikes - aLikes;
            } else if (sortOrder === 'newest') {
                const dateA = new Date(a.created_at || a.createdAt || 0);
                const dateB = new Date(b.created_at || b.createdAt || 0);
                if (dateB - dateA !== 0) return dateB - dateA;
            } else if (sortOrder === 'saves') {
                const aSaves = a.save_count || a.saveCount || 0;
                const bSaves = b.save_count || b.saveCount || 0;
                if (bSaves - aSaves !== 0) return bSaves - aSaves;
            }

            // 3. Newest as secondary or primary sort
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            if (dateB - dateA !== 0) return dateB - dateA;

            // 4. Stable Tie-breaker
            const idA = String(a.id || a.recipe_id);
            const idB = String(b.id || b.recipe_id);
            return idA.localeCompare(idB);
        });
    }, [processedRecipes, searchTerm, selectedChildId, selectedScene, sortOrder]);

    // ----------------------------------------------------
    // VIEW STATE MANAGEMENT
    // ----------------------------------------------------

    // Removed blocking loading state - content will render immediately
    // with skeleton placeholders where needed

    // 2. Not Logged In -> Original Landing Page
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center bg-[#fcfcfc]">
                <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-[480px] mx-auto w-full">
                    <div className="text-center mb-8 w-full">
                        <div className="flex justify-center mb-6">
                            <Image
                                src="/logo.png"
                                alt="あんしんレシピ"
                                width={360}
                                height={90}
                                priority
                                className="w-[200px] h-auto object-contain"
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-700 mb-4 leading-relaxed">
                            アレルギーっ子が笑顔になれる<br />みんなのレシピ帳
                        </h2>
                    </div>

                    <div className="w-full flex flex-col gap-4 mb-10 px-2">
                        <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            <div className="bg-orange-50 text-primary p-3 rounded-xl flex items-center justify-center shrink-0">
                                <Search size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-700 mb-1">簡単メモ</h3>
                                <p className="text-[13px] text-slate-500 leading-normal">
                                    子どものアレルギー情報や、食べられる食材をサッと記録
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            <div className="bg-orange-50 text-primary p-3 rounded-xl flex items-center justify-center shrink-0">
                                <BookHeart size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-700 mb-1">レシピを共有</h3>
                                <p className="text-[13px] text-slate-500 leading-normal">
                                    工夫したレシピを投稿して、同じ悩みを持つパパ・ママにシェア
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            <div className="bg-orange-50 text-primary p-3 rounded-xl flex items-center justify-center shrink-0">
                                <Heart size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-700 mb-1">感謝を伝えられる</h3>
                                <p className="text-[13px] text-slate-500 leading-normal">
                                    「助かった！」「美味しかった！」の気持ちをスタンプで気軽に送信
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-white rounded-3xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col items-center gap-6">
                            <p className="text-center text-slate-700 font-bold text-base leading-relaxed">
                                LINEアカウントでログインして<br />
                                今すぐ始めましょう
                            </p>

                            <div className="w-full flex justify-center">
                                <LineLoginButton />
                            </div>

                            <p className="text-center text-slate-500 text-sm leading-relaxed">
                                ログインをもって <Link href="/terms" className="text-blue-500 underline">利用規約</Link>・<Link href="/privacy" className="text-blue-500 underline">プライバシーポリシー</Link> に同意とみなします
                            </p>
                        </div>
                    </div>
                </div>
                <Footer showLinks={false} />
            </div>
        );
    }

    // 3. Logged In but No Children -> Onboarding Wizard
    // 3. Show empty state for logged-in users without children
    // CRITICAL: Wait for profile data to be fully loaded (profile.id exists)
    // This prevents incorrect flash of "register child" screen
    if (profileLoading || !profile?.id) {
        return null; // Wait for profile data to fully load
    }

    if (profile?.children?.length === 0) {
        return (
            <div className="container max-w-md mx-auto min-h-screen bg-background pb-20">
                <div className="pt-6 pb-4 px-4 text-center">
                    <h1 className="flex justify-center">
                        <Image
                            src="/logo.png"
                            alt="あんしんレシピ"
                            width={360}
                            height={90}
                            priority
                            className="h-[60px] w-auto"
                        />
                    </h1>
                </div>

                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-100">
                        <span className="text-4xl">👶</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-3">
                        お子様を登録しましょう
                    </h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        アレルギー情報を登録すると<br />
                        すべての機能が使用いただけます
                    </p>
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-95"
                    >
                        お子様を登録する
                    </Link>
                </div>
            </div>
        );
    }


    // 4. Main Feed (Logged In & Setup Complete)
    return (
        <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
            {/* Child Registration Onboarding Popup */}
            <ChildOnboardingPopup profile={profile} />

            {/* Header with Personalization */}
            <div className="pt-6 pb-4 px-4 flex items-center justify-between">
                <div>
                    <Image
                        src="/logo.png"
                        alt="あんしんレシピ"
                        width={450} // Increased for 150% size
                        height={113}
                        priority
                        className="h-[90px] w-auto object-contain"
                    />
                    {/* Greeting Logic: Random message */}
                    <p className="text-xs text-text-sub font-bold mt-1 ml-1 flex items-center gap-1">
                        <Sparkles size={12} className="text-yellow-400" />
                        {greeting}
                    </p>
                </div>
            </div>

            {user && (
                <>
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 mx-4 space-x-1">
                        {['recommend', 'saved', 'mine'].map((tab) => {
                            const labels = { recommend: 'みんなの投稿', saved: '保存済み', mine: '自分の投稿' };
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
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold" size={20} />
                            <input
                                type="text"
                                id="header-search-input" // For CoachMark
                                placeholder="レシピ名、食材、タグで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-2 border-transparent rounded-full pr-5 py-3.5 text-slate-700 placeholder-slate-400 transition-all outline-none focus:border-orange-300 focus:shadow-[0_0_0_4px_rgba(251,146,60,0.1)] shadow-sm"
                                style={{ paddingLeft: '64px' }}
                            />
                        </div>
                    </div>

                    {/* Sort Toggle */}
                    <div className="flex items-center justify-end gap-2 px-4 mb-3">
                        <span className="text-xs text-slate-400 mr-1">並び替え:</span>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? null : 'newest')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sortOrder === 'newest' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            🕐 新着順
                        </button>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'likes' ? null : 'likes')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sortOrder === 'likes' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            ❤️ いいね！順
                        </button>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'saves' ? null : 'saves')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sortOrder === 'saves' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            📚 保存数順
                        </button>
                    </div>

                    {/* Child Selection Row */}
                    {profile?.children?.length > 0 && (
                        <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {/* Only show "全員" button if there are 2+ children */}
                            {profile.children.length > 1 && (
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
                            )}
                            {profile.children.map(child => (
                                <button
                                    key={child.id}
                                    className={`
                                        px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                                        ${selectedChildId === child.id || (profile.children.length === 1 && selectedChildId === null)
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

            {/* Recipe Grid - CSS Grid Layout for stability */}
            <div className="px-3 grid grid-cols-2 gap-3 pb-24">
                {loading || tabLoading || !imagesLoaded ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i}>
                            <RecipeCardSkeleton />
                        </div>
                    ))
                ) : filteredRecipes.length > 0 ? (
                    filteredRecipes.map(recipe => (
                        <div key={recipe.id}>
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
                            {activeTab === 'saved' ? '🔖' : activeTab === 'mine' ? '🍳' : '📚'}
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">
                            {activeTab === 'saved' ? '保存したレシピはありません' :
                                activeTab === 'mine' ? 'まだ投稿がありません' :
                                    searchTerm || selectedScene ? 'レシピが見つかりませんでした' :
                                        'まだ他のユーザーの投稿がありません'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 whitespace-pre-line">
                            {activeTab === 'saved' ? '気に入ったレシピを保存して、\nあなただけのレシピブックを作りましょう！' :
                                activeTab === 'mine' ? 'お子さまのためのレシピを記録しませんか？' :
                                    searchTerm || selectedScene ? '検索条件を変えて試してみてください' :
                                        '新しいレシピが投稿されるのをお待ちください✨\nあなたも「自分の投稿」から投稿できます！'}
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


        </div>
    );
};

const RecipeListPageWrapper = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="animate-pulse">
                    <img
                        src="/logo.png"
                        alt="Loading..."
                        width={180}
                        height={45}
                        className="object-contain opacity-50"
                    />
                </div>
            </div>
        }>
            <RecipeListPage />
        </Suspense>
    );
};

export default RecipeListPageWrapper;
