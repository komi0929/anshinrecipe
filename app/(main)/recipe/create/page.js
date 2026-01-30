"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useRecipes } from "@/hooks/useRecipes";
import { useProfile } from "@/hooks/useProfile";

import { RecipeForm } from "@/components/RecipeForm";
import { CelebrationModal } from "@/components/CelebrationModal";
import CoachMark from "@/components/CoachMark";

const AddRecipeContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRecipe } = useRecipes();
  const { user, profile, loading: profileLoading } = useProfile();
  const [initialData, setInitialData] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isMounted && !profileLoading && !user) {
      router.push("/login");
    }
  }, [user, profileLoading, router, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parse Share Target Params
  useEffect(() => {
    if (!isMounted) return;

    // Guard for window.location in static export
    if (typeof window === "undefined") return;

    const title = searchParams.get("title");
    const text = searchParams.get("text");
    const url = searchParams.get("url");

    if (title || text || url) {
      let extractedUrl = url || "";
      let extractedMemo = text || "";

      if (!extractedUrl && text) {
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          extractedUrl = urlMatch[0];
          extractedMemo = text.replace(extractedUrl, "").trim();
        }
      }

      setInitialData({
        title: title || "",
        sourceUrl: extractedUrl,
        memo: extractedMemo,
      });
    }
  }, [searchParams, isMounted]);

  const handleCreateRecipe = async (formData) => {
    try {
      await addRecipe(formData, user, profile);

      const currentRecipeCount = (profile?.stats?.recipeCount || 0) + 1;
      const isFirstPost = currentRecipeCount === 1;

      const matchingChild = profile?.children?.find((child) => {
        if (!child.allergens || child.allergens.length === 0) return true;
        const recipeAllergens = formData.freeFromAllergens || [];
        return child.allergens.every((a) => recipeAllergens.includes(a));
      });

      setCelebrationData({
        isFirstPost,
        recipeCount: currentRecipeCount,
        recipeName: formData.title || "",
        childName: matchingChild?.name || "",
      });
      setShowCelebration(true);
    } catch (error) {
      console.error("Failed to add recipe", error);
      alert("レシピの保存に失敗しました");
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    router.push("/?tab=mine");
  };

  if (profileLoading) {
    return null;
  }
  if (!user) return null;

  if (!profile?.id) {
    return null;
  }

  const hasNoChildren = !profile?.children || profile.children.length === 0;

  return (
    <div className="container add-recipe-page relative">
      <CelebrationModal
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        isFirstPost={celebrationData.isFirstPost}
        recipeCount={celebrationData.recipeCount}
        recipeName={celebrationData.recipeName}
        childName={celebrationData.childName}
      />

      <div className="page-header">
        <h1 className="page-title">レシピを追加</h1>
      </div>

      {hasNoChildren ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {/* ... simplified for debugging ... */}
          <div>No Children</div>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl mx-auto">
            <RecipeForm
              initialData={initialData}
              onSubmit={handleCreateRecipe}
              user={user}
              profile={profile}
            />
          </div>

          <CoachMark
            targetId="recipe-form-url-input"
            message="便利な機能✨ URLを入力するとレシピ情報を自動で読み込みます！"
            position="bottom"
            uniqueKey="recipe_url_guide"
            delay={1000}
          />
        </>
      )}
    </div>
  );
};

const AddRecipePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddRecipeContent />
    </Suspense>
  );
};

export default AddRecipePage;
