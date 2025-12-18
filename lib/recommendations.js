import { supabase } from '@/lib/supabaseClient';

/**
 * Smart Recommendations Algorithm
 * Returns recipes similar to the current recipe based on:
 * 1. Safety Match (same free_from_allergens) - REQUIRED
 * 2. Content Match (similar tags/title) - SCORING
 */
export async function getRecommendedRecipes(currentRecipe, limit = 6) {
    if (!currentRecipe) return [];

    try {
        // Fetch all recipes with same allergen-free profile
        const { data: candidates, error } = await supabase
            .from('recipes')
            .select(`
                *,
                profiles:user_id (
                    username,
                    avatar_url
                )
            `)
            .neq('id', currentRecipe.id) // Exclude current recipe
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!candidates || candidates.length === 0) return [];

        // Score each candidate
        const scored = candidates.map(recipe => {
            let score = 0;

            // 1. Safety Match (REQUIRED) - 100 points if exact match
            const currentAllergens = currentRecipe.freeFromAllergens || currentRecipe.free_from_allergens || [];
            const recipeAllergens = recipe.freeFromAllergens || recipe.free_from_allergens || [];

            if (currentAllergens.length > 0 && recipeAllergens.length > 0) {
                const matchCount = currentAllergens.filter(a =>
                    recipeAllergens.includes(a)
                ).length;

                // Only include if at least 50% match
                if (matchCount / currentAllergens.length < 0.5) {
                    return { ...recipe, score: -1 }; // Filter out
                }

                score += (matchCount / currentAllergens.length) * 100;
            }

            // 2. Tag Match - 10 points per matching tag
            const currentTags = currentRecipe.tags || [];
            const recipeTags = recipe.tags || [];
            const tagMatches = currentTags.filter(t => recipeTags.includes(t)).length;
            score += tagMatches * 10;

            // 3. Positive Ingredients Match - 15 points per match
            const currentIngredients = currentRecipe.positiveIngredients || currentRecipe.positive_ingredients || [];
            const recipeIngredients = recipe.positiveIngredients || recipe.positive_ingredients || [];
            const ingredientMatches = currentIngredients.filter(i =>
                recipeIngredients.includes(i)
            ).length;
            score += ingredientMatches * 15;

            // 4. Title similarity (simple word overlap) - 5 points per word
            const currentWords = currentRecipe.title.toLowerCase().split(/\s+/);
            const recipeWords = recipe.title.toLowerCase().split(/\s+/);
            const titleMatches = currentWords.filter(w =>
                recipeWords.includes(w) && w.length > 1
            ).length;
            score += titleMatches * 5;

            return { ...recipe, score };
        });

        // Filter out low scores and sort
        const filtered = scored
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return filtered;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
}

/**
 * Search recipes by positive ingredient
 */
export async function searchByIngredient(ingredient) {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                *,
                profiles:user_id (
                    username,
                    avatar_url
                )
            `)
            .contains('positive_ingredients', [ingredient])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error searching by ingredient:', error);
        return [];
    }
}

/**
 * Get all unique positive ingredients from all recipes
 */
export async function getAllPositiveIngredients() {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select('positive_ingredients')
            .not('positive_ingredients', 'is', null);

        if (error) throw error;

        // Flatten and deduplicate
        const allIngredients = new Set();
        data.forEach(recipe => {
            (recipe.positive_ingredients || []).forEach(ing => {
                allIngredients.add(ing);
            });
        });

        return Array.from(allIngredients).sort();
    } catch (error) {
        console.error('Error getting ingredients:', error);
        return [];
    }
}
