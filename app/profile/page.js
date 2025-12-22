'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Settings, FileText, HelpCircle, LogOut,
    Trash2, ChevronRight, Camera, Plus, MapPin,
    ShieldAlert, Info, Mail, Pencil, Loader2, Award, MessageCircle, Zap, Smartphone, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Footer } from '@/components/Footer';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/NotificationList';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadImage } from '@/lib/imageUpload';
import AllergySelector from '@/components/AllergySelector';
import IconPicker from '@/components/IconPicker';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ... imports

export default function ProfilePage() {
    // ... hook destructuring
    const {
        user, profile, loading, likedRecipeIds,
        updateUserName, updateAvatar,
        addChild, updateChild, deleteChild,
        deleteAccount
    } = useProfile();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
    const router = useRouter();
    const fileInputRef = useRef(null);
    const childFileInputRef = useRef(null); // New ref for child photo

    // Local state for editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [showChildModal, setShowChildModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null); // null = new, object = edit

    // Modals for Child Edits
    const [childName, setChildName] = useState('');
    const [childIcon, setChildIcon] = useState('👶');
    const [childPhoto, setChildPhoto] = useState(null); // URL string
    const [childPhotoFile, setChildPhotoFile] = useState(null); // File object
    const [childAllergens, setChildAllergens] = useState([]);
    const [customAllergen, setCustomAllergen] = useState(''); // Free text input
    const [formErrors, setFormErrors] = useState({}); // Validation errors

    // Inquiry Modal
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
    const [announcementTab, setAnnouncementTab] = useState('roadmap'); // 'roadmap', 'updates', 'news'
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null); // For FAQ accordion

    const ALLERGEN_OPTIONS = [
        '卵', '乳', '小麦', 'えび', 'かに', 'そば', '落花生', // 特定原材料7品目
        'アーモンド', 'あわび', 'いか', 'いくら', 'オレンジ', 'カシューナッツ', 'キウイフルーツ',
        '牛肉', 'くるみ', 'ごま', 'さけ', 'さば', '大豆', '鶏肉', 'バナナ',
        '豚肉', 'まつたけ', 'もも', 'やまいも', 'りんご', 'ゼラチン' // 特定原材料に準ずる21品目
    ];

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
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
            errors.name = 'お名前を入力してください';
        }
        if (childAllergens.length === 0) {
            errors.allergens = 'アレルギーを最低1つ選択してください';
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        let photoUrl = childPhoto;

        // Upload new photo if selected
        if (childPhotoFile) {
            try {
                photoUrl = await uploadImage(childPhotoFile, 'child-photos');
            } catch (error) {
                console.error('Child photo upload failed:', error);
                alert('写真のアップロードに失敗しました');
                return;
            }
        }

        const childData = {
            name: childName,
            icon: childIcon,
            photo: photoUrl,
            allergens: childAllergens
        };

        try {
            if (editingChild) {
                await updateChild(editingChild.id, childData);
            } else {
                await addChild(childData);
            }
            closeChildModal();
        } catch (error) {
            console.error('Error saving child:', error);
        }
    };

    const openChildModal = (child = null) => {
        if (child) {
            setEditingChild(child);
            setChildName(child.name);
            setChildIcon(child.icon || '👶');
            setChildPhoto(child.photo || null);
            setChildAllergens(child.allergens || []);
        } else {
            setEditingChild(null);
            setChildName('');
            setChildIcon('👶');
            setChildPhoto(null);
            setChildAllergens([]);
        }
        setChildPhotoFile(null);
        setCustomAllergen('');
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
            console.error('Error signing out:', error);
        } finally {
            window.location.href = '/login';
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。\n保存したレシピや登録情報がすべて削除されます。')) {
            await deleteAccount();
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header Area */}
            <div className="pt-6 pb-2 px-6">
                <h1 className="text-2xl font-bold text-text-main">マイページ</h1>
            </div>

            <div className="px-4 space-y-6">

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
                                <Button
                                    size="sm"
                                    onClick={handleUpdateName}
                                >
                                    保存
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <h2 className="text-xl font-bold text-text-main">{profile.userName || 'ユーザー'}</h2>
                                <button
                                    onClick={() => {
                                        setNewName(profile.userName || '');
                                        setIsEditingName(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-text-sub mt-1">
                            ママ・パパの名前
                        </p>
                    </div>
                </div>

                {/* 1.5 Badges (New) */}
                <div>
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">獲得バッジ</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex flex-col items-center min-w-[72px]">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.recipeCount > 0 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-2xl ${profile.stats?.recipeCount > 0 ? '' : 'grayscale opacity-40'}`}>🍳</span>
                                {(!profile.stats?.recipeCount) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] text-white">🔒</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-bold ${profile.stats?.recipeCount > 0 ? 'text-text-main' : 'text-slate-400'}`}>初投稿</span>
                            <span className={`text-[10px] text-center leading-tight ${profile.stats?.recipeCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {profile.stats?.recipeCount > 0 ? '獲得済み' : (
                                    <>レシピ投稿<br />あと1回</>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-col items-center min-w-[72px]">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.reportCount > 0 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-2xl ${profile.stats?.reportCount > 0 ? '' : 'grayscale opacity-40'}`}>💬</span>
                                {(!profile.stats?.reportCount) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] text-white">🔒</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-bold ${profile.stats?.reportCount > 0 ? 'text-text-main' : 'text-slate-400'}`}>初レポート</span>
                            <span className={`text-[10px] text-center leading-tight ${profile.stats?.reportCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {profile.stats?.reportCount > 0 ? '獲得済み' : (
                                    <>レポ投稿<br />あと1回</>
                                )}
                            </span>
                        </div>

                        {/* NEW BADGES */}
                        <div className="flex flex-col items-center min-w-[72px]">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${likedRecipeIds?.length >= 10 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-2xl ${likedRecipeIds?.length >= 10 ? '' : 'grayscale opacity-40'}`}>😋</span>
                                {(likedRecipeIds?.length || 0) < 10 && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] text-white">🔒</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-bold ${likedRecipeIds?.length >= 10 ? 'text-text-main' : 'text-slate-400'}`}>食通</span>
                            <span className={`text-[10px] text-center leading-tight ${likedRecipeIds?.length >= 10 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {likedRecipeIds?.length >= 10 ? '獲得済み' : (
                                    <>いいね！<br />あと{(10 - (likedRecipeIds?.length || 0))}回</>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-col items-center min-w-[72px]">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.recipeCount >= 10 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-2xl ${profile.stats?.recipeCount >= 10 ? '' : 'grayscale opacity-40'}`}>👨‍🍳</span>
                                {(!profile.stats?.recipeCount || profile.stats.recipeCount < 10) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] text-white">🔒</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-bold ${profile.stats?.recipeCount >= 10 ? 'text-text-main' : 'text-slate-400'}`}>シェフ</span>
                            <span className={`text-[10px] text-center leading-tight ${profile.stats?.recipeCount >= 10 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {profile.stats?.recipeCount >= 10 ? '獲得済み' : (
                                    <>レシピ投稿<br />あと{(10 - (profile.stats?.recipeCount || 0))}回</>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-col items-center min-w-[72px]">
                            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${profile.stats?.reportCount >= 5 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-2xl ${profile.stats?.reportCount >= 5 ? '' : 'grayscale opacity-40'}`}>📝</span>
                                {(!profile.stats?.reportCount || profile.stats.reportCount < 5) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] text-white">🔒</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-bold ${profile.stats?.reportCount >= 5 ? 'text-text-main' : 'text-slate-400'}`}>レポーター</span>
                            <span className={`text-[10px] text-center leading-tight ${profile.stats?.reportCount >= 5 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {profile.stats?.reportCount >= 5 ? '獲得済み' : (
                                    <>レポ投稿<br />あと{(5 - (profile.stats?.reportCount || 0))}回</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Children Settings */}
                <div>
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">お子様の設定</h3>
                    <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                        {profile.children?.map((child, index) => (
                            <div
                                key={child.id}
                                className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none active:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => openChildModal(child)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl border border-orange-100 flex-shrink-0">
                                        {child.icon || '👶'}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap flex-1">
                                        <span className="font-bold text-text-main">{child.name}</span>
                                        {child.allergens && child.allergens.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {child.allergens.map(a => (
                                                    <span key={a} className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-bold border border-orange-200">
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
                                <ChevronRight className="text-slate-300 flex-shrink-0" size={20} />
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
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">アプリについて</h3>
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
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">便利な使い方</h3>
                    <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                        <Link
                            href="/quick-save-guide#sns-save"
                            className="w-full p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-text-main">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                                    <Zap size={16} className="text-white" />
                                </div>
                                <div>
                                    <span className="font-medium">SNSからかんたん保存</span>
                                    <p className="text-xs text-slate-400">インスタやTikTokのURLを共有するだけ</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </Link>
                        <Link
                            href="/quick-save-guide#pwa-install"
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-2 border-emerald-50 bg-emerald-50/10"
                        >
                            <div className="flex items-center gap-3 text-text-main">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                                    <Smartphone size={16} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">ホーム画面に追加</span>
                                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">推奨</span>
                                    </div>
                                    <p className="text-xs text-emerald-600 font-bold">アプリのように全画面で見やすくなります！</p>
                                </div>
                            </div>
                            <ChevronRight className="text-emerald-300" size={20} />
                        </Link>
                    </div>
                </div>

                {/* 5. Account Actions */}
                <div>
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">アカウント</h3>
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
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeChildModal}>
                    <div
                        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 mb-[env(safe-area-inset-bottom)] pb-12 sm:pb-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-main">
                                {editingChild ? 'お子様情報を編集' : 'お子様を追加'}
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
                                        <img src={URL.createObjectURL(childPhotoFile)} className="w-full h-full object-cover" />
                                    ) : childPhoto ? (
                                        <img src={childPhoto} className="w-full h-full object-cover" />
                                    ) : childIcon && childIcon !== '👶' ? (
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
                                        if (e.target.files?.[0]) setChildPhotoFile(e.target.files[0]);
                                    }}
                                />

                                {/* Icon Picker Toggle */}
                                <div className="w-full">
                                    <div className="flex justify-center mb-2">
                                        <p className="text-sm text-slate-400">アイコンでも設定できます</p>
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
                                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                                    }}
                                    placeholder="たろう"
                                    className={formErrors.name ? 'border-rose-500' : ''}
                                />
                                {formErrors.name && (
                                    <p className="text-rose-500 text-xs mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Allergens */}
                            <div>
                                <div className="mb-2">
                                    <span className="text-sm font-bold text-text-sub">
                                        アレルギー <span className="text-rose-500">*</span>
                                    </span>
                                </div>
                                <AllergySelector
                                    selected={childAllergens}
                                    onChange={(allergens) => {
                                        setChildAllergens(allergens);
                                        if (formErrors.allergens) setFormErrors(prev => ({ ...prev, allergens: null }));
                                    }}
                                />
                                {formErrors.allergens && (
                                    <p className="text-rose-500 text-xs mt-1">{formErrors.allergens}</p>
                                )}
                            </div>

                            {/* Privacy Disclaimer */}
                            <div className="bg-slate-50 rounded-2xl p-4 mt-4">
                                <p className="text-xs text-slate-500 leading-relaxed text-center">
                                    🔒 お子さまのお名前・アイコンはあなた以外には表示されません。
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            {editingChild && (
                                <button
                                    onClick={() => {
                                        if (confirm('本当に削除しますか？')) {
                                            deleteChild(editingChild.id);
                                            closeChildModal();
                                        }
                                    }}
                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <Button
                                onClick={handleSaveChild}
                                className="flex-1"
                            >
                                {editingChild ? '保存する' : '追加する'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFAQModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowFAQModal(false)}>
                    <div
                        className="bg-white w-full max-w-md max-h-[80vh] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-main">よくある質問 (Q&A)</h3>
                            <button onClick={() => setShowFAQModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { q: 'レポート投稿とは？', a: '他の人のレシピを作った際に、感想や写真を投稿できる機能です。投稿すると作者へ通知が届きます。' },
                                { q: '非公開レシピとは？', a: '自分だけが見られるレシピです。SNSで見つけたレシピのメモ保管場所として便利です。' },
                                { q: 'アレルゲン判定について', a: 'お子様のアレルギー情報とレシピの「含まないアレルゲン」情報を照合して、安全性を判定しています。' },
                                { q: '獲得バッジとは？', a: 'アプリをたくさん使うほど種類が増えていく勲章です。プロフィールで進捗を確認できます。' },
                                { q: 'レシピの保存方法は？', a: 'レシピ詳細ページの右上にある「保存（しおり）」アイコンをタップすると、保存済みタブに追加されます。' },
                                { q: '外部サイトのレシピも登録できる？', a: 'はい。WebサイトやSNSのURLを入力すると、タイトルや画像を自動で取得して簡単に登録できます。' },
                                { q: 'お子様の追加・編集方法は？', a: 'プロフィールの「お子様の設定」からいつでも追加や内容の変更が可能です。' },
                                { q: '通知が届くタイミングは？', a: '自分のレシピが「いいね」「保存」「レポート投稿」された時、および運営からのお知らせが届きます。' },
                                { q: '退会するとデータはどうなる？', a: 'アカウントを削除すると、これまで投稿したレシピや登録したお子様の情報は即座にすべて消去されます。' },
                                { q: 'アレルギー情報の入力ミスを見つけた', a: 'レシピの編集画面からいつでもアレルゲン情報を修正できます。正確な情報の登録をお願いします。' }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}
                                    className="w-full text-left bg-slate-50 rounded-xl p-4 transition-all hover:bg-slate-100"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1">
                                            <span className="shrink-0 text-orange-400 font-bold text-lg">Q.</span>
                                            <p className="font-bold text-slate-700">{item.q}</p>
                                        </div>
                                        <span className={`transition-transform duration-200 text-slate-400 ${expandedFaqIndex === i ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                    {expandedFaqIndex === i && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                            <span className="shrink-0 font-bold text-primary text-lg">A.</span>
                                            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={() => setShowFAQModal(false)}
                            className="mt-8 w-full"
                        >
                            閉じる
                        </Button>
                    </div>
                </div>
            )}

            {/* Announcements Modal */}
            {showAnnouncementsModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAnnouncementsModal(false)}>
                    <div
                        className="bg-white w-full max-w-md max-h-[85vh] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-text-main">お知らせ</h3>
                            <button onClick={() => setShowAnnouncementsModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 space-x-1">
                            {[
                                { id: 'roadmap', label: '改善予定' },
                                { id: 'updates', label: '改善履歴' },
                                { id: 'news', label: 'お知らせ' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAnnouncementTab(tab.id)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${announcementTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-text-sub'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {announcementTab === 'roadmap' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 mb-3">今後追加予定の機能</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { name: 'レシピ検索の強化', status: 'wip' },
                                            { name: '食材からレシピ提案', status: 'planned' },
                                            { name: 'ダークモード', status: 'planned' },
                                            { name: '多言語対応', status: 'planned' },
                                            { name: 'お気に入りフォルダ', status: 'planned' },
                                            { name: 'プッシュ通知', status: 'wip' },
                                        ].map((item, i) => (
                                            <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.status === 'wip' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.status === 'wip' && <span className="mr-1">🚧</span>}
                                                {item.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <p className="text-sm text-slate-500 mb-3">実装済み機能</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Q&A機能', '通知機能', 'レポート投稿', 'バッジ機能', 'アレルゲン自動判定'].map((item, i) => (
                                                <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-600">
                                                    ✓ {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {announcementTab === 'updates' && (
                                <div className="space-y-4">
                                    {[
                                        { date: '2025年12月20日', title: 'UI/UXの大幅改善', desc: 'Q&Aの折りたたみ表示、ロゴサイズ調整、お問い合わせリンクの追加など多数の改善を行いました。' },
                                        { date: '2025年12月18日', title: 'UI/UXの改善', desc: 'レシピ詳細画面の画像表示、通知機能の強化、Q&Aセクションを追加しました。' },
                                        { date: '2025年12月17日', title: 'レシピ投稿機能の強化', desc: 'アレルゲン自動判定、公開設定のデフォルト化を実装しました。' },
                                        { date: '2025年12月16日', title: 'ログイン不具合の修正', desc: 'LINEログインが正常に動作しない問題を解消しました。' },
                                        { date: '2025年12月12日', title: '画像読み込み高速化', desc: 'レシピ登録時のOGP画像取得を高速化しました。' },
                                    ].map((update, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">✨</span>
                                                <span className="text-xs text-blue-500 font-bold">{update.date}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-700 mb-1">{update.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">{update.desc}</p>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-sm text-slate-500 mb-3">ご意見・ご要望をお聞かせください</p>
                                        <button
                                            onClick={() => { setShowAnnouncementsModal(false); setShowInquiryModal(true); }}
                                            className="w-full py-3 bg-primary text-white rounded-xl font-bold transition-all hover:bg-orange-600"
                                        >
                                            📩 お問い合わせはこちら
                                        </button>
                                    </div>
                                </div>
                            )}

                            {announcementTab === 'news' && (
                                <div className="space-y-4">
                                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">📢</span>
                                            <span className="text-xs text-orange-500 font-bold">2025年12月18日</span>
                                        </div>
                                        <h4 className="font-bold text-slate-700 mb-1">あんしんレシピへようこそ！</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            アレルギーっ子のパパ・ママのためのレシピ共有アプリです。ご意見・ご要望はお気軽に<button onClick={() => { setShowAnnouncementsModal(false); setShowInquiryModal(true); }} className="text-primary underline font-bold">お問い合わせ</button>からお寄せください。
                                        </p>
                                    </div>
                                    <p className="text-center text-sm text-slate-400 py-8">新しいお知らせはありません</p>
                                </div>
                            )}
                        </div>

                        <Button onClick={() => setShowAnnouncementsModal(false)} className="mt-4 w-full">
                            閉じる
                        </Button>
                    </div>
                </div>
            )}

            {/* Inquiry Modal */}
            {showInquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-center mb-6 text-text-main">お問い合わせ</h3>
                        <div className="space-y-4">
                            <a
                                href="https://line.me/R/ti/p/@668fqaht"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" className="w-6 h-6" />
                                LINEで問い合わせる
                            </a>
                            <a
                                href="mailto:y.kominami@hitokoto1.co.jp"
                                className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors active:scale-95"
                            >
                                <Mail size={20} />
                                メールで問い合わせる
                            </a>
                        </div>
                        <button
                            onClick={() => setShowInquiryModal(false)}
                            className="mt-6 w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div >
    );
}
