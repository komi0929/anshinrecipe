/**
 * Check if a recipe is safe for a specific child.
 */
export const isSafeForChild = (recipe, child) => {
    if (!child.allergens || child.allergens.length === 0) return true;
    if (!recipe.freeFromAllergens || recipe.freeFromAllergens.length === 0) return false;
    // Check if recipe is free from ALL of child's allergens
    return child.allergens.every(allergen =>
        recipe.freeFromAllergens.includes(allergen)
    );
};

/**
 * Filter recipes based on search, selected child, and selected scene.
 * Also computes and attaches 'safeFor' array to each recipe.
 */
export const filterRecipes = (recipes, { children, searchTerm, selectedChildId, selectedScene }) => {
    // 1. Compute SafeFor status first
    const processed = recipes.map(recipe => {
        if (!children) return { ...recipe, safeFor: [] };

        const safeFor = children.filter(child => isSafeForChild(recipe, child));

        return { ...recipe, safeFor };
    });

    // 2. Filter
    return processed.filter(recipe => {
        // Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = recipe.title.toLowerCase().includes(term) ||
                (recipe.tags && recipe.tags.some(t => t.toLowerCase().includes(term)));

            if (!matchesSearch) return false;
        }

        // Child Filter (Safe For)
        if (selectedChildId) {
            if (!recipe.safeFor.some(c => c.id === selectedChildId)) return false;
        }

        // Scene Filter
        if (selectedScene) {
            if (!recipe.scenes || !recipe.scenes.includes(selectedScene)) return false;
        }

        return true;
    });
};
