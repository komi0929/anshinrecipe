'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';

import { Search, Plus, User as UserIcon, Grid, Bookmark, Heart, Baby, BookHeart } from 'lucide-react';
import { RecipeCardSkeleton } from '@/components/Skeleton';
import { RecipeCard } from '../components/RecipeCard';
import { MEAL_SCENES, SCENE_ICONS } from '@/lib/constants';
import { Footer } from '@/components/Footer';
import LineLoginButton from '@/components/LineLoginButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const RecipeListPage = () => {
    const { recipes, loading, refreshRecipes } = useRecipes();
    const { profile, user, loading: profileLoading, savedRecipeIds, toggleSave, likedRecipeIds, toggleLike } = useProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [selectedScene, setSelectedScene] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);


    // New Tab State
    const [activeTab, setActiveTab] = useState('recommend'); // 'recommend', 'saved', 'mine'
    const [tabRecipes, setTabRecipes] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    useEffect(() => {
        // Reduced delay for faster initial showing
        const timer = setTimeout(() => {
            setImagesLoaded(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

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
    const processedRecipes = tabRecipes.map(recipe => {
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

    const filteredRecipes = processedRecipes.filter(recipe => {
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
    filteredRecipes.sort((a, b) => {
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
        return String(a.id).localeCompare(String(b.id));
    });

    // Show LP for non-logged-in users
    if (!profileLoading && !user && !loading) {
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

                        {/* New Hero Illustration */}
                        <div className="flex justify-center mb-6">
                            <div className="relative w-full max-w-[320px] aspect-[4/3]">
                                <Image
                                    src="/illustrations/happy_family.png"
                                    alt="家族で楽しく料理"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-700 mb-2">
                            「これなら食べられる！」を<br />もっと簡単に、家族みんなで。
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            アレルギーっ子のパパ・ママのための<br />
                            安心レシピ共有＆記録アプリ
                        </p>
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

    // Show empty state for logged-in users without children
    if (!profileLoading && user && profile?.children?.length === 0 && !loading) {
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

                <div className="text-center py-20 px-6 max-w-md mx-auto">
                    <div className="mb-8 flex justify-center">
                        <UserIcon size={64} className="text-primary/50" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-text-main">お子様を登録しましょう</h2>
                    <p className="text-text-sub mb-8 leading-relaxed">
                        アレルギー情報を登録すると、<br />
                        レシピの安全性をチェックできます
                    </p>
                    <Link href="/profile">
                        <Button>プロフィールを設定</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Main feed for logged-in users with children
    return (
        <div className="container max-w-md mx-auto min-h-screen bg-background pb-24">
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
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                            <input
                                type="text"
                                placeholder="レシピ名、食材、タグで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-2 border-transparent rounded-full pl-14 pr-5 py-3 text-slate-700 placeholder-slate-400 transition-all outline-none focus:border-orange-300 focus:shadow-[0_0_0_4px_rgba(251,146,60,0.1)]"
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
                        <div key={recipe.id} className="break-inside-avoid mb-3">
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

            {/* Removed FAB */}
        </div>
    );
};

export default RecipeListPage;
