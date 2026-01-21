"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useMapData } from "@/hooks/useMapData";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Star,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Instagram,
  ShieldCheck,
  Plus,
  Flag,
  Share2,
  Clock,
} from "lucide-react";
import { MenuList } from "@/components/map/MenuList";
import { ReviewModal } from "@/components/map/ReviewModal";
import { ReportModal } from "@/components/map/ReportModal";
import { ReviewList } from "@/components/map/ReviewList";
import { MenuGallery } from "@/components/map/MenuGallery";
import { BookmarkButton } from "@/components/social/BookmarkButton";
import "./RestaurantDetailPage.css";

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { restaurants, loading } = useMapData();
  const [restaurant, setRestaurant] = useState(null);
  const [customMenus, setCustomMenus] = useState([]);
  const [activeTab, setActiveTab] = useState("menu");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [menuToReport, setMenuToReport] = useState(null);

  // Fetch Restaurant
  useEffect(() => {
    if (!loading && restaurants.length > 0) {
      const found = restaurants.find(
        (r) => r.id === params.id || r.place_id === params.id,
      );
      if (found) setRestaurant(found);
    }
  }, [params.id, restaurants, loading]);

  // Fetch Custom Menus
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

  const displayMenus = [...(restaurant.menus || []), ...customMenus];

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* HER0 IMAGE AREA */}
      <div className="relative h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/20 z-10" />
        {restaurant.image_url || restaurant.menus?.[0]?.image_url ? (
          <img
            src={restaurant.image_url || restaurant.menus?.[0]?.image_url}
            className="w-full h-full object-cover animate-in fade-in zoom-in duration-700"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
            <Globe size={48} />
          </div>
        )}

        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center z-20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 bg-white/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors shadow-lg">
              <Share2 size={18} />
            </button>
            <div className="shadow-lg rounded-full overflow-hidden">
              <BookmarkButton restaurantId={restaurant.id} />
            </div>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-12 right-6 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
          <Star size={14} className="text-orange-400 fill-orange-400" />
          <span className="text-sm font-black text-slate-800">4.5</span>
          <span className="text-[10px] text-slate-400 font-bold">(12件)</span>
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
          {restaurant.instagram_url && (
            <a
              href={restaurant.instagram_url}
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
          <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-400 text-sm">
            <Clock size={16} /> 営業時間
          </div>
        </div>

        {/* HIGHLIGHT: Visual Menu List */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="text-xl">🍽️</span> 食べられるもの
            </h2>
            <button
              onClick={() => setActiveTab("menu")}
              className="text-xs font-bold text-orange-500"
            >
              もっと見る
            </button>
          </div>
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
                </div>
                <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-relaxed mb-0.5">
                  {menu.name}
                </div>
                <div className="font-bold text-[10px] text-slate-400">
                  ¥{menu.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INFO SECTIONS: List Style for Readability */}
        <div className="space-y-6 mb-10">
          <FeatureList
            title="アレルギー対応"
            icon={<ShieldCheck size={18} className="text-orange-500" />}
            color="orange"
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
            {["menu", "reviews", "gallery"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? "border-slate-900 text-slate-900 scale-105" : "border-transparent text-slate-400"}`}
              >
                {tab === "menu" && "メニュー詳細"}
                {tab === "reviews" && "口コミ・記録"}
                {tab === "gallery" && "写真"}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "menu" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <MenuList menus={displayMenus} onReportMenu={setMenuToReport} />
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <ReviewList restaurantId={restaurant.id} />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <MenuGallery
                restaurantId={restaurant.id}
                images={restaurant.images}
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
      {/* Report Button */}
      <div className="fixed bottom-8 left-6 z-30 opacity-50 hover:opacity-100 transition-opacity">
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

// Compact Feature List Component
const FeatureList = ({ title, icon, color, items }) => {
  const colors = {
    orange: "bg-orange-50 border-orange-100 text-orange-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
  };
  const activeText = {
    orange: "text-orange-600",
    blue: "text-blue-600",
  };

  return (
    <div className={`rounded-3xl border p-5 ${colors[color] || colors.orange}`}>
      <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-xs font-bold opacity-70">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.value === "◯" || item.value === true ? (
                <>
                  <span
                    className={`text-xs font-black ${activeText[color] || activeText.orange}`}
                  >
                    対応
                  </span>
                  <CheckCircle
                    size={14}
                    className={activeText[color] || activeText.orange}
                  />
                </>
              ) : (
                <span className="text-[10px] font-bold opacity-30 px-2">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
