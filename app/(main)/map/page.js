"use client";

import { useState, useMemo, useEffect, Suspense, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Check,
  Search,
  BadgeCheck,
  List,
  Map as MapIcon,
} from "lucide-react";

import { useMapData } from "@/hooks/useMapData";
import { useProfile } from "@/hooks/useProfile";
import { MapContainer } from "@/components/map/MapContainer";
import { LoginBenefitCard } from "@/components/map/LoginBenefitCard";
import { ReviewModal } from "@/components/map/ReviewModal";
import { RequestCollectionModal } from "@/components/map/RequestCollectionModal";

// Custom Components
import "./MapPage.css";

// Wrapper for MapContainer to pass restaurants from hook
const MapContainerWrapper = ({ restaurants }) => {
  return <MapContainer restaurants={restaurants} />;
};

// Simple Modal for Selecting a Restaurant
const SelectRestaurantModal = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const { restaurants } = useMapData({ searchQuery: query });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">お店を選択</h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
          >
            <Check size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="店名で検索..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 outline-none font-bold text-slate-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="w-full text-left p-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                {r.menus?.[0]?.image_url ? (
                  <img
                    src={r.menus[0].image_url}
                    className="w-full h-full object-cover"
                    alt={r.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    🍳
                  </div>
                )}
              </div>
              <div>
                <div className="font-bold text-slate-700 group-hover:text-orange-700">
                  {r.name}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {r.address}
                </div>
              </div>
            </button>
          ))}
          {restaurants.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              お店が見つかりませんか？
              <br />
              <span className="text-xs opacity-70">
                ※現在地周辺の登録店舗のみ表示されます
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main content component that uses useSearchParams
function MapPageContent() {
  const { user, profile } = useProfile();
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [hasAutoSet, setHasAutoSet] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Review Post Flow States
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reviewTargetRestaurant, setReviewTargetRestaurant] = useState(null);

  // Check for ?action=post
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "post") {
      setIsSelectModalOpen(true);
    }
  }, [searchParams]);

  const handleRestaurantSelect = (restaurant) => {
    setReviewTargetRestaurant(restaurant);
    setIsSelectModalOpen(false);
    setIsReviewModalOpen(true);
  };

  const handleReviewClose = () => {
    setIsReviewModalOpen(false);
    setReviewTargetRestaurant(null);
    // Clear param
    router.replace("/map", { scroll: false });
  };

  // Auto-set filters from profile
  useEffect(() => {
    if (!profile?.children || hasAutoSet) return;

    const childAllergens = new Set();
    profile.children.forEach((c) =>
      c.allergens?.forEach((a) => childAllergens.add(a)),
    );

    if (childAllergens.size === 0) return;

    const newSelection = [];
    if (childAllergens.has("小麦")) newSelection.push("wheat");
    if (childAllergens.has("卵")) newSelection.push("egg");
    if (childAllergens.has("乳")) newSelection.push("milk");
    // Removed specific logic for Soba, Shrimp, Crab as requested
    // if (childAllergens.has('そば')) newSelection.push('soba');
    // if (childAllergens.has('えび')) newSelection.push('shrimp');
    // if (childAllergens.has('かに')) newSelection.push('crab');

    const nutAllergens = [
      "落花生",
      "くるみ",
      "アーモンド",
      "カシューナッツ",
      "マカダミアナッツ",
      "ナッツ",
    ];
    if (nutAllergens.some((n) => childAllergens.has(n)))
      newSelection.push("nut");

    if (newSelection.length > 0) {
      setSelectedAllergens(newSelection);
    }
    setHasAutoSet(true);
  }, [profile, hasAutoSet]);

  // Use the hook with filters
  const { restaurants: rawRestaurants, loading } = useMapData({
    searchQuery,
    allergens: selectedAllergens,
  });

  // Sort restaurants: verified first, then by name
  const restaurants = useMemo(() => {
    return [...rawRestaurants].sort((a, b) => {
      // Verified restaurants first
      if (a.is_owner_verified && !b.is_owner_verified) return -1;
      if (!a.is_owner_verified && b.is_owner_verified) return 1;
      // Then by name
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [rawRestaurants]);

  const toggleAllergen = (allergen) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen],
    );
  };

  const ALLERGENS = [
    { label: "小麦", value: "wheat", icon: "🌾" },
    { label: "卵", value: "egg", icon: "🥚" },
    { label: "乳", value: "milk", icon: "🥛" },
    { label: "ナッツ", value: "nut", icon: "🥜" },
    // Removed: Soba, Shrimp, Crab
  ];

  const AllergenChip = ({ label, value, icon }) => (
    <button
      onClick={() => toggleAllergen(value)}
      className={`map-filter-chip ${selectedAllergens.includes(value) ? "active" : ""}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-bold text-sm text-gray-700">{label}なし</span>
      {selectedAllergens.includes(value) && (
        <Check size={14} className="ml-1 text-orange-500" strokeWidth={3} />
      )}
    </button>
  );

  const ListCard = ({ restaurant }) => (
    <div
      onClick={() =>
        router.push(`/map/${restaurant.id || restaurant.place_id}`)
      }
      className={`map-list-card ${restaurant.is_owner_verified ? "verified" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${restaurant.name}の詳細を見る`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/map/${restaurant.id || restaurant.place_id}`);
        }
      }}
    >
      <div className="card-image-container">
        {/* Use first menu image if available, else placeholder */}
        {restaurant.menus?.[0]?.image_url ? (
          <img
            src={restaurant.menus[0].image_url}
            className="card-image"
            alt={restaurant.name}
            loading="lazy"
          />
        ) : restaurant.classified_images?.food?.[0]?.url ? (
          <img
            src={restaurant.classified_images.food[0].url}
            className="card-image"
            alt={restaurant.name}
            loading="lazy"
          />
        ) : (
          <div className="card-image-placeholder">🍳</div>
        )}
        {restaurant.is_owner_verified && (
          <span className="verified-badge">
            <BadgeCheck size={12} /> 公認
          </span>
        )}
        {restaurant.menus?.length > 0 && (
          <span className="menu-count-badge">{restaurant.menus.length}品</span>
        )}
      </div>
      <div className="card-content">
        <div className="flex justify-between items-start">
          <h3 className="card-title flex items-center gap-1">
            {restaurant.name}
            {restaurant.is_owner_verified && (
              <BadgeCheck size={14} className="text-blue-500 shrink-0" />
            )}
          </h3>
          {/* Show review count if available, otherwise hide */}
          {restaurant.review_count > 0 && (
            <span className="card-rating">💬 {restaurant.review_count}</span>
          )}
        </div>
        <p className="card-address">{restaurant.address}</p>

        {/* Show overview if available, else menu highlight */}
        {restaurant.overview ? (
          <p className="card-overview text-xs text-slate-500 line-clamp-2 mt-1">
            {restaurant.overview}
          </p>
        ) : (
          <div className="card-menu-highlight">
            <span className="highlight-label">おすすめ:</span>
            {restaurant.menus?.slice(0, 1).map((m, i) => (
              <span key={i} className="menu-name">
                {m.name}
              </span>
            ))}
            {restaurant.menus?.length > 1 && (
              <span className="more-count">+{restaurant.menus.length - 1}</span>
            )}
          </div>
        )}

        {/* === P0 UX FIX: アレルゲン対応バッジ === */}
        {/* 親が一目で「この店は卵NGかOKか」わかるように */}
        <div className="flex flex-wrap gap-1 mt-2">
          {restaurant.features?.gluten_free === "◯" && (
            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              🌾 小麦OK
            </span>
          )}
          {restaurant.features?.egg_free === "◯" && (
            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              🥚 卵OK
            </span>
          )}
          {restaurant.features?.dairy_free === "◯" && (
            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              🥛 乳OK
            </span>
          )}
          {restaurant.features?.nut_free === "◯" && (
            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              🥜 ナッツOK
            </span>
          )}
          {/* 信頼性ラベル */}
          {restaurant.is_verified && (
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              ✓ 店舗確認済
            </span>
          )}
          {!restaurant.is_verified &&
            (restaurant.features?.gluten_free ||
              restaurant.features?.egg_free ||
              restaurant.features?.dairy_free ||
              restaurant.features?.nut_free) && (
              <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                ⚠ 自動検出
              </span>
            )}
        </div>

        <div className="card-tags">
          {restaurant.tags?.slice(0, 3).map((t) => (
            <span key={t} className="tag-chip">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="map-page-container">
      {/* Search Bar - Floating */}
      <div className="map-search-bar-container">
        <div className="map-search-bar">
          <Search className="map-search-icon" size={20} aria-hidden="true" />
          <input
            type="text"
            placeholder="エリア、店名、メニューで検索..."
            className="map-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="店舗検索"
          />
        </div>
        {/* Quick Filters */}
        <div
          className="map-quick-filters"
          role="group"
          aria-label="アレルゲンフィルター"
        >
          {ALLERGENS.map((a) => (
            <AllergenChip key={a.value} {...a} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="map-content">
        {/* Map View - Visible on Mobile if mode=map, Always on Desktop */}
        <div
          className={`map-view-container ${viewMode === "list" ? "hidden-mobile" : ""}`}
        >
          <MapContainerWrapper restaurants={restaurants} />
        </div>

        {/* List View - Visible on Mobile if mode=list, Always on Desktop */}
        <div
          className={`map-list-view ${viewMode === "map" ? "hidden-mobile" : ""}`}
        >
          <div className="list-content-padding">
            {loading ? (
              <div className="loading-skeleton">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image" />
                    <div className="skeleton-content">
                      <div className="skeleton-title" />
                      <div className="skeleton-text" />
                      <div className="skeleton-tags">
                        <div className="skeleton-tag" />
                        <div className="skeleton-tag" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="empty-state">
                <div className="text-4xl mb-4">😢</div>
                <p>条件に合うお店が見つかりませんでした</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedAllergens([]);
                  }}
                  className="reset-btn"
                >
                  条件をリセット
                </button>
                <div className="mt-8 pt-6 border-t border-slate-100 w-full">
                  <p className="text-xs text-slate-400 mb-2">
                    知っているお店が見つかりませんか？
                  </p>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="text-orange-500 text-sm font-bold underline hover:text-orange-600"
                  >
                    お店の調査をリクエストする
                  </button>
                </div>
              </div>
            ) : (
              <>
                {restaurants.map((r, index) => (
                  <Fragment key={r.id || r.place_id}>
                    <ListCard restaurant={r} />
                    {/* Show Login Benefit after 3rd item if not logged in */}
                    {!user && index === 2 && <LoginBenefitCard />}
                  </Fragment>
                ))}
                {/* Also show at bottom if few items and have not shown it yet (e.g. less than 3 items) */}
                {!user && restaurants.length < 3 && <LoginBenefitCard />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toggle (Mobile Only) */}
      <button
        className="map-view-toggle-btn mobile-only"
        onClick={() => setViewMode((prev) => (prev === "map" ? "list" : "map"))}
        aria-label={viewMode === "map" ? "リスト表示に切替" : "地図表示に切替"}
      >
        {viewMode === "map" ? (
          <>
            <List size={20} strokeWidth={2.5} aria-hidden="true" />
            <span>リスト</span>
          </>
        ) : (
          <>
            <MapIcon size={20} strokeWidth={2.5} aria-hidden="true" />
            <span>地図</span>
          </>
        )}
      </button>

      {/* Modals for Review Flow */}
      <SelectRestaurantModal
        isOpen={isSelectModalOpen}
        onClose={() => {
          setIsSelectModalOpen(false);
          router.replace("/map", { scroll: false });
        }}
        onSelect={handleRestaurantSelect}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        restaurantId={reviewTargetRestaurant?.id}
        onClose={handleReviewClose}
      />

      <RequestCollectionModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}

// Default export with Suspense boundary for useSearchParams
export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
