"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/Toast";
import { useAnalytics } from "@/hooks/useAnalytics";

import {
  getReactionCounts,
  getUserReaction,
  toggleReaction,
  getTriedReports,
  deleteTriedReport,
  getLikeCount,
  getBookmarkCount,
} from "@/lib/actions/socialActions";
import { getRecommendedRecipes } from "@/lib/recommendations";

import "./RecipeDetailPage.css";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { profile, user } = useProfile();
  const { addCookingLog, deleteCookingLog } = useRecipes();
  const {
    trackRecipeView,
    trackRecipeSave,
    trackRecipeLike,
    trackTriedReport,
  } = useAnalytics();
  const { addToast } = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({
    yummy: 0,
    helpful: 0,
    ate_it: 0,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [triedReports, setTriedReports] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);

        // OPTIMIZATION: Start ALL fetches in parallel for maximum speed
        const recipePromise = supabase
          .from("recipes")
          .select(
            `
                        *,
                        profiles:user_id (
                            id,
                            username,
                            display_name,
                            avatar_url,
                            picture_url,
                            is_pro
                        ),
                        cooking_logs (id, content, rating, created_at, user_id),
                        recipe_images (id, image_url)
                    `,
          )
          .eq("id", id)
          .single();

        // Start parallel fetches (don't await yet)
        const countsPromise = getReactionCounts(id);
        const reportsPromise = getTriedReports(id);
        const likesPromise = getLikeCount(id);
        const bookmarksPromise = getBookmarkCount(id);

        // User-specific fetches (only if logged in)
        const reactionPromise = user
          ? getUserReaction(id, user.id)
          : Promise.resolve(null);
        const savedPromise = user
          ? supabase
              .from("saved_recipes")
              .select("id")
              .eq("recipe_id", id)
              .eq("user_id", user.id)
              .single()
          : Promise.resolve({ data: null });

        // Wait for recipe first (needed for recommendations)
        const { data: recipeData, error } = await recipePromise;
        if (error) throw error;
        setRecipe(recipeData);

        // Start recommendations now that we have recipe data
        const recsPromise = getRecommendedRecipes(recipeData, 6, user?.id);

        // Await all other fetches in parallel
        const [counts, reports, likes, bookmarks, reaction, saved, recs] =
          await Promise.all([
            countsPromise,
            reportsPromise,
            likesPromise,
            bookmarksPromise,
            reactionPromise,
            savedPromise,
            recsPromise,
          ]);

        // Apply all results
        setReactionCounts(counts);
        setTriedReports(reports);
        setLikeCount(likes);
        setBookmarkCount(bookmarks);
        setUserReaction(reaction);
        setIsSaved(!!saved.data);
        setRecommendations(recs);

        // Track recipe view
        trackRecipeView(id);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        addToast("レシピの読み込みに失敗しました", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id, user, addToast, trackRecipeView]);

  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Wait for content to settle
    }
  }, [loading]);

  const handleReaction = async (reactionType) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const newReaction = await toggleReaction(id, reactionType, user.id);
      setUserReaction(newReaction);

      // Refresh counts
      const counts = await getReactionCounts(id);
      setReactionCounts(counts);
      // Also refresh like count for display
      const likes = await getLikeCount(id);
      setLikeCount(likes);

      // Track like action
      if (reactionType === "like" && newReaction !== null) {
        trackRecipeLike(id);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      addToast("エラーが発生しました", "error");
    }
  };

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("saved_recipes")
          .delete()
          .eq("recipe_id", id)
          .eq("user_id", user.id);
        setIsSaved(false);
        addToast("ブックマークを解除しました", "info");
      } else {
        await supabase
          .from("saved_recipes")
          .insert({ recipe_id: id, user_id: user.id });
        setIsSaved(true);
        addToast("レシピを保存しました", "success");
        // Track save action
        trackRecipeSave(id);
      }
      // Refresh bookmark count for display
      const bookmarks = await getBookmarkCount(id);
      setBookmarkCount(bookmarks);
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleAddLog = async (logData) => {
    if (!user || !recipe) return;
    try {
      await addCookingLog({
        ...logData,
        recipe_id: recipe.id,
        user_id: user.id,
      });
      // Refresh to show new memo
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await deleteCookingLog(logId);
      // Update local state to remove the deleted log
      setRecipe((prev) => ({
        ...prev,
        cooking_logs: prev.cooking_logs.filter((log) => log.id !== logId),
      }));
    } catch (error) {
      console.error(error);
    }
  };

  // Show skeleton while loading - prevents blank flash
  if (loading || !recipe) {
    return (
      <div className="container recipe-detail-page">
        <div className="detail-header">
          <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="recipe-hero">
          <div className="w-full aspect-video bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="recipe-info p-4 space-y-4">
          <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate Safety
  const safeFor =
    profile?.children?.filter((child) => {
      const recipeAllergens =
        recipe.freeFromAllergens || recipe.free_from_allergens || [];
      if (!child.allergens || child.allergens.length === 0) return true;
      if (!recipeAllergens || recipeAllergens.length === 0) return false;
      return child.allergens.every((allergen) =>
        recipeAllergens.includes(allergen),
      );
    }) || [];

  const _totalReactions = Object.values(reactionCounts).reduce(
    (a, b) => a + b,
    0,
  );

  const renderAllergenList = () => {
    const allergens =
      recipe.freeFromAllergens || recipe.free_from_allergens || [];

    // Default list of major allergens to check against if needed, or just display the ones we have
    // for this specific "free from" context, strictly showing what is FREE.

    if (allergens.length === 0) {
      return (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs font-bold">
            特定原材料情報は登録されていません
          </p>
        </div>
      );
    }

    return (
      <div className="allergen-grid">
        {allergens.map((allergen) => (
          <div key={allergen} className="allergen-grid-item">
            <div className="allergen-icon-check">
              <Check size={12} strokeWidth={4} />
            </div>
            <span className="allergen-icon-text">{allergen}なし</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper: Parse memo content for structured sections
  const parseRecipeContent = (memo) => {
    if (!memo) return { ingredients: null, steps: null, recommendation: null };

    const ingredientsMatch = memo.match(/【材料】([\s\S]*?)(?=【|$)/);
    const stepsMatch = memo.match(/【作り方】([\s\S]*?)(?=【|$)/);

    // Remove matched sections to get remaining content
    const remaining = memo
      .replace(/【材料】[\s\S]*?(?=【|$)/, "")
      .replace(/【作り方】[\s\S]*?(?=【|$)/, "")
      .trim();

    return {
      ingredients: ingredientsMatch ? ingredientsMatch[1].trim() : null,
      steps: stepsMatch ? stepsMatch[1].trim() : null,
      recommendation: remaining || null,
    };
  };

  // Parse the memo content
  const parsedContent = parseRecipeContent(recipe.memo || recipe.description);

  // Title truncation (50 chars max)
  const displayTitle =
    recipe.title && recipe.title.length > 50
      ? recipe.title.substring(0, 50) + "..."
      : recipe.title;

  const positiveIngredients =
    recipe.positiveIngredients || recipe.positive_ingredients || [];

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
        </div>
      </div>

      <div className="recipe-hero">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="hero-image"
          />
        ) : (
          <div className="hero-placeholder">
            <UtensilsCrossed size={48} />
            <span>画像が設定されていません</span>
          </div>
        )}
        {/* Only show child badges for own recipes */}
        {user?.id === recipe.user_id && safeFor.length > 0 && (
          <div className="hero-badges">
            {safeFor.map((child) => (
              <span key={child.id} className="safe-badge">
                {child.icon} {child.name}ちゃんOK
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="recipe-info">
        <h1 className="detail-title" title={recipe.title}>
          {recipe.title}
        </h1>

        <div className="recipe-meta">
          <div className="author-info">
            <ProAvatar
              src={recipe.profiles?.avatar_url || recipe.profiles?.picture_url}
              alt={
                recipe.profiles?.username ||
                recipe.profiles?.display_name ||
                "ユーザー"
              }
              isPro={recipe.profiles?.is_pro}
              userId={recipe.profiles?.id}
              size={32}
              showBadge={true}
              clickable={true}
            />
            <span className="author-name">
              {recipe.profiles?.username ||
                recipe.profiles?.display_name ||
                "ゲスト"}
              {recipe.profiles?.is_pro && (
                <span className="pro-author-badge">
                  <Star size={10} fill="currentColor" />
                  プロ
                </span>
              )}
            </span>
          </div>
          <div className="date-info">
            <Clock size={14} />
            {new Date(recipe.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Thanks Button - 感謝を送る */}
        <div className="thanks-section">
          <ThanksButton
            recipeId={id}
            authorId={recipe.user_id}
            currentUserId={user?.id}
            recipeName={recipe.title}
          />
        </div>

        {/* Heart Reaction moved to header */}

        {/* --- NEW: Smart Embed (YouTube/TikTok) --- */}
        {recipe.source_url && <SmartEmbed url={recipe.source_url} />}
        {/* ----------------------------------------- */}

        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link-btn"
          >
            レシピを見る <ExternalLink size={16} />
          </a>
        )}

        {/* Add to Collection Button */}
        {user && (
          <div className="collection-action-section">
            <AddToCollectionButton recipeId={id} recipeName={recipe.title} />
          </div>
        )}

        <div className="detail-section">
          <div className="allergen-labels mt-4">
            <h3 className="section-title">レシピに含まれない食材</h3>
            {renderAllergenList()}
          </div>
        </div>

        {positiveIngredients.length > 0 && (
          <div className="detail-section">
            <h3>使用している食材</h3>
            <div className="ingredient-tags">
              {positiveIngredients.map((ingredient) => (
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

        {/* Ingredients Section (Parsed from memo) */}
        {parsedContent.ingredients && (
          <div className="detail-section">
            <h3>材料</h3>
            <div className="recipe-description whitespace-pre-line">
              {parsedContent.ingredients}
            </div>
          </div>
        )}

        {/* Steps Section (Parsed from memo) */}
        {parsedContent.steps && (
          <div className="detail-section">
            <h3>作り方</h3>
            <div className="recipe-description whitespace-pre-line">
              {parsedContent.steps}
            </div>
          </div>
        )}

        {/* Recommendation Points Section */}
        <div className="detail-section">
          <h3>おすすめポイント</h3>
          {parsedContent.recommendation ? (
            <>
              <p className="recipe-description whitespace-pre-line">
                {parsedContent.recommendation}
              </p>
              {recipe.recipe_images && recipe.recipe_images.length > 0 && (
                <div className="recipe-additional-images">
                  {recipe.recipe_images.map((img) => (
                    <div key={img.id} className="additional-image-wrapper">
                      <img
                        src={img.image_url}
                        alt="追加画像"
                        className="additional-image"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-recommendation-points">
              <p className="text-muted">
                まだおすすめポイントが設定されていません
              </p>
              {user && recipe.user_id === user.id && (
                <a href={`/recipe/${id}/edit`} className="add-points-btn">
                  ✨ ポイントを追加する
                </a>
              )}
            </div>
          )}
        </div>

        {/* Scenes Section */}
        {recipe.scenes && recipe.scenes.length > 0 && (
          <div className="detail-section">
            <h3>おすすめシーン</h3>
            <div className="scenes-list">
              {recipe.scenes.map((scene) => (
                <span key={scene} className="scene-chip">
                  {scene}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="detail-section">
            <h3>タグ</h3>
            <div className="tags-list">
              {recipe.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tried Reports Section */}
        <div
          className="detail-section tried-reports-section"
          id="tried-reports"
        >
          <div className="section-header-with-action">
            <h3>つくってみたレポート ({triedReports.length})</h3>
            {user && (
              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="add-report-btn"
              >
                <MessageCircle size={18} />
                <span>{showReportForm ? "キャンセル" : "投稿する"}</span>
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
              triedReports.map((report) => (
                <TriedReportCard
                  key={report.id}
                  report={report}
                  currentUserId={user?.id}
                  onDelete={async (reportId) => {
                    try {
                      await deleteTriedReport(reportId, user.id);
                      setTriedReports(
                        triedReports.filter((r) => r.id !== reportId),
                      );
                      addToast("レポートを削除しました", "info");
                    } catch (error) {
                      addToast("削除に失敗しました", "error");
                    }
                  }}
                />
              ))
            ) : (
              <div className="empty-state-with-cta">
                <p>まだレポートはありません</p>
                {user && (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="cta-first-report"
                  >
                    🍳 最初のレポートを投稿してみませんか？
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- My Kitchen Lab (Cooking Log) --- */}
        {user && (
          <CookingLog
            logs={recipe.cooking_logs || []}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            currentUserId={user.id}
          />
        )}
        {/* -------------------------------------------------- */}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="detail-section recommendations-section">
            <h3>こちらもおすすめ</h3>
            <div className="recommendations-grid">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/recipe/${rec.id}`}
                  className="recommendation-card"
                >
                  <img src={rec.image_url} alt={rec.title} />
                  <p className="rec-title">{rec.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <ReportButton recipeId={id} userId={user?.id} />
      </div>

      {/* Floating Action Bar */}
      <div className="floating-action-bar">
        <button
          onClick={() => handleReaction("like")}
          className={`fab-btn ${userReaction === "like" ? "active" : ""}`}
        >
          <Heart
            size={20}
            fill={userReaction === "like" ? "currentColor" : "none"}
          />
          <span className="fab-label">いいね！</span>
          <span className="fab-count">{likeCount}</span>
        </button>
        <button
          onClick={handleSave}
          className={`fab-btn ${isSaved ? "active" : ""}`}
        >
          <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          <span className="fab-label">保存</span>
          <span className="fab-count">{bookmarkCount}</span>
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
                console.log("Share skipped", err);
              }
            } else {
              try {
                await navigator.clipboard.writeText(
                  `${shareData.text} ${shareData.url}`,
                );
                addToast("リンクをコピーしました", "success");
              } catch (err) {
                window.open(
                  `https://line.me/R/msg/text/?${encodeURIComponent(shareData.text + " " + shareData.url)}`,
                  "_blank",
                );
              }
            }
          }}
          className="fab-btn"
        >
          <Share2 size={20} />
          <span className="fab-label">シェア</span>
        </button>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
