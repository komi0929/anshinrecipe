"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Settings,
  FileText,
  LogOut,
  ChevronRight,
  Camera,
  Plus,
  Info,
  Mail,
  Pencil,
  Loader2,
  Zap,
  Heart,
  Bookmark,
  Utensils,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Footer } from "@/components/Footer";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadImage } from "@/lib/imageUpload";
import AllergySelector from "@/components/AllergySelector";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    updateUserName,
    updateAvatar,
    addChild,
    updateChild,
    deleteChild,
    updateProProfile,
    updateAllergens,
  } = useProfile();

  // Layout State
  const [kitchenTab, setKitchenTab] = useState("my_recipes");

  // Editing States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [myAllergens, setMyAllergens] = useState([]);

  // Refs
  const fileInputRef = useRef(null);
  const childFileInputRef = useRef(null);

  // Pro Profile Edit
  const [showProModal, setShowProModal] = useState(false);
  const [proLinks, setProLinks] = useState({
    instagram: "",
    twitter: "",
    youtube: "",
    blog: "",
  });

  // Data State
  const [kitchenData, setKitchenData] = useState({
    myRecipes: [],
    savedRecipes: [],
    reports: [],
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Child Modal State
  const [showChildModal, setShowChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childName, setChildName] = useState("");
  const [childIcon, setChildIcon] = useState("👶");
  const [childPhoto, setChildPhoto] = useState(null);
  const [childPhotoFile, setChildPhotoFile] = useState(null);
  const [childAllergens, setChildAllergens] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Info Modals
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Sync Profile Data to Local State
  useEffect(() => {
    if (profile) {
      setMyAllergens(profile.allergens || []);
      setProLinks({
        instagram: profile.instagramUrl || "",
        twitter: profile.twitterUrl || "",
        youtube: profile.youtubeUrl || "",
        blog: profile.blogUrl || "",
      });
      setNewBio(profile.bio || "");
    }
  }, [profile]);

  // Fetch Data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch Kitchen Data
        const [myRecipes, saved, reports] = await Promise.all([
          supabase
            .from("recipes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("saved_recipes")
            .select("*, recipes(*)")
            .eq("user_id", user.id),
          supabase
            .from("tried_reports")
            .select("*, recipes(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);
        setKitchenData({
          myRecipes: myRecipes.data || [],
          savedRecipes: saved.data || [],
          reports: reports.data || [],
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-400" />
      </div>
    );

  // Handlers
  const handleUpdateName = async () => {
    if (newName.trim()) {
      await updateUserName(newName);
      setIsEditingName(false);
    }
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await updateAvatar(file);
  };
  const handleSaveAllergens = async () => {
    await updateAllergens(myAllergens);
    setShowAllergyModal(false);
  };
  const handleSaveProProfile = async () => {
    await updateProProfile({
      bio: newBio,
      instagramUrl: proLinks.instagram,
      twitterUrl: proLinks.twitter,
      youtubeUrl: proLinks.youtube,
      blogUrl: proLinks.blog,
    });
    setShowProModal(false);
    setIsEditingBio(false);
  };

  // Child Handlers (Using useProfile hook)
  const handleSaveChild = async () => {
    const errors = {};
    if (!childName.trim()) errors.name = "お名前を入力してください";
    if (childAllergens.length === 0)
      errors.allergens = "アレルギーを選択してください";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    let photoUrl = childPhoto;
    if (childPhotoFile) {
      try {
        photoUrl = await uploadImage(childPhotoFile, "child-photos");
      } catch (e) {
        alert("アップロード失敗");
        return;
      }
    }
    const childData = {
      name: childName,
      icon: childIcon,
      photo: photoUrl,
      allergens: childAllergens,
    };
    if (editingChild) await updateChild(editingChild.id, childData);
    else await addChild(childData);
    closeChildModal();
  };
  const openChildModal = (child = null) => {
    if (child) {
      setEditingChild(child);
      setChildName(child.name);
      setChildIcon(child.icon || "👶");
      setChildPhoto(child.photo);
      setChildAllergens(child.allergens || []);
    } else {
      setEditingChild(null);
      setChildName("");
      setChildIcon("👶");
      setChildPhoto(null);
      setChildAllergens([]);
    }
    setChildPhotoFile(null);
    setShowChildModal(true);
  };
  const closeChildModal = () => {
    setShowChildModal(false);
    setEditingChild(null);
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* 1. Header Section */}
      <div className="bg-white pb-6 pt-safe rounded-b-[40px] shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -ml-24 -mt-24 opacity-30 pointer-events-none" />

        <div className="px-6 pt-12 relative z-10">
          {/* Top Nav */}
          <div className="flex justify-end mb-4">
            <Link
              href="/settings"
              className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <Settings size={20} />
            </Link>
          </div>

          {/* Profile Main */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer mb-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-orange-50 shadow-lg relative">
                {profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-200">
                    <User size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 text-center font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={handleUpdateName}>
                  保存
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">
                  {profile?.userName || "ユーザー"}
                </h1>
                <button
                  onClick={() => {
                    setNewName(profile?.userName || "");
                    setIsEditingName(true);
                  }}
                  className="text-slate-300 hover:text-orange-500"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs font-bold text-slate-500 mb-6 bg-white/50 backdrop-blur-sm border border-slate-100 px-6 py-3 rounded-2xl shadow-sm">
              <span className="flex flex-col items-center gap-1">
                <Utensils size={18} className="text-orange-400 mb-0.5" />
                <span>{profile?.stats?.recipeCount || 0} Recipes</span>
              </span>
              <span className="w-px h-8 bg-slate-200" />
              <span className="flex flex-col items-center gap-1">
                <FileText size={18} className="text-green-400 mb-0.5" />
                <span>{profile?.stats?.reportCount || 0} Reports</span>
              </span>
            </div>

            {/* Bio & SNS */}
            <div className="w-full max-w-sm mb-6">
              {isEditingBio ? (
                <div className="bg-slate-50 p-4 rounded-2xl text-left">
                  <textarea
                    className="w-full bg-transparent text-sm resize-none focus:outline-none mb-2"
                    rows={3}
                    placeholder="自己紹介..."
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                  />
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Instagram size={16} className="text-pink-500" />
                      <Input
                        className="h-8 text-xs"
                        placeholder="@username"
                        value={proLinks.instagram}
                        onChange={(e) =>
                          setProLinks({
                            ...proLinks,
                            instagram: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter size={16} className="text-blue-400" />
                      <Input
                        className="h-8 text-xs"
                        placeholder="@username"
                        value={proLinks.twitter}
                        onChange={(e) =>
                          setProLinks({ ...proLinks, twitter: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Youtube size={16} className="text-red-500" />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Video URL"
                        value={proLinks.youtube}
                        onChange={(e) =>
                          setProLinks({ ...proLinks, youtube: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-slate-500" />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Blog URL"
                        value={proLinks.blog}
                        onChange={(e) =>
                          setProLinks({ ...proLinks, blog: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingBio(false)}
                    >
                      キャンセル
                    </Button>
                    <Button size="sm" onClick={handleSaveProProfile}>
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center relative group/bio">
                  <p
                    className={`text-sm text-slate-600 leading-relaxed ${!profile?.bio && "text-slate-400 italic"}`}
                  >
                    {profile?.bio || "自己紹介を入力..."}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    {profile?.instagramUrl && (
                      <a
                        href={`https://instagram.com/${profile.instagramUrl}`}
                        target="_blank"
                        className="text-pink-500 hover:scale-110 transition-transform"
                      >
                        <Instagram size={18} />
                      </a>
                    )}
                    {profile?.twitterUrl && (
                      <a
                        href={`https://twitter.com/${profile.twitterUrl}`}
                        target="_blank"
                        className="text-blue-400 hover:scale-110 transition-transform"
                      >
                        <Twitter size={18} />
                      </a>
                    )}
                    {profile?.youtubeUrl && (
                      <a
                        href={profile.youtubeUrl}
                        target="_blank"
                        className="text-red-500 hover:scale-110 transition-transform"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                    {profile?.blogUrl && (
                      <a
                        href={profile.blogUrl}
                        target="_blank"
                        className="text-slate-500 hover:scale-110 transition-transform"
                      >
                        <Globe size={18} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setIsEditingBio(true);
                        setShowProModal(true);
                      }}
                      className="absolute -right-2 top-0 opacity-0 group-hover/bio:opacity-100 p-2 text-slate-300 hover:text-orange-500"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  {Object.values(proLinks).every((v) => !v) &&
                    !profile?.bio && (
                      <button
                        onClick={() => setIsEditingBio(true)}
                        className="text-xs text-orange-500 font-bold mt-2"
                      >
                        ＋ プロフィール・SNSを編集
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* My Allergens (Restored) */}
            <div className="w-full max-w-sm bg-orange-50/50 rounded-2xl p-4 border border-orange-100 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-orange-800 flex items-center gap-1">
                  <AlertCircle size={12} /> My Allergens
                </h3>
                <button
                  onClick={() => setShowAllergyModal(true)}
                  className="text-[10px] bg-white px-2 py-1 rounded-full text-orange-500 font-bold shadow-sm active:scale-95"
                >
                  編集
                </button>
              </div>
              {myAllergens.length > 0 ? (
                <div className="flex flex-wrap gap-1 justify-center">
                  {myAllergens.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 bg-white text-orange-600 text-[10px] font-bold rounded-md shadow-sm border border-orange-100"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-orange-300">
                  アレルギー情報は未登録です
                </div>
              )}
            </div>

            {/* Children List */}
            <div className="w-full overflow-x-auto no-scrollbar pb-2 flex items-center justify-center gap-3 min-h-[80px]">
              {profile?.children &&
                profile.children.length > 0 &&
                profile.children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => openChildModal(child)}
                    className="flex flex-col items-center gap-1 cursor-pointer group animate-in zoom-in duration-300"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-white shadow-md flex items-center justify-center text-xl group-hover:scale-110 transition-transform overflow-hidden">
                      {child.photo ? (
                        <img
                          src={child.photo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        child.icon
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                      {child.name}
                    </span>
                  </div>
                ))}
              <button
                onClick={() => openChildModal(null)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 border-dashed flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  追加
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Menu (Grid Layout) */}
      <div className="px-4 mt-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            icon={<Info size={20} />}
            title="運営からの"
            subtitle="お知らせ"
            color="blue"
            onClick={() => setShowAnnouncementsModal(true)}
          />
          <Link href="/shortcut-guide" className="block">
            <ActionCard
              icon={<Zap size={20} />}
              title="便利機能"
              subtitle="活用ガイド"
              color="purple"
            />
          </Link>
          <ActionCard
            icon={<Mail size={20} />}
            title="困ったら"
            subtitle="お問い合わせ"
            color="green"
            onClick={() => setShowInquiryModal(true)}
          />
          {/* Future Button Placeholder */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed flex items-center justify-center text-slate-300 text-xs font-bold">
            Coming Soon
          </div>
        </div>
      </div>

      {/* 4. Content Tabs */}
      <div className="px-4 pb-20 min-h-[300px]">
        {/* Sub Tabs */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-4 border-b border-slate-200">
          {["my_recipes", "saved", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setKitchenTab(tab)}
              className={`pb-2 px-2 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${kitchenTab === tab ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400"}`}
            >
              {tab === "my_recipes"
                ? "Myレシピ"
                : tab === "saved"
                  ? "保存済み"
                  : "つくレポ"}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
          {isLoadingData ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : kitchenTab === "my_recipes" ? (
            kitchenData.myRecipes.length === 0 ? (
              <div className="text-center py-10">
                <Button onClick={() => router.push("/recipe/new")}>
                  レシピ投稿
                </Button>
              </div>
            ) : (
              kitchenData.myRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onClick={() => router.push(`/recipe/${r.id}`)}
                />
              ))
            )
          ) : kitchenTab === "saved" ? (
            kitchenData.savedRecipes.map((s) => (
              <RecipeCard
                key={s.id}
                recipe={s.recipes}
                onClick={() => router.push(`/recipe/${s.recipes.id}`)}
              />
            ))
          ) : (
            kitchenData.reports.map((rep) => (
              <RecipeCard
                key={rep.id}
                recipe={rep.recipes}
                onClick={() => router.push(`/recipe/${rep.recipes.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="font-bold text-center mb-4">マイアレルギー設定</h3>
            <AllergySelector
              selectedAllergens={myAllergens}
              onChange={setMyAllergens}
            />
            <Button
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 font-bold"
              onClick={handleSaveAllergens}
            >
              保存する
            </Button>
          </div>
        </div>
      )}

      {showChildModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-center mb-6 text-lg">
              {editingChild ? "お子様編集" : "お子様追加"}
            </h3>
            <div className="flex justify-center mb-6 relative">
              <div
                className="w-24 h-24 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-4xl overflow-hidden cursor-pointer"
                onClick={() => childFileInputRef.current?.click()}
              >
                {childPhoto ? (
                  <img
                    src={childPhoto}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  childIcon
                )}
                <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-orange-400">
                  <Camera size={16} />
                </div>
              </div>
              <input
                type="file"
                ref={childFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) setChildPhotoFile(e.target.files[0]);
                }}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 pl-1 block mb-1">
                  お名前
                </label>
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs pl-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 pl-1 block mb-1">
                  アレルギー
                </label>
                <AllergySelector
                  selectedAllergens={childAllergens}
                  onChange={setChildAllergens}
                />
                {formErrors.allergens && (
                  <p className="text-red-500 text-xs pl-1">
                    {formErrors.allergens}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl"
                onClick={closeChildModal}
              >
                キャンセル
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white"
                onClick={handleSaveChild}
              >
                保存
              </Button>
            </div>
            {editingChild && (
              <button
                onClick={() => {
                  if (confirm("削除しますか？")) deleteChild(editingChild.id);
                  closeChildModal();
                }}
                className="w-full text-center text-xs text-red-300 font-bold mt-4 py-2"
              >
                この子を削除
              </button>
            )}
          </div>
        </div>
      )}

      {showAnnouncementsModal && (
        <SimpleModal
          title="お知らせ"
          content="アップデート情報や運営からのお知らせが表示されます。"
          onClose={() => setShowAnnouncementsModal(false)}
        />
      )}
      {showInquiryModal && (
        <SimpleModal
          title="お問い合わせ"
          content={
            <a
              href="mailto:support@anshin.com"
              className="block w-full bg-slate-100 p-4 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-200"
            >
              メールを送る
            </a>
          }
          onClose={() => setShowInquiryModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}

// Sub Components
const ActionCard = ({ icon, title, subtitle, color, onClick }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-500 shadow-blue-100",
    purple: "bg-purple-50 text-purple-500 shadow-purple-100",
    green: "bg-green-50 text-green-500 shadow-green-100",
    orange: "bg-orange-50 text-orange-500 shadow-orange-100",
  };
  return (
    <div
      onClick={onClick}
      className="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-slate-400 truncate">
          {title}
        </div>
        <div className="text-xs font-black text-slate-700 truncate">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

const RecipeCard = ({ recipe, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-3 rounded-2xl shadow-sm flex items-center gap-3 active:scale-98 transition-transform"
  >
    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative">
      {recipe?.image ? (
        <Image src={recipe.image} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <Utensils size={20} />
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-bold text-sm text-slate-800 line-clamp-1">
        {recipe?.title || "無題のレシピ"}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold">
          ❤ {recipe?.likes_count || 0}
        </span>
        <span className="text-[10px] text-slate-400">
          {new Date(recipe?.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
      <Heart size={24} />
    </div>
    <p className="text-xs font-bold">{text}</p>
  </div>
);

const SimpleModal = ({ title, content, onClose }) => (
  <div
    className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    onClick={onClose}
  >
    <div
      className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed font-medium">
        {content}
      </div>
    </div>
  </div>
);
