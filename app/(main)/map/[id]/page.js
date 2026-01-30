"use client";

import { Clock, ArrowLeft, MapPin, Phone, Globe, Instagram, Flag, Users, ShieldCheck, BadgeCheck, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useMapData } from "@/hooks/useMapData";

import "./RestaurantDetailPage.css";

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { restaurants, loading } = useMapData();
  const [restaurant, setRestaurant] = useState(null);
  const [customMenus, setCustomMenus] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [menuToReport, setMenuToReport] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch Restaurant
  useEffect(() => {
    if (!loading && restaurants.length > 0) {
      const found = restaurants.find(
        (r) => r.id === params.id || r.place_id === params.id,
      );
      if (found) setRestaurant(found);
    }
  }, [params.id, restaurants, loading]);

  // Fetch Custom Menus (User-submitted)
  useEffect(() => {
    const fetchCustomMenus = async () => {
      if (!restaurant?.id) return;
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("review_type", "menu_post")
        .eq("is_own_menu", true);
      if (data) {
        const formattedMenus = data.map((review) => ({
          id: `custom-${review.id}`,
          name: review.custom_menu_name,
          price: review.price_paid,
          description: review.content,
          image_url: review.images?.[0] || null,
          allergens_contained: ["wheat", "egg", "milk", "nut"].filter(
            (a) => !(review.allergens_safe || []).includes(a),
          ),
          allergens_removable: [],
          tags: !(review.allergens_safe || []).length ? [] : ["8_major_free"],
          is_user_submitted: true,
          created_at: review.created_at,
        }));
        setCustomMenus(formattedMenus);
      }
    };
    fetchCustomMenus();
  }, [restaurant]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin text-orange-400 font-bold text-2xl">
          Loading...
        </div>
      </div>
    );
  if (!restaurant)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400 font-bold">
        店舗が見つかりません
      </div>
    );

  // Collect all images for carousel
  const allImages = [];
  const classifiedImages = restaurant.classified_images || {};

  // Priority order: food > interior > exterior > other
  if (classifiedImages.food) allImages.push(...classifiedImages.food);
  if (classifiedImages.interior) allImages.push(...classifiedImages.interior);
  if (classifiedImages.exterior) allImages.push(...classifiedImages.exterior);
  if (classifiedImages.other) allImages.push(...classifiedImages.other);

  // Fallback to legacy images
  if (allImages.length === 0) {
    if (restaurant.image_url) allImages.push({ url: restaurant.image_url });
    if (restaurant.menus?.[0]?.image_url)
      allImages.push({ url: restaurant.menus[0].image_url });
  }

  const displayMenus = [...(restaurant.menus || []), ...customMenus];
  const isVerified = restaurant.is_owner_verified;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(allImages.length, 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % Math.max(allImages.length, 1),
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* IMAGE CAROUSEL HERO */}
      <div className="relative h-80 w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />

        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex]?.url}
              alt={allImages[currentImageIndex]?.alt || "店舗画像"}
              className="w-full h-full object-cover animate-in fade-in duration-500"
            />

            {/* Image Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {allImages.slice(0, 8).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                      }`}
                    />
                  ))}
                  {allImages.length > 8 && (
                    <span className="text-white/70 text-xs ml-1">
                      +{allImages.length - 8}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <div className="text-center text-white/40">
              <Globe size={48} className="mx-auto mb-2" />
              <p className="text-sm">画像なし</p>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center z-20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <ShareButton
              title={restaurant.name}
              text={`${restaurant.name}のアレルギー対応情報をチェック！`}
              variant="icon"
            />
            <div className="shadow-lg rounded-full overflow-hidden">
              <BookmarkButton restaurantId={restaurant.id} />
            </div>
          </div>
        </div>

        {/* Verified Badge (if owner verified) */}
        {isVerified && (
          <div className="absolute bottom-20 left-6 z-20 bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <BadgeCheck size={16} />
            <span className="text-xs font-bold">公認店舗</span>
          </div>
        )}

        {/* Image Category Labels */}
        <div className="absolute bottom-20 right-6 z-20 flex gap-2">
          {classifiedImages.exterior?.length > 0 && (
            <span className="bg-white/80 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full">
              外観 {classifiedImages.exterior.length}枚
            </span>
          )}
          {classifiedImages.food?.length > 0 && (
            <span className="bg-orange-100/90 backdrop-blur-sm text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
              料理 {classifiedImages.food.length}枚
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="relative z-20 -mt-8 bg-white rounded-t-[40px] px-6 py-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] min-h-[500px]">
        {/* Title & Tags */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
              {restaurant.tags?.[0] || "飲食店"}
            </span>
            {restaurant.features?.wheelchair_accessible === "◯" && (
              <span className="text-[10px] font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full">
                バリアフリー
              </span>
            )}
            {isVerified && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1">
                <BadgeCheck size={10} /> オーナー公認
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {restaurant.name}
          </h1>
          <a
            href={`https://maps.google.com/?q=${restaurant.name}`}
            target="_blank"
            className="flex items-start gap-1.5 text-slate-500 hover:text-orange-500 transition-colors group"
          >
            <MapPin
              size={16}
              className="mt-0.5 text-slate-400 group-hover:text-orange-500 shrink-0"
            />
            <span className="text-xs font-bold leading-relaxed">
              {restaurant.address}
            </span>
          </a>
        </div>

        {/* OVERVIEW SECTION (NEW) */}
        {restaurant.overview && (
          <div className="mb-8 p-5 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-3xl border border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed">
              {restaurant.overview}
            </p>
          </div>
        )}

        {/* Contact Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 text-sm hover:bg-slate-100 transition-colors"
            >
              <Phone size={16} /> 電話する
            </a>
          )}
          {(restaurant.instagram_url || restaurant.features?.instagram_url) && (
            <a
              href={
                restaurant.instagram_url || restaurant.features?.instagram_url
              }
              target="_blank"
              className="flex items-center justify-center gap-2 py-3 bg-pink-50 border border-pink-100 rounded-2xl font-bold text-pink-600 text-sm hover:bg-pink-100 transition-colors"
            >
              <Instagram size={16} /> インスタ
            </a>
          )}
          {restaurant.website_url && (
            <a
              href={restaurant.website_url}
              target="_blank"
              className="flex items-center justify-center gap-2 py-3 bg-blue-50 border border-blue-100 rounded-2xl font-bold text-blue-600 text-sm hover:bg-blue-100 transition-colors"
            >
              <Globe size={16} /> Web
            </a>
          )}
          {/* 営業時間 - 実データ表示 */}
          {restaurant.features?.opening_hours?.weekdayDescriptions ? (
            <div className="flex flex-col items-center justify-center gap-1 py-3 bg-green-50 border border-green-100 rounded-2xl text-sm">
              <div className="flex items-center gap-1 font-bold text-green-700">
                <Clock size={14} />
                <span>今日</span>
              </div>
              <span className="text-green-800 font-bold text-xs">
                {/* 曜日に応じて今日の営業時間を取得 */}
                {restaurant.features.opening_hours.weekdayDescriptions[
                  new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
                ]?.replace(/^[月火水木金土日].*?:/, "") || "確認中"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-400 text-sm">
              <Clock size={16} /> 営業時間
            </div>
          )}
        </div>

        {/* TAKEOUT / ONLINE SHOP SECTION (NEW) */}
        <div className="mb-8 p-5 bg-amber-50/50 rounded-3xl border border-amber-100">
          <h3 className="font-bold text-sm text-amber-800 flex items-center gap-2 mb-3">
            <ShoppingBag size={16} /> お取り寄せ・通販
          </h3>
          {restaurant.takeout_url ? (
            <a
              href={restaurant.takeout_url}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
            >
              <ShoppingBag size={14} /> 通販サイトへ
            </a>
          ) : !isVerified ? (
            <div className="text-xs text-amber-600/70">
              <p className="mb-2">まだ登録されていません</p>
              <InviteOwnerButton
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                variant="text"
              />
            </div>
          ) : (
            <p className="text-xs text-amber-600/70">オーナー情報待ち</p>
          )}
        </div>

        {/* MENU SECTION - Now UGC Focused */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="text-xl">🍽️</span> 食べられるもの
            </h2>
            {displayMenus.length > 0 && (
              <button
                onClick={() => setActiveTab("menu")}
                className="text-xs font-bold text-orange-500"
              >
                もっと見る
              </button>
            )}
          </div>

          {displayMenus.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
              {displayMenus.slice(0, 5).map((menu, i) => (
                <div
                  key={i}
                  className="snap-center shrink-0 w-36 group cursor-pointer"
                  onClick={() => setActiveTab("menu")}
                >
                  <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-2 relative border border-slate-100">
                    {menu.image_url ? (
                      <img
                        src={menu.image_url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍳
                      </div>
                    )}
                    {menu.is_user_submitted && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        投稿
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-relaxed mb-0.5">
                    {menu.name}
                  </div>
                  {menu.price > 0 && (
                    <div className="font-bold text-[10px] text-slate-400">
                      ¥{menu.price?.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Users size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-bold mb-2">
                メニュー情報はまだありません
              </p>
              <p className="text-xs text-slate-400 mb-4">
                ユーザーまたは店舗オーナーが追加できます
              </p>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} /> メニューを追加
              </button>
            </div>
          )}
        </div>

        {/* INFO SECTIONS: List Style for Readability */}
        <div className="space-y-6 mb-10">
          <FeatureList
            title="アレルギー対応"
            icon={<ShieldCheck size={18} className="text-orange-500" />}
            color="orange"
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            isVerified={isVerified}
            items={[
              {
                label: "メニュー表記",
                value: restaurant.features?.allergen_label,
              },
              {
                label: "コンタミ対応",
                value: restaurant.features?.contamination,
              },
              { label: "除去食対応", value: restaurant.features?.removal },
              { label: "アレルギー表", value: restaurant.features?.chart },
            ]}
          />
          <FeatureList
            title="キッズ対応"
            icon={<span className="text-lg">👶</span>}
            color="blue"
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            isVerified={isVerified}
            items={[
              { label: "キッズチェア", value: restaurant.features?.kids_chair },
              { label: "ベビーカー入店", value: restaurant.features?.stroller },
              { label: "おむつ交換台", value: restaurant.features?.diaper },
              { label: "離乳食持込", value: restaurant.features?.baby_food },
            ]}
          />
        </div>

        {/* TABS & CONTENT */}
        <div className="sticky top-0 bg-white z-30 pt-2 pb-0 mb-4 border-b border-slate-100">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {["overview", "menu", "reviews", "gallery"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? "border-slate-900 text-slate-900 scale-105" : "border-transparent text-slate-400"}`}
              >
                {tab === "overview" && "概要"}
                {tab === "menu" && "メニュー詳細"}
                {tab === "reviews" && "口コミ・記録"}
                {tab === "gallery" && "写真"}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              {restaurant.overview ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    {restaurant.overview}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">
                    概要情報はまだありません
                  </p>
                </div>
              )}

              {/* Quick Feature Grid */}
              <div className="grid grid-cols-2 gap-3">
                <FeatureCard
                  icon="🅿️"
                  label="駐車場"
                  value={restaurant.features?.parking}
                />
                <FeatureCard
                  icon="♿"
                  label="車椅子"
                  value={restaurant.features?.wheelchair_accessible}
                />
                <FeatureCard
                  icon="🚼"
                  label="キッズ"
                  value={restaurant.features?.kids_friendly}
                />
                <FeatureCard
                  icon="🍽️"
                  label="アレルギー対応"
                  value={restaurant.features?.allergen_label}
                />
              </div>

              {/* 4大アレルゲン対応状況 */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <span>🛡️</span> 4大アレルゲン対応
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <FeatureCard
                    icon="🌾"
                    label="小麦不使用"
                    value={restaurant.features?.gluten_free}
                  />
                  <FeatureCard
                    icon="🥚"
                    label="卵不使用"
                    value={restaurant.features?.egg_free}
                  />
                  <FeatureCard
                    icon="🥛"
                    label="乳不使用"
                    value={restaurant.features?.dairy_free}
                  />
                  <FeatureCard
                    icon="🥜"
                    label="ナッツ不使用"
                    value={restaurant.features?.nut_free}
                  />
                </div>
                {/* 信頼性表示 */}
                <div className="mt-3 text-center">
                  {isVerified ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      ✓ この情報は店舗が確認済みです
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                      ⚠ システムが自動検出した情報です。店舗にご確認ください。
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "menu" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <MenuList menus={displayMenus} onReportMenu={setMenuToReport} />
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <ReviewList restaurantId={restaurant.id} />

              {/* コメントセクション（92件改善 Phase3.2）*/}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  💬 コメント
                </h3>
                <CommentSection reviewId={restaurant.id} />
              </div>
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <MenuGallery
                restaurantId={restaurant.id}
                images={allImages.map((img) => img.url)}
              />
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="bg-orange-600 text-white rounded-full p-4 shadow-xl shadow-orange-300 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 font-bold pr-6"
        >
          <Plus strokeWidth={3} size={24} />{" "}
          <span className="text-sm">投稿</span>
        </button>
      </div>

      {/* Owner Request Button */}
      {!isVerified && (
        <div className="fixed bottom-8 left-6 z-30">
          <InviteOwnerButton
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            variant="default"
          />
        </div>
      )}

      {/* Report Button */}
      <div className="fixed bottom-8 right-6 z-30 opacity-50 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-400"
        >
          <Flag size={12} /> 問題を報告
        </button>
      </div>

      {/* MODALS */}
      <ReviewModal
        restaurantId={restaurant.id}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
      <ReportModal
        type="shop"
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      {menuToReport && (
        <ReportModal
          type="menu"
          restaurantId={restaurant.id}
          menuId={menuToReport.id}
          restaurantName={restaurant.name}
          menuName={menuToReport.name}
          isOpen={!!menuToReport}
          onClose={() => setMenuToReport(null)}
        />
      )}
    </div>
  );
}

// Compact Feature List Component with explicit "Request" UI
const FeatureList = ({
  title,
  icon,
  color,
  items,
  restaurantId,
  restaurantName,
  isVerified,
}) => {
  const colors = {
    orange: "bg-orange-50 border-orange-100 text-orange-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
  };
  const activeText = {
    orange: "text-orange-600",
    blue: "text-blue-600",
  };

  const hasAnyValue = items.some(
    (item) => item.value === "◯" || item.value === true || item.value === "△",
  );

  return (
    <div
      className={`rounded-3xl border p-6 transition-all ${colors[color] || colors.orange}`}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-lg flex items-center gap-2">
          {icon} {title}
        </h3>
        {/* Verification Badge within Card */}
        {isVerified && (
          <span className="bg-white/80 px-2 py-1 rounded-md text-[10px] font-bold border border-black/5">
            店舗確認済
          </span>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, i) => {
          // Check if value exists and is truthy
          const hasValue =
            item.value !== undefined &&
            item.value !== null &&
            item.value !== "" &&
            item.value !== false;
          const isExplicitConfirm = item.value === "◯" || item.value === true;
          const isPartial = item.value === "△";
          const isTextValue =
            typeof item.value === "string" &&
            item.value !== "◯" &&
            item.value !== "△" &&
            item.value.length > 0;

          return (
            <div
              key={i}
              className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0"
            >
              <span className="font-bold text-sm opacity-80">{item.label}</span>
              <div className="flex items-center gap-2">
                {isExplicitConfirm || isTextValue ? (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <CheckCircle
                      size={16}
                      className={activeText[color] || activeText.orange}
                      strokeWidth={3}
                    />
                    <span
                      className={`text-sm font-black ${activeText[color] || activeText.orange}`}
                    >
                      {isTextValue ? item.value : "対応"}
                    </span>
                  </div>
                ) : isPartial ? (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-amber-100">
                    <HelpCircle size={16} className="text-amber-500" />
                    <span className="text-sm font-bold text-amber-500">
                      要確認
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold opacity-30 bg-black/5 px-3 py-1.5 rounded-full">
                    情報なし
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicit Request UI if no data */}
      {!hasAnyValue && !isVerified && restaurantId && (
        <div className="mt-5 pt-4 border-t border-black/5 text-center">
          <p className="text-xs font-bold opacity-60 mb-3">
            詳細情報が登録されていません
          </p>
          <InviteOwnerButton
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            variant="default" // Use primary style for emphasis
            label="オーナーに情報の掲載をリクエストする"
          />
        </div>
      )}
    </div>
  );
};

// Quick Feature Card for Overview
const FeatureCard = ({ icon, label, value }) => {
  const isAvailable = value === "◯" || value === true || value === "△";

  return (
    <div
      className={`p-4 rounded-2xl border ${isAvailable ? "bg-green-50 border-green-100" : "bg-slate-50 border-slate-100"}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div
        className={`text-xs font-bold mt-1 ${isAvailable ? "text-green-600" : "text-slate-300"}`}
      >
        {isAvailable ? (value === "△" ? "要確認" : "対応") : "未確認"}
      </div>
    </div>
  );
};

