"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Smartphone,
  MapPin,
  Phone,
  Globe,
  Instagram,
  ShieldCheck,
  Loader2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MenuList } from "@/components/map/MenuList";
import "@/app/map/[id]/RestaurantDetailPage.css"; // Reuse styles

export const CandidateInspectionModal = ({
  candidate,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [editedData, setEditedData] = useState(null);
  const [selectedMenuIndices, setSelectedMenuIndices] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'data'
  const [isDiving, setIsDiving] = useState(false);

  // Initialize state when candidate changes
  useEffect(() => {
    if (candidate) {
      const siteUrl = candidate.website_url || candidate.website;
      const isInsta = siteUrl && siteUrl.includes("instagram.com");

      setEditedData({
        shopName: candidate.shop_name, // Always use shop_name from candidate
        address: candidate.address,
        phone: candidate.phone,
        website_url: !isInsta ? siteUrl : "",
        instagram_url: isInsta ? siteUrl : "",
        menus: (candidate.menus || []).map((m) => ({
          ...m,
          allergens_contained: m.allergens_contained || [],
          allergens_removable: m.allergens_removable || [],
          supportedAllergens: m.supportedAllergens || [],
        })),
        features: candidate.features || { child: {}, allergy: {} },
        metadata: candidate.metadata || {},
      });
      // Select all menus by default
      setSelectedMenuIndices(candidate.menus?.map((_, i) => i) || []);

      // Select first image if available
      const meta =
        candidate.sources?.find((s) => s.type === "system_metadata")?.data ||
        {};
      const images = meta.images || [];
      if (images.length > 0) setSelectedImage(images[0].url);
    }
  }, [candidate]);

  if (!isOpen || !candidate || !editedData) return null;

  const handleDeepDive = async () => {
    if (
      !confirm(
        "公式サイトなどを解析して、より詳細なメニュー情報を取得しますか？（時間がかかります）",
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
        // Merge new data into current view
        const newData = result.data;

        // Smart URL classification
        const newSiteUrl = newData.website || newData.website_url;
        const isNewInsta = newSiteUrl && newSiteUrl.includes("instagram.com");

        setEditedData((prev) => ({
          ...prev,
          menus: newData.menus,
          features: newData.features,
          phone: newData.phone || prev.phone,
          website_url:
            !isNewInsta && newSiteUrl ? newSiteUrl : prev.website_url,
          instagram_url:
            isNewInsta && newSiteUrl ? newSiteUrl : prev.instagram_url,
        }));
        // Auto-select new menus
        setSelectedMenuIndices(newData.menus.map((_, i) => i));

        const debugInfo = result.debug
          ? `\n\n[Debug Info]\nMenus: ${result.debug.miner_results.menus_count}, Images: ${result.debug.miner_results.images_count}\nMaps Key: ${result.debug.has_maps_key ? "OK" : "MISSING"}\nGemini Key: ${result.debug.has_gemini_key ? "OK" : "MISSING"}\nPlace Details: ${result.debug.miner_results.place_details_success ? "Success" : "Failed"}`
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
      selectedImage,
      editedCandidates: editedData,
    });
    onClose();
  };

  // --- RENDER HELPERS ---

  // Imitate the helper from RestaurantDetailPage
  const renderFeatureGrid = (features, type) => {
    const isAllergy = type === "allergy";
    // Simplified labels mapping
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
        className={`p-4 rounded-2xl border ${isAllergy ? "bg-orange-50/50 border-orange-100" : "bg-blue-50/50 border-blue-100"}`}
      >
        <h3
          className={`font-bold mb-3 flex items-center gap-2 ${isAllergy ? "text-orange-800" : "text-blue-800"}`}
        >
          {isAllergy ? (
            <ShieldCheck size={16} />
          ) : (
            <span className="text-xl">👶</span>
          )}
          {isAllergy ? "アレルギー対応" : "キッズ対応"}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LABELS).map(([key, label]) => {
            const val = features?.[key];
            // Map key to data structure
            const isActive = isAllergy
              ? editedData.features?.allergy?.[key]
              : editedData.features?.child?.[key];
            const activeClass = isAllergy
              ? "border-orange-200 bg-orange-50 text-orange-600"
              : "border-blue-200 bg-blue-50 text-blue-600";

            return (
              <div
                key={key}
                className={`bg-white p-2 rounded-lg border text-center ${isActive ? activeClass : "border-slate-100 opacity-60"}`}
              >
                <div className="text-[10px] font-bold text-slate-500">
                  {label}
                </div>
                <div className="font-bold text-xs">{isActive ? "◯" : "-"}</div>
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
              <div className="space-y-2">
                {editedData.menus.map((menu, idx) => {
                  const isSelected = selectedMenuIndices.includes(idx);
                  // Use local variable for expansion check based on parent state (we need to add this state)
                  // For now, let's just use a simple toggler managed by parent,
                  // BUT WE NEED TO ADD THE STATE FIRST.
                  // Let's assume we added `const [expandedMenuIds, setExpandedMenuIds] = useState(new Set());`
                  // or just rely on a new Approach.
                  // Actually, let's replace this whole block to fix the issue properly by moving state up.
                  // Wait, I can't add state up easily without editing the top part again.
                  // I will use a refactored approach where I assume `expandedMenuIndex` state exists (I will add it in next step or this one if I can overlap).
                  // Actually, I can't easily edit two places at once with `replace_file_content` unless they are contiguous.
                  // They are NOT contiguous.
                  // I will use `MultiReplace` but I don't have it.
                  // I have `multi_replace_file_content`. I will use that.
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border transition-all ${isSelected ? "bg-white border-slate-200" : "bg-slate-50 border-transparent opacity-60"}`}
                    >
                      {/* Header Row */}
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
                            // Use the unified expansion state
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

                      {/* Expanded Editor */}
                      {activeTab === `menu-${idx}` && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              メニュー名
                            </label>
                            <input
                              className="w-full text-xs p-1 rounded border border-slate-200"
                              value={menu.name}
                              onChange={(e) => {
                                const newMenus = [...editedData.menus];
                                newMenus[idx].name = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  menus: newMenus,
                                });
                              }}
                            />
                          </div>

                          {/* Allergy Grid */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              アレルゲン設定 (4大)
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-slate-100">
                              {["wheat", "egg", "milk", "nut"].map(
                                (allergen) => (
                                  <div
                                    key={allergen}
                                    className="flex items-center justify-between text-[10px] border-b border-slate-50 pb-1 last:border-0"
                                  >
                                    <span className="font-bold text-slate-600 w-10">
                                      {
                                        {
                                          wheat: "小麦",
                                          egg: "卵",
                                          milk: "乳",
                                          nut: "ナッツ",
                                        }[allergen]
                                      }
                                    </span>
                                    <div className="flex gap-2">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="accent-rose-500"
                                          checked={menu.allergens_contained?.includes(
                                            allergen,
                                          )}
                                          onChange={(e) =>
                                            updateMenuAllergy(
                                              allergen,
                                              "allergens_contained",
                                              e.target.checked,
                                            )
                                          }
                                        />
                                        <span className="text-rose-500">
                                          使用
                                        </span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="accent-blue-500"
                                          checked={menu.allergens_removable?.includes(
                                            allergen,
                                          )}
                                          onChange={(e) =>
                                            updateMenuAllergy(
                                              allergen,
                                              "allergens_removable",
                                              e.target.checked,
                                            )
                                          }
                                        />
                                        <span className="text-blue-500">
                                          除去可
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              説明文
                            </label>
                            <textarea
                              className="w-full text-xs p-1 rounded border border-slate-200 min-h-[60px]"
                              value={menu.description || ""}
                              onChange={(e) => {
                                const newMenus = [...editedData.menus];
                                newMenus[idx].description = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  menus: newMenus,
                                });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Image Selection */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                トップ画像
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {candidate.sources
                  ?.find((s) => s.type === "system_metadata")
                  ?.data?.images?.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 ${selectedImage === img.url ? "border-orange-500 ring-2 ring-orange-100" : "border-transparent opacity-50"}`}
                    >
                      <img
                        src={img.url}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            {/* Deep Dive Button */}
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

        {/* RIGHT PANE: Smartphone Preview */}
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
              {/* HERO */}
              <div className="h-56 relative bg-slate-200">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-bold bg-orange-500 w-fit px-2 py-0.5 rounded mb-1">
                    飲食店
                  </div>
                  <h1 className="text-2xl font-black leading-tight">
                    {editedData.shopName}
                  </h1>
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 space-y-6">
                {/* Action Bar Mock */}
                <div className="flex gap-2">
                  {editedData.phone && (
                    <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-slate-600 border border-slate-100">
                      <Phone size={12} /> 電話
                    </div>
                  )}
                  {editedData.instagram_url && (
                    <div className="flex-1 py-2 bg-pink-50 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-pink-600 border border-pink-100">
                      <Instagram size={12} /> Insta
                    </div>
                  )}
                  {editedData.website_url && (
                    <div className="flex-1 py-2 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-slate-600 border border-slate-100">
                      <Globe size={12} /> Web
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <MapPin size={14} className="text-orange-500 shrink-0" />
                  <span>{editedData.address}</span>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  {renderFeatureGrid(editedData.features, "allergy")}
                  {renderFeatureGrid(editedData.features, "child")}
                </div>

                {/* Menu List */}
                <div>
                  <div className="flex items-center gap-2 font-bold mb-3">
                    <span className="text-xl">🍽️</span> 食べられるメニュー
                  </div>
                  <MenuList
                    menus={editedData.menus.filter((_, i) =>
                      selectedMenuIndices.includes(i),
                    )}
                    onReportMenu={null} // No reporting in preview
                  />
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
            iPhone 13 Pro プレビュー
          </div>
        </div>
      </div>
    </div>
  );
};
