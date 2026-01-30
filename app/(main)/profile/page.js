"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Camera,
  Pencil,
  Star,
  ChevronRight,
  Plus,
  Info,
  HelpCircle,
  Mail,
  Users,
  Smartphone,
  Zap,
  LogOut,
  Trash2,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabaseClient";
import { uploadImage } from "@/lib/imageUpload";

// Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import IconPicker from "@/components/IconPicker";

export default function ProfilePage() {
  // ... hook destructuring
  const {
    user,
    profile,
    loading,
    likedRecipeIds,
    updateUserName,
    updateAvatar,
    addChild,
    updateChild,
    deleteChild,
    deleteAccount,
  } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(user?.id);
  const router = useRouter();
  const fileInputRef = useRef(null);
  const childFileInputRef = useRef(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Local state for editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showChildModal, setShowChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null); // null = new, object = edit

  // Modals for Child Edits
  const [childName, setChildName] = useState("");
  const [childIcon, setChildIcon] = useState("👶");
  const [childPhoto, setChildPhoto] = useState(null); // URL string
  const [childPhotoFile, setChildPhotoFile] = useState(null); // File object
  const [childAllergens, setChildAllergens] = useState([]);

  const [customAllergen, setCustomAllergen] = useState(""); // Free text input
  const [formErrors, setFormErrors] = useState({}); // Validation errors

  // Inquiry Modal
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [announcementTab, setAnnouncementTab] = useState("roadmap"); // 'roadmap', 'updates', 'news'
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null); // For FAQ accordion

  const ALLERGEN_OPTIONS = [
    "卵",
    "乳",
    "小麦",
    "えび",
    "かに",
    "そば",
    "落花生", // 特定原材料7品目
    "アーモンド",
    "あわび",
    "いか",
    "いくら",
    "オレンジ",
    "カシューナッツ",
    "キウイフルーツ",
    "牛肉",
    "くるみ",
    "ごま",
    "さけ",
    "さば",
    "大豆",
    "鶏肉",
    "バナナ",
    "豚肉",
    "まつたけ",
    "もも",
    "やまいも",
    "りんご",
    "ゼラチン", // 特定原材料に準ずる21品目
  ];

  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isMounted]);

  // Show skeleton while loading - prevents blank flash
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-6 pb-2 px-6">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="px-4 space-y-6">
          {/* Profile card skeleton */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Badges skeleton */}
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-full bg-slate-200 animate-pulse"
              />
            ))}
          </div>
          {/* Children skeleton */}
          <div className="bg-white rounded-[24px] p-4 shadow-sm">
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateName = async () => {
    if (newName.trim()) {
      await updateUserName(newName);
      setIsEditingName(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await updateAvatar(file);
    }
  };

  const handleSaveChild = async () => {
    // Validate all required fields
    const errors = {};
    if (!childName.trim()) {
      errors.name = "お名前を入力してください";
    }
    if (childAllergens.length === 0) {
      errors.allergens = "アレルギーを最低1つ選択してください";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    let photoUrl = childPhoto;

    // Upload new photo if selected
    if (childPhotoFile) {
      try {
        photoUrl = await uploadImage(childPhotoFile, "child-photos");
      } catch (error) {
        console.error("Child photo upload failed:", error);
        alert("写真のアップロードに失敗しました");
        return;
      }
    }

    const childData = {
      name: childName,
      icon: childIcon,
      photo: photoUrl,
      allergens: childAllergens,
    };

    try {
      if (editingChild) {
        await updateChild(editingChild.id, childData);
      } else {
        await addChild(childData);
      }
      closeChildModal();
    } catch (error) {
      console.error("Error saving child:", error);
    }
  };

  const openChildModal = (child = null) => {
    if (child) {
      setEditingChild(child);
      setChildName(child.name);
      setChildIcon(child.icon || "👶");
      setChildPhoto(child.photo || null);
      setChildAllergens(child.allergens || []);
    } else {
      setEditingChild(null);
      setChildName("");
      setChildIcon("👶");
      setChildPhoto(null);
      setChildAllergens([]);
    }
    setChildPhotoFile(null);
    setCustomAllergen("");
    setShowChildModal(true);
  };

  const closeChildModal = () => {
    setShowChildModal(false);
    setEditingChild(null);
    setFormErrors({});
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "本当にアカウントを削除しますか？\nこの操作は取り消せません。\n保存したレシピや登録情報がすべて削除されます。",
      )
    ) {
      await deleteAccount();
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Area */}
      <div className="pt-6 pb-0 px-6">
        <h1 className="text-2xl font-bold text-text-main">マイページ</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* 1. Profile Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-md relative">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-orange-300">
                  <User size={40} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="新しい名前"
                  autoFocus
                  className="h-10 text-sm"
                />
                <Button size="sm" onClick={handleUpdateName}>
                  保存
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h2 className="text-xl font-bold text-text-main">
                  {profile.userName || "ユーザー"}
                </h2>
                <button
                  onClick={() => {
                    setNewName(profile.userName || "");
                    setIsEditingName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-primary transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
            <p className="text-xs text-text-sub mt-1">ママ・パパの名前</p>
          </div>
        </div>

        {/* 1.5 Badges (New) */}
        <div>
          <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">
            獲得バッジ
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.recipeCount > 0 ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-100 border-slate-200"}`}
              >
                <span
                  className={`text-2xl ${profile.stats?.recipeCount > 0 ? "" : "grayscale opacity-40"}`}
                >
                  🍳
                </span>
                {!profile.stats?.recipeCount && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">🔒</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-bold ${profile.stats?.recipeCount > 0 ? "text-text-main" : "text-slate-400"}`}
              >
                初投稿
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${profile.stats?.recipeCount > 0 ? "text-amber-500" : "text-slate-500 font-medium"}`}
              >
                {profile.stats?.recipeCount > 0 ? (
                  "獲得済み"
                ) : (
                  <>
                    レシピ投稿
                    <br />
                    あと1回
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.reportCount > 0 ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-100 border-slate-200"}`}
              >
                <span
                  className={`text-2xl ${profile.stats?.reportCount > 0 ? "" : "grayscale opacity-40"}`}
                >
                  💬
                </span>
                {!profile.stats?.reportCount && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">🔒</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-bold ${profile.stats?.reportCount > 0 ? "text-text-main" : "text-slate-400"}`}
              >
                初レポート
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${profile.stats?.reportCount > 0 ? "text-amber-500" : "text-slate-500 font-medium"}`}
              >
                {profile.stats?.reportCount > 0 ? (
                  "獲得済み"
                ) : (
                  <>
                    レポ投稿
                    <br />
                    あと1回
                  </>
                )}
              </span>
            </div>

            {/* NEW BADGES */}
            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${likedRecipeIds?.length >= 10 ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-100 border-slate-200"}`}
              >
                <span
                  className={`text-2xl ${likedRecipeIds?.length >= 10 ? "" : "grayscale opacity-40"}`}
                >
                  😋
                </span>
                {(likedRecipeIds?.length || 0) < 10 && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">🔒</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-bold ${likedRecipeIds?.length >= 10 ? "text-text-main" : "text-slate-400"}`}
              >
                食通
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${likedRecipeIds?.length >= 10 ? "text-amber-500" : "text-slate-500 font-medium"}`}
              >
                {likedRecipeIds?.length >= 10 ? (
                  "獲得済み"
                ) : (
                  <>
                    いいね！
                    <br />
                    あと{10 - (likedRecipeIds?.length || 0)}回
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.recipeCount >= 10 ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-100 border-slate-200"}`}
              >
                <span
                  className={`text-2xl ${profile.stats?.recipeCount >= 10 ? "" : "grayscale opacity-40"}`}
                >
                  👨‍🍳
                </span>
                {(!profile.stats?.recipeCount ||
                  profile.stats.recipeCount < 10) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">🔒</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-bold ${profile.stats?.recipeCount >= 10 ? "text-text-main" : "text-slate-400"}`}
              >
                シェフ
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${profile.stats?.recipeCount >= 10 ? "text-amber-500" : "text-slate-500 font-medium"}`}
              >
                {profile.stats?.recipeCount >= 10 ? (
                  "獲得済み"
                ) : (
                  <>
                    レシピ投稿
                    <br />
                    あと{10 - (profile.stats?.recipeCount || 0)}回
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.reportCount >= 5 ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-100 border-slate-200"}`}
              >
                <span
                  className={`text-2xl ${profile.stats?.reportCount >= 5 ? "" : "grayscale opacity-40"}`}
                >
                  📝
                </span>
                {(!profile.stats?.reportCount ||
                  profile.stats.reportCount < 5) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">🔒</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-bold ${profile.stats?.reportCount >= 5 ? "text-text-main" : "text-slate-400"}`}
              >
                レポーター
              </span>
              <span
                className={`text-[10px] text-center leading-tight ${profile.stats?.reportCount >= 5 ? "text-amber-500" : "text-slate-500 font-medium"}`}
              >
                {profile.stats?.reportCount >= 5 ? (
                  "獲得済み"
                ) : (
                  <>
                    レポ投稿
                    <br />
                    あと{5 - (profile.stats?.reportCount || 0)}回
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 1.7 Pro Settings Link (For Pro Users only) */}
        {profile.isPro && (
          <div className="mb-4">
            <Link
              href="/profile/pro-settings"
              className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-[24px] border border-amber-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-amber-500">
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <span className="font-bold text-slate-800">
                    プロ設定を編集する
                  </span>
                  <p className="text-[11px] text-amber-600 font-medium">
                    SNSリンク・自己紹介の管理
                  </p>
                </div>
              </div>
              <ChevronRight
                className="text-amber-400 group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
          </div>
        )}

        {/* 2. Children Settings */}
        <div>
          <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">
            お子様の設定
          </h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
            {profile.children?.map((child, index) => (
              <div
                key={child.id}
                className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none active:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => openChildModal(child)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl border border-orange-100 flex-shrink-0">
                    {child.icon || "👶"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <span className="font-bold text-text-main">
                      {child.name}
                    </span>
                    {child.allergens && child.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {child.allergens.map((a) => (
                          <span
                            key={a}
                            className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-bold border border-orange-200"
                          >
                            {a}なし
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-bold">
                        アレルギーなし
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className="text-slate-300 flex-shrink-0"
                  size={20}
                />
              </div>
            ))}
            <button
              className="w-full p-4 flex items-center justify-center gap-2 text-primary font-bold hover:bg-orange-50 transition-colors"
              onClick={() => openChildModal(null)}
            >
              <Plus size={18} />
              お子様を追加する
            </button>
          </div>
        </div>

        {/* 3. App Info */}
        <div>
          <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">
            アプリについて
          </h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
            <button
              onClick={() => setShowAnnouncementsModal(true)}
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-text-main">
                <Info size={20} className="text-slate-400" />
                <span>お知らせ</span>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
            <button
              onClick={() => setShowFAQModal(true)}
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-text-main">
                <HelpCircle size={20} className="text-slate-400" />
                <span>よくある質問 (Q&A)</span>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
            <button
              onClick={() => setShowInquiryModal(true)}
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-text-main">
                <Mail size={20} className="text-slate-400" />
                <span>お問い合わせ</span>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
            <Link
              href="/team"
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-text-main">
                <Users size={20} className="text-slate-400" />
                <span>だれがやってるの？</span>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </Link>
          </div>
        </div>

        {/* 4. Quick Save Guide */}
        <div>
          <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">
            便利な使い方
          </h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
            <Link
              href="/quick-save-guide"
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 bg-emerald-50/10"
            >
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                  <Smartphone size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      ホーム画面に追加
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                      推奨
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold">
                    アプリのように全画面で見やすくなります！
                  </p>
                </div>
              </div>
              <ChevronRight className="text-emerald-300" size={20} />
            </Link>
            <Link
              href="/sns-save-guide"
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-medium">SNSからかんたん保存</span>
                  <p className="text-xs text-slate-400">
                    インスタやTikTokのURLを共有するだけ
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </Link>
          </div>
        </div>

        {/* 5. Account Actions */}
        <div>
          <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">
            アカウント
          </h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm mb-4">
            <button
              onClick={handleSignOut}
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-text-main">
                <LogOut size={20} className="text-slate-400" />
                <span>ログアウト</span>
              </div>
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-rose-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-alert">
                <Trash2 size={20} />
                <span>アカウントを削除する</span>
              </div>
            </button>
          </div>
          <p className="text-xs text-slate-400 px-4 leading-relaxed">
            アカウントを削除すると、保存したレシピや登録情報はすべて削除され、元に戻すことはできません。
          </p>
        </div>
      </div>

      {/* Child Edit Modal */}
      {showChildModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeChildModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 mb-[env(safe-area-inset-bottom)] pb-12 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-main">
                {editingChild ? "お子様情報を編集" : "お子様を追加"}
              </h3>
              <button
                onClick={closeChildModal}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pb-24">
              {/* Photo / Icon Selection */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => childFileInputRef.current?.click()}
                >
                  {childPhotoFile ? (
                    <img
                      src={URL.createObjectURL(childPhotoFile)}
                      className="w-full h-full object-cover"
                    />
                  ) : childPhoto ? (
                    <img
                      src={childPhoto}
                      className="w-full h-full object-cover"
                    />
                  ) : childIcon && childIcon !== "👶" ? (
                    <span className="text-5xl">{childIcon}</span>
                  ) : (
                    <Camera className="text-slate-400" size={32} />
                  )}
                </div>
                <input
                  type="file"
                  ref={childFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      setChildPhotoFile(e.target.files[0]);
                  }}
                />

                {/* Icon Picker Toggle */}
                <div className="w-full">
                  <div className="flex justify-center mb-2">
                    <p className="text-sm text-slate-400">
                      アイコンでも設定できます
                    </p>
                  </div>
                  <IconPicker
                    selected={childIcon}
                    onChange={(icon) => {
                      setChildIcon(icon);
                      setChildPhoto(null);
                      setChildPhotoFile(null);
                    }}
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-sm font-bold text-text-sub mb-2 block">
                  お名前 <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    if (formErrors.name)
                      setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="たろう"
                  className={formErrors.name ? "border-rose-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Allergens Selection */}
              <div>
                <label className="text-sm font-bold text-text-sub mb-2 block">
                  アレルギー <span className="text-rose-500">*</span>
                </label>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ALLERGEN_OPTIONS.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => {
                          if (childAllergens.includes(allergen)) {
                            setChildAllergens(
                              childAllergens.filter((a) => a !== allergen),
                            );
                          } else {
                            setChildAllergens([...childAllergens, allergen]);
                          }
                          if (formErrors.allergens)
                            setFormErrors((prev) => ({
                              ...prev,
                              allergens: null,
                            }));
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                          childAllergens.includes(allergen)
                            ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-105"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-white"
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>

                  {/* Custom Allergen Input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customAllergen}
                      onChange={(e) => setCustomAllergen(e.target.value)}
                      placeholder="その他（自由入力）"
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (
                          customAllergen &&
                          !childAllergens.includes(customAllergen)
                        ) {
                          setChildAllergens([
                            ...childAllergens,
                            customAllergen,
                          ]);
                          setCustomAllergen("");
                        }
                      }}
                    >
                      追加
                    </Button>
                  </div>
                </div>
                {formErrors.allergens && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.allergens}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {editingChild && (
                  <button
                    onClick={() => {
                      if (confirm("本当にお子様情報を削除しますか？")) {
                        deleteChild(editingChild.id);
                        closeChildModal();
                      }
                    }}
                    className="px-4 py-3 bg-rose-50 text-rose-500 font-bold rounded-xl hover:bg-rose-100"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <Button
                  onClick={handleSaveChild}
                  className="flex-1 h-12 text-lg shadow-lg shadow-orange-200"
                >
                  保存する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>お問い合わせ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ご意見・ご要望・不具合のご報告は、以下のフォームよりお願いいたします。
            </p>
            <a
              href="https://forms.gle/ExampleFormID" // Replace with actual Google Form
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-slate-800 text-white text-center rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              お問い合わせフォームを開く
            </a>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowInquiryModal(false)}
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Modal */}
      <Dialog open={showFAQModal} onOpenChange={setShowFAQModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>よくある質問</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[
              {
                q: "無料で使えますか？",
                a: "はい、すべての機能を無料でご利用いただけます。",
              },
              {
                q: "機種変更をした場合のデータ移行は？",
                a: "同じアカウント（LINEまたはGoogle）でログインしていただければ、新しい端末でもデータを引き継ぐことができます。",
              },
              {
                q: "レシピの公開範囲は？",
                a: "「公開」に設定したレシピは、すべてのユーザーが閲覧できます。「非公開」にすると自分だけが見ることができます。",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-slate-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaqIndex(expandedFaqIndex === i ? null : i)
                  }
                  className="w-full p-4 flex items-center justify-between bg-slate-50 text-left font-bold text-slate-700 text-sm"
                >
                  {item.q}
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${expandedFaqIndex === i ? "rotate-90" : ""}`}
                  />
                </button>
                {expandedFaqIndex === i && (
                  <div className="p-4 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowFAQModal(false)}
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Modal */}
      <Dialog
        open={showAnnouncementsModal}
        onOpenChange={setShowAnnouncementsModal}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto p-0 gap-0">
          <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 pt-6 pb-2">
            <DialogTitle className="mb-4">お知らせ</DialogTitle>
            <Tabs
              value={announcementTab}
              onValueChange={setAnnouncementTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roadmap">ロードマップ</TabsTrigger>
                <TabsTrigger value="updates">アップデート</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-6">
            <Tabs value={announcementTab} className="w-full">
              <TabsContent value="roadmap" className="mt-0 space-y-4">
                <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    🚀 今後の開発予定
                  </h3>
                  <p className="text-xs text-orange-600 mb-4">
                    2024年の春頃までに実装予定の機能です
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-xl">🤖</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          AIレシピ提案
                        </p>
                        <p className="text-xs text-slate-500">
                          冷蔵庫の余り物からアレルギー対応レシピを提案
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          献立カレンダー
                        </p>
                        <p className="text-xs text-slate-500">
                          1週間の献立を自動作成＆買い物リスト化
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="updates" className="mt-0 space-y-4">
                {[
                  {
                    date: "2024.03.15",
                    title: "SNS保存機能を追加しました",
                    type: "new",
                  },
                  {
                    date: "2024.03.01",
                    title: "プロフィール画面をリニューアル",
                    type: "update",
                  },
                  {
                    date: "2024.02.20",
                    title: "アレルギー項目の表示を改善",
                    type: "fix",
                  },
                ].map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 font-mono">
                        {item.date}
                      </span>
                      {item.type === "new" && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    {i < 2 && <div className="h-px bg-slate-100 my-3" />}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAnnouncementsModal(false)}
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}
