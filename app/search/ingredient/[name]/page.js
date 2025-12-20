'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { searchByIngredient } from '@/lib/recommendations';
import { RecipeCard } from '@/components/RecipeCard';
import { useProfile } from '@/hooks/useProfile';

export default function IngredientSearchPage() {
    const { name } = useParams();
    const { profile } = useProfile();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const ingredientName = decodeURIComponent(name);

    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            const results = await searchByIngredient(ingredientName);

            // Format for RecipeCard
            const formatted = results.map(r => ({
                id: r.id,
                title: r.title,
                image: r.image_url,
                tags: r.tags || [],
                freeFromAllergens: r.free_from_allergens || [],
                positiveIngredients: r.positive_ingredients || [],
                author: r.profiles,
                sourceUrl: r.source_url,
                createdAt: r.created_at
            }));

            setRecipes(formatted);
            setLoading(false);
        };

        fetchRecipes();
    }, [ingredientName]);

    return (
        <div className="container">
            <div className="page-header">
                <Link href="/" className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">「{ingredientName}」を使ったレシピ</h1>
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-400">読み込み中...</div>
            ) : recipes.length === 0 ? (
                <div className="empty-state">
                    <p>「{ingredientName}」を使ったレシピが見つかりませんでした</p>
                    <Link href="/" className="btn btn-primary">
                        ホームに戻る
                    </Link>
                </div>
            ) : (
                <>
                    <p className="search-result-count">
                        {recipes.length}件のレシピが見つかりました
                    </p>
                    <div className="masonry-grid">
                        {recipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} profile={profile} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
