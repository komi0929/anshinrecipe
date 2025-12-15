import { useState, useEffect } from 'react';

const STORAGE_KEY = 'anshin_recipe_list';

const INITIAL_RECIPES = [
    {
        id: '1',
        title: '米粉のパンケーキ',
        image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=500&q=60',
        description: '卵・乳・小麦不使用。米粉で作るもちもちパンケーキです。',
        sourceUrl: 'https://cookpad.com/recipe/1234567',
        targetChildren: [],
        tags: ['おやつ', '朝食', '簡単']
    },
    {
        id: '2',
        title: '野菜たっぷりキーマカレー',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=60',
        description: '市販のルウを使わず、スパイスで作るアレルギー対応カレー。',
        sourceUrl: 'https://delishkitchen.tv/recipes/1234567',
        targetChildren: [],
        tags: ['夕食', 'メイン', '野菜']
    }
];

export const useRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setRecipes(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recipes', e);
                setRecipes(INITIAL_RECIPES);
            }
        } else {
            setRecipes(INITIAL_RECIPES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
        }
        setLoading(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const addRecipe = (recipe) => {
        const newRecipe = { ...recipe, id: Date.now().toString() };
        const newRecipes = [newRecipe, ...recipes];
        setRecipes(newRecipes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
    };

    const deleteRecipe = (id) => {
        const newRecipes = recipes.filter(r => r.id !== id);
        setRecipes(newRecipes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
    };

    return {
        recipes,
        loading,
        addRecipe,
        deleteRecipe
    };
};
