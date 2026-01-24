"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Globe,
  Instagram,
  ShieldCheck,
  Loader2,
  Database,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ShoppingBag,
  Camera,
  Home,
  UtensilsCrossed,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import "@/app/map/[id]/RestaurantDetailPage.css";

export const CandidateInspectionModal = ({
  candidate,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [editedData, setEditedData] = useState(null);
  const [selectedMenuIndices, setSelectedMenuIndices] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("preview");
  const [isDiving, setIsDiving] = useState(false);

  // Initialize state when candidate changes
  useEffect(() => {
    if (candidate) {
      const siteUrl = candidate.website_url || candidate.website;
      const featuresInsta = candidate.features?.instagram_url;
      const isInsta = siteUrl && siteUrl.includes("instagram.com");

      // Get classified images or fallback to old images
      const classifiedImages = candidate.classified_images || {};
      const allImages = [
        ...(classifiedImages.exterior || []),
        ...(classifiedImages.interior || []),
        ...(classifiedImages.food || []),
        ...(classifiedImages.other || []),
      ];

      // Fallback to old image structure
      const legacyImages =
        candidate.sources
          ?.find((s) => s.type === "system_metadata")
          ?.data?.images?.map((img) => img.url || img) || [];

      const images = allImages.length > 0 ? allImages : legacyImages;

      setEditedData({
        shopName: candidate.shop_name,
        address: candidate.address,
        phone: candidate.phone,
        website_url: !isInsta ? siteUrl : "",
        instagram_url: featuresInsta || (isInsta ? siteUrl : ""),
        overview: candidate.overview || "",
        takeout_url: candidate.takeout_url || "",
        menus: (candidate.menus || []).map((m) => ({
          ...m,
          allergens_contained: m.allergens_contained || [],
          allergens_removable: m.allergens_removable || [],
          supportedAllergens: m.supportedAllergens || [],
        })),
        features: candidate.features || { child: {}, allergy: {} },
        metadata: candidate.metadata || {},
        classified_images: candidate.classified_images || {},
        images: images,
        is_owner_verified: candidate.is_owner_verified || false,
      });

      setSelectedMenuIndices(candidate.menus?.map((_, i) => i) || []);
      setCurrentImageIndex(0);
    }
  }, [candidate]);

  if (!isOpen || !candidate || !editedData) return null;

  const handleDeepDive = async () => {
    if (
      !confirm(
        "公式サイトなどを解析して、画像分類・概要文・店舗情報を取得しますか？（時間がかかります）",
      )
    )
      return;
    setIsDiving(true);
    try {
      const res = await fetch("/api/admin/candidates/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const result = await res.json();
      if (result.success) {
        const newData = result.data;

        // Get new images
        const classifiedImages = newData.classified_images || {};
        const allImages = [
          ...(classifiedImages.exterior || []),
          ...(classifiedImages.interior || []),
          ...(classifiedImages.food || []),
          ...(classifiedImages.other || []),
        ];

        const newSiteUrl = newData.website || newData.website_url;
        const newInstaFeature = newData.features?.instagram_url;
        const isNewInstaInWebsite =
          newSiteUrl && newSiteUrl.includes("instagram.com");

        setEditedData((prev) => ({
          ...prev,
          menus: newData.menus || prev.menus,
          features: newData.features || prev.features,
          shopName: newData.shop_name || prev.shopName,
          phone: newData.phone || prev.phone,
          overview: newData.overview || prev.overview,
          takeout_url: newData.takeout_url || prev.takeout_url,
          classified_images: classifiedImages,
          images: allImages.length > 0 ? allImages : prev.images,
          website_url:
            !isNewInstaInWebsite && newSiteUrl ? newSiteUrl : prev.website_url,
          instagram_url:
            newInstaFeature ||
            (isNewInstaInWebsite ? newSiteUrl : prev.instagram_url),
        }));

        if (newData.menus) {
          setSelectedMenuIndices(newData.menus.map((_, i) => i));
        }

        const debugInfo = result.debug
          ? `\n\n[Debug Info]\n概要: ${newData.overview ? "取得済" : "なし"}\n画像分類: 外観${classifiedImages.exterior?.length || 0}枚, 内観${classifiedImages.interior?.length || 0}枚, 料理${classifiedImages.food?.length || 0}枚`
          : "";
        alert("詳細情報の取得が完了しました" + debugInfo);
      } else {
        alert(`取得に失敗しました: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setIsDiving(false);
    }
  };

  const handleApprove = () => {
    onApprove({
      selectedMenuIndices,
      selectedImage: editedData.images?.[0] || null,
      editedCandidates: editedData,
    });
    onClose();
  };

  // Image carousel navigation
  const nextImage = () => {
    if (editedData.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % editedData.images.length);
    }
  };

  const prevImage = () => {
    if (editedData.images?.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? editedData.images.length - 1 : prev - 1,
      );
    }
  };

  // Get image category icon
  const getImageCategoryIcon = (url) => {
    const ci = editedData.classified_images;
    if (ci?.exterior?.includes(url)) return <Home size={12} />;
    if (ci?.interior?.includes(url)) return <Camera size={12} />;
    if (ci?.food?.includes(url)) return <UtensilsCrossed size={12} />;
    return <ImageIcon size={12} />;
  };

  const getImageCategoryLabel = (url) => {
    const ci = editedData.classified_images;
    if (ci?.exterior?.includes(url)) return "外観";
    if (ci?.interior?.includes(url)) return "内観";
    if (ci?.food?.includes(url)) return "料理";
    return "その他";
  };

  const renderFeatureGrid = (features, type) => {
    const isAllergy = type === "allergy";
    const LABELS = isAllergy
      ? {
          allergen_label: "メニュー表記",
          contamination: "コンタミ対策",
          removal: "除去食対応",
          chart: "アレルギー表",
        }
      : {
          kids_chair: "キッズチェア",
          stroller: "ベビーカー",
          diaper: "おむつ交換",
          baby_food: "離乳食持込",
        };

    return (
      <div
        className={`p-3 rounded-2xl border ${isAllergy ? "bg-orange-50/50 border-orange-100" : "bg-blue-50/50 border-blue-100"}`}
      >
        <h3
          className={`font-bold mb-2 flex items-center gap-2 text-xs ${isAllergy ? "text-orange-800" : "text-blue-800"}`}
        >
          {isAllergy ? (
            <ShieldCheck size={14} />
          ) : (
            <span className="text-base">👶</span>
          )}
          {isAllergy ? "アレルギー対応" : "キッズ対応"}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(LABELS).map(([key, label]) => {
            const isActive = isAllergy
              ? editedData.features?.allergy?.[key]
              : editedData.features?.child?.[key];
            const activeClass = isAllergy
              ? "border-orange-200 bg-orange-50 text-orange-600"
              : "border-blue-200 bg-blue-50 text-blue-600";

            return (
              <div
                key={key}
                className={`bg-white p-1.5 rounded-lg border text-center ${isActive ? activeClass : "border-slate-100 opacity-60"}`}
              >
                <div className="text-[9px] font-bold text-slate-500">
                  {label}
                </div>
                <div className="font-bold text-[10px]">
                  {isActive ? "◯" : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* LEFT PANE: Editor & Controls */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-slate-100 h-full">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="font-black text-lg text-slate-800">
                候補データの検証
              </h2>
              <p className="text-xs text-slate-500">
                内容を修正し、プレビューで確認してください
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info Editor */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase">
                基本情報
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    店舗名
                  </label>
                  <input
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                    value={editedData.shopName}
                    onChange={(e) =>
                      setEditedData({ ...editedData, shopName: e.target.value })
                    }
                  />
                </div>

                {/* NEW: Overview Editor */}
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    店舗概要 (AI生成 or 手動入力)
                  </label>
                  <textarea
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs min-h-[80px]"
                    value={editedData.overview}
                    onChange={(e) =>
                      setEditedData({ ...editedData, overview: e.target.value })
                    }
                    placeholder="店舗の魅力や特徴を説明..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500">
                      公式サイト URL
                    </label>
                    <input
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-blue-600"
                      value={editedData.website_url || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          website_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  {/* NEW: Takeout URL */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500">
                      お取り寄せ / オンラインショップ URL
                    </label>
                    <input
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-emerald-600"
                      value={editedData.takeout_url || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          takeout_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      電話番号
                    </label>
                    <input
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      value={editedData.phone || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Instagram URL
                    </label>
                    <input
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-pink-600"
                      value={editedData.instagram_url || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          instagram_url: e.target.value,
                        })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    住所
                  </label>
                  <input
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    value={editedData.address || ""}
                    onChange={(e) =>
                      setEditedData({ ...editedData, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Menu Selection */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase">
                掲載メニュー選択 ({selectedMenuIndices.length}件)
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {editedData.menus.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">メニューなし</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ユーザー/オーナーからの投稿を待っています
                    </p>
                  </div>
                ) : (
                  editedData.menus.map((menu, idx) => {
                    const isSelected = selectedMenuIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border transition-all ${isSelected ? "bg-white border-slate-200" : "bg-slate-50 border-transparent opacity-60"}`}
                      >
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMenuIndices((prev) =>
                                prev.filter((i) => i !== idx),
                              );
                            } else {
                              setSelectedMenuIndices((prev) => [...prev, idx]);
                            }
                          }}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-300"}`}
                          >
                            {isSelected && <CheckCircle size={10} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-bold text-slate-800 truncate">
                                {menu.name}
                              </span>
                              <span className="text-xs text-slate-500 shrink-0">
                                ¥{menu.price}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab((prev) =>
                                prev === `menu-${idx}`
                                  ? "preview"
                                  : `menu-${idx}`,
                              );
                            }}
                          >
                            {activeTab === `menu-${idx}` ? "閉じる" : "編集"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Image Selection with Categories */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                画像 ({editedData.images?.length || 0}枚)
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {editedData.images?.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 ${currentImageIndex === idx ? "border-orange-500 ring-2 ring-orange-100" : "border-transparent opacity-70"}`}
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 flex items-center gap-1">
                      {getImageCategoryIcon(url)}
                      {getImageCategoryLabel(url)}
                    </div>
                  </div>
                ))}
                {(!editedData.images || editedData.images.length === 0) && (
                  <div className="w-full py-4 text-center text-slate-400 text-xs">
                    画像なし - Deep Diveで取得できます
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <Button
              variant="outline"
              onClick={handleDeepDive}
              disabled={isDiving}
              className="w-full h-12 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {isDiving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  詳細取得中...
                </>
              ) : (
                <>
                  <Database className="mr-2" size={18} />✨ 詳細取得 (AI)
                </>
              )}
            </Button>
            <Button
              onClick={handleApprove}
              className="w-full bg-emerald-500 hover:bg-emerald-600 h-12 text-lg shadow-emerald-200"
            >
              <CheckCircle className="mr-2" />
              承認して公開
            </Button>
            <button
              onClick={onReject}
              className="w-full py-3 text-sm font-bold text-slate-400 hover:text-rose-500 flex items-center justify-center gap-2"
            >
              <AlertCircle size={16} /> データに不備があるため却下
            </button>
          </div>
        </div>

        {/* RIGHT PANE: NEW Smartphone Preview with Image Carousel */}
        <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 pattern-grid opacity-5 pointer-events-none"></div>

          {/* Device Frame */}
          <div className="relative w-[375px] h-[750px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col">
            {/* Status Bar Mock */}
            <div className="h-6 bg-slate-800 w-full flex justify-between px-6 items-center">
              <span className="text-[10px] text-white font-bold">9:41</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 bg-white rounded-full opacity-20"></span>
                <span className="w-3 h-3 bg-white rounded-full text-white text-[8px] flex items-center justify-center">
                  🔋
                </span>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto pb-20 bg-white scrollbar-hide">
              {/* NEW: Image Carousel Hero */}
              <div className="h-56 relative bg-slate-200">
                {editedData.images?.length > 0 ? (
                  <>
                    <img
                      src={editedData.images[currentImageIndex]}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      alt=""
                    />
                    {/* Carousel controls */}
                    {editedData.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <ChevronRight size={16} />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
                          {editedData.images.map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                            />
                          ))}
                        </div>
                        {/* Category label */}
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                          {getImageCategoryIcon(
                            editedData.images[currentImageIndex],
                          )}
                          {getImageCategoryLabel(
                            editedData.images[currentImageIndex],
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-bold bg-orange-500 w-fit px-2 py-0.5 rounded">
                      飲食店
                    </div>
                    {editedData.is_owner_verified && (
                      <div className="flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">
                        <BadgeCheck size={10} /> 公認
                      </div>
                    )}
                  </div>
                  <h1 className="text-xl font-black leading-tight">
                    {editedData.shopName}
                  </h1>
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 space-y-4">
                {/* Action Bar Mock */}
                <div className="flex gap-2">
                  {editedData.phone && (
                    <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-100">
                      <Phone size={10} /> 電話
                    </div>
                  )}
                  {editedData.instagram_url && (
                    <div className="flex-1 py-2 bg-pink-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-pink-600 border border-pink-100">
                      <Instagram size={10} /> Insta
                    </div>
                  )}
                  {editedData.website_url && (
                    <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-100">
                      <Globe size={10} /> Web
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-[10px] text-slate-500">
                  <MapPin size={12} className="text-orange-500 shrink-0" />
                  <span>{editedData.address}</span>
                </div>

                {/* NEW: Overview Section */}
                {editedData.overview && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-100">
                    <h3 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-base">💡</span> このお店について
                    </h3>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      {editedData.overview}
                    </p>
                  </div>
                )}

                {/* NEW: Takeout Section */}
                {editedData.takeout_url && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                    <h3 className="font-bold text-xs text-emerald-800 mb-2 flex items-center gap-2">
                      <ShoppingBag size={14} /> お取り寄せ・オンラインショップ
                    </h3>
                    <div className="text-[10px] text-emerald-600 truncate">
                      {editedData.takeout_url}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {renderFeatureGrid(editedData.features, "allergy")}
                  {renderFeatureGrid(editedData.features, "child")}
                </div>

                {/* Menu List */}
                <div>
                  <div className="flex items-center gap-2 font-bold mb-2 text-sm">
                    <span className="text-base">🍽️</span> 食べられるメニュー
                  </div>
                  {editedData.menus.filter((_, i) =>
                    selectedMenuIndices.includes(i),
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {editedData.menus
                        .filter((_, i) => selectedMenuIndices.includes(i))
                        .slice(0, 3)
                        .map((menu, i) => (
                          <div
                            key={i}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-800">
                                {menu.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ¥{menu.price}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-dashed border-slate-200">
                      <p className="text-[10px] text-slate-400">
                        メニュー情報はユーザー/オーナーからの投稿を待っています
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-6">
              <div className="w-6 h-6 rounded bg-orange-100"></div>
              <div className="w-6 h-6 rounded bg-slate-100"></div>
              <div className="w-6 h-6 rounded bg-slate-100"></div>
            </div>
          </div>

          <div className="absolute bottom-4 text-xs text-slate-400 font-bold bg-white/80 px-3 py-1 rounded-full backdrop-blur">
            iPhone 16 Pro プレビュー (新デザイン)
          </div>
        </div>
      </div>
    </div>
  );
};
