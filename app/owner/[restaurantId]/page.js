"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Phone,
  Globe,
  Clock,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";

export default function OwnerDashboard() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form States
  const [basicInfo, setBasicInfo] = useState({
    shop_name: "",
    phone: "",
    website: "",
    overview: "",
    takeout_url: "",
  });

  const [allergyInfo, setAllergyInfo] = useState({
    allergen_label: false,
    contamination: false,
    removal: false,
    chart: false,
  });

  const [kidsInfo, setKidsInfo] = useState({
    kids_chair: false,
    stroller: false,
    diaper: false,
    baby_food: false,
  });

  const [menus, setMenus] = useState([]);
  const [newMenu, setNewMenu] = useState({
    name: "",
    price: 0,
    description: "",
  });

  // Check Authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user is owner of this restaurant
        const { data: owner } = await supabase
          .from("store_owners")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("user_id", user.id)
          .eq("is_verified", true)
          .single();

        if (!owner) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setOwnerData(owner);
        setIsAuthorized(true);

        // Load restaurant data
        const { data: rest } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .single();

        if (rest) {
          setRestaurant(rest);
          setBasicInfo({
            name: rest.name || "",
            phone: rest.phone || "",
            website: rest.website || "",
            overview: rest.overview || "",
            takeout_url: rest.takeout_url || "",
          });

          const features = rest.features || {};
          setAllergyInfo({
            allergen_label: features.allergen_label === "◯",
            contamination: features.contamination === "◯",
            removal: features.removal === "◯",
            chart: features.chart === "◯",
          });
          setKidsInfo({
            kids_chair: features.kids_chair === "◯",
            stroller: features.stroller === "◯",
            diaper: features.diaper === "◯",
            baby_food: features.baby_food === "◯",
          });

          setMenus(rest.menus || []);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [restaurantId, router]);

  // Save Basic Info
  const saveBasicInfo = async () => {
    setSaving(true);
    try {
      const features = {
        ...(restaurant?.features || {}),
        allergen_label: allergyInfo.allergen_label ? "◯" : null,
        contamination: allergyInfo.contamination ? "◯" : null,
        removal: allergyInfo.removal ? "◯" : null,
        chart: allergyInfo.chart ? "◯" : null,
        kids_chair: kidsInfo.kids_chair ? "◯" : null,
        stroller: kidsInfo.stroller ? "◯" : null,
        diaper: kidsInfo.diaper ? "◯" : null,
        baby_food: kidsInfo.baby_food ? "◯" : null,
      };

      const { error } = await supabase
        .from("restaurants")
        .update({
          name: basicInfo.name,
          phone: basicInfo.phone,
          website: basicInfo.website,
          overview: basicInfo.overview,
          takeout_url: basicInfo.takeout_url,
          features,
        })
        .eq("id", restaurantId);

      if (error) throw error;
      alert("保存しました！");
    } catch (error) {
      console.error("Save error:", error);
      alert("保存に失敗しました: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Menu
  const addMenu = async () => {
    if (!newMenu.name) return;

    const updatedMenus = [
      ...menus,
      {
        ...newMenu,
        id: `owner-${Date.now()}`,
        created_at: new Date().toISOString(),
        source: "owner",
      },
    ];

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ menus: updatedMenus })
        .eq("id", restaurantId);

      if (error) throw error;

      setMenus(updatedMenus);
      setNewMenu({ name: "", price: 0, description: "" });
    } catch (error) {
      console.error("Add menu error:", error);
      alert("メニュー追加に失敗しました");
    }
  };

  // Delete Menu
  const deleteMenu = async (menuId) => {
    if (!confirm("このメニューを削除しますか？")) return;

    const updatedMenus = menus.filter((m) => m.id !== menuId);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ menus: updatedMenus })
        .eq("id", restaurantId);

      if (error) throw error;
      setMenus(updatedMenus);
    } catch (error) {
      console.error("Delete menu error:", error);
      alert("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-orange-500 font-bold">
          読み込み中...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            アクセス権限がありません
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            この店舗のオーナーダッシュボードにアクセスするには、
            オーナー認証が必要です。
          </p>
          <button
            onClick={() => router.push(`/map/${restaurantId}`)}
            className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            店舗ページへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-slate-800">オーナー管理</h1>
              <p className="text-xs text-slate-400">{basicInfo.shop_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck size={20} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600">認証済</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="max-w-2xl mx-auto flex gap-4 overflow-x-auto">
          {[
            { id: "basic", label: "基本情報" },
            { id: "allergy", label: "アレルギー対応" },
            { id: "kids", label: "キッズ対応" },
            { id: "menu", label: "メニュー管理" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin size={18} /> 店舗情報
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    店舗名
                  </label>
                  <input
                    type="text"
                    value={basicInfo.shop_name}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, shop_name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    電話番号
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      value={basicInfo.phone}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, phone: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="03-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    公式サイトURL
                  </label>
                  <div className="relative">
                    <Globe
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      value={basicInfo.website}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, website: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    お取り寄せ・通販URL
                  </label>
                  <div className="relative">
                    <ShoppingBag
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      value={basicInfo.takeout_url}
                      onChange={(e) =>
                        setBasicInfo({
                          ...basicInfo,
                          takeout_url: e.target.value,
                        })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://shop.example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    店舗紹介文
                  </label>
                  <textarea
                    value={basicInfo.overview}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, overview: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="お店の魅力を伝える紹介文を入力してください"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allergy Tab */}
        {activeTab === "allergy" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-500" />{" "}
              アレルギー対応
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              ユーザーが安心して来店できるよう、対応状況を正確にお知らせください。
            </p>

            <div className="space-y-3">
              {[
                {
                  key: "allergen_label",
                  label: "メニューにアレルギー表記がある",
                },
                { key: "contamination", label: "コンタミネーション対応が可能" },
                { key: "removal", label: "除去食の対応が可能" },
                { key: "chart", label: "アレルギー一覧表を提供" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={allergyInfo[item.key]}
                    onChange={(e) =>
                      setAllergyInfo({
                        ...allergyInfo,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Kids Tab */}
        {activeTab === "kids" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-lg">👶</span> キッズ対応
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              お子様連れのご家族が安心して来店できるよう、設備情報をお知らせください。
            </p>

            <div className="space-y-3">
              {[
                { key: "kids_chair", label: "キッズチェアあり" },
                { key: "stroller", label: "ベビーカー入店可" },
                { key: "diaper", label: "おむつ交換台あり" },
                { key: "baby_food", label: "離乳食の持ち込み可" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={kidsInfo[item.key]}
                    onChange={(e) =>
                      setKidsInfo({
                        ...kidsInfo,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {/* Add Menu Form */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={18} /> 新しいメニューを追加
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newMenu.name}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, name: e.target.value })
                  }
                  placeholder="メニュー名"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={newMenu.price || ""}
                      onChange={(e) =>
                        setNewMenu({
                          ...newMenu,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="価格（円）"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={addMenu}
                    disabled={!newMenu.name}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    追加
                  </button>
                </div>
                <textarea
                  value={newMenu.description}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, description: e.target.value })
                  }
                  placeholder="説明（任意）"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Menu List */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">
                登録済みメニュー ({menus.length}件)
              </h2>

              {menus.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">まだメニューがありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menus.map((menu) => (
                    <div
                      key={menu.id}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                        {menu.image_url ? (
                          <img
                            src={menu.image_url}
                            alt={menu.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">
                          {menu.name}
                        </div>
                        {menu.price > 0 && (
                          <div className="text-xs text-slate-500">
                            ¥{menu.price?.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMenu(menu.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      {(activeTab === "basic" ||
        activeTab === "allergy" ||
        activeTab === "kids") && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={saveBasicInfo}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-xl shadow-orange-200 hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
          >
            <Save size={20} />
            {saving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      )}
    </div>
  );
}
