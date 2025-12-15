'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Settings, FileText, HelpCircle, LogOut,
    Trash2, ChevronRight, Camera, Plus, MapPin,
    ShieldAlert, Info, Mail, Pencil, Loader2, Award, MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Footer } from '@/components/Footer';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/NotificationList';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
    const {
        user, profile, loading,
        updateUserName, updateAvatar,
        addChild, updateChild, deleteChild,
        deleteAccount
    } = useProfile();
    const { notifications, markAsRead } = useNotifications(user?.id);
    const router = useRouter();
    const fileInputRef = useRef(null);

    // Local state for editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [showChildModal, setShowChildModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null); // null = new, object = edit

    // Modals for Child Edits
    const [childName, setChildName] = useState('');
    const [childIcon, setChildIcon] = useState('👶');
    const [childAllergens, setChildAllergens] = useState([]);

    const ALLERGEN_OPTIONS = ['卵', '乳', '小麦', 'えび', 'かに', 'そば', '落花生'];

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-text-sub">
                <Loader2 className="animate-spin mr-2" />
                読み込み中...
            </div>
        );
    }

    if (!user) {
        return null;
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
        if (!childName.trim()) return;

        const childData = {
            name: childName,
            icon: childIcon,
            allergens: childAllergens
        };

        if (editingChild) {
            await updateChild(editingChild.id, childData);
        } else {
            await addChild(childData);
        }
        closeChildModal();
    };

    const openChildModal = (child = null) => {
        if (child) {
            setEditingChild(child);
            setChildName(child.name);
            setChildIcon(child.icon || '👶');
            setChildAllergens(child.allergens || []);
        } else {
            setEditingChild(null);
            setChildName('');
            setChildIcon('👶');
            setChildAllergens([]);
        }
        setShowChildModal(true);
    };

    const closeChildModal = () => {
        setShowChildModal(false);
        setEditingChild(null);
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
        <div className="min-h-screen bg-background pb-20">
            {/* Header Area */}
            <div className="pt-6 pb-2 px-6">
                <h1 className="text-2xl font-bold text-text-main">プロフィール</h1>
            </div>

            <div className="px-4 space-y-6">
                {/* 0. Notifications */}
                <NotificationList
                    notifications={notifications}
                    onRead={markAsRead}
                />

                {/* 1. Profile Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-6">
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

                    <div className="flex-1">
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
                            <div className="flex items-center gap-2">
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
                            {profile.children?.length > 0
                                ? `${profile.children.length}人のお子様を登録中`
                                : 'お子様を登録してください'}
                        </p>
                    </div>
                </div>

                {/* 1.5 Badges (New) */}
                <div>
                    <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">獲得バッジ</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex flex-col items-center min-w-[80px]">
                            <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center border-2 border-yellow-200 shadow-sm mb-2">
                                <span className="text-3xl">🔰</span>
                            </div>
                            <span className="text-xs font-bold text-text-main">はじめまして</span>
                        </div>

                        <div className="flex flex-col items-center min-w-[80px] opacity-40 grayscale">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-100 mb-2">
                                <span className="text-3xl">🍳</span>
                            </div>
                            <span className="text-xs font-bold text-text-sub">初投稿</span>
                        </div>

                        <div className="flex flex-col items-center min-w-[80px] opacity-40 grayscale">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-100 mb-2">
                                <span className="text-3xl">💬</span>
                            </div>
                            <span className="text-xs font-bold text-text-sub">初レポート</span>
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
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl border border-orange-100">
                                        {child.icon || '👶'}
                                    </div>
                                    <div>
                                        <span className="font-bold text-text-main block">{child.name}</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {child.allergens?.map(a => (
                                                <span key={a} className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full font-bold">
                                                    {a}
                                                </span>
                                            ))}
                                            {(!child.allergens || child.allergens.length === 0) && (
                                                <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-bold">
                                                    アレルギーなし
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300" size={20} />
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
                        <Link href="/terms" className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 text-text-main">
                                <FileText size={20} className="text-slate-400" />
                                <span>利用規約</span>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </Link>
                        <Link href="/privacy" className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 text-text-main">
                                <ShieldAlert size={20} className="text-slate-400" />
                                <span>プライバシーポリシー</span>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </Link>
                        <a href="mailto:support@anshin-recipe.com" className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 text-text-main">
                                <Mail size={20} className="text-slate-400" />
                                <span>お問い合わせ</span>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </a>
                    </div>
                </div>

                {/* 4. Account Actions */}
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
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

                        <div className="space-y-6">
                            {/* Icon Selection */}
                            <div>
                                <label className="text-sm font-bold text-text-sub mb-2 block">アイコン</label>
                                <div className="flex gap-3 justify-center bg-slate-50 p-4 rounded-2xl">
                                    {['👶', '👧', '👦'].map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setChildIcon(icon)}
                                            className={`
                                                w-14 h-14 rounded-full text-3xl flex items-center justify-center transition-all
                                                ${childIcon === icon
                                                    ? 'bg-white shadow-md scale-110 border-2 border-primary'
                                                    : 'hover:bg-white hover:shadow-sm opacity-50'
                                                }
                                            `}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name Input */}
                            <div>
                                <label className="text-sm font-bold text-text-sub mb-2 block">お名前</label>
                                <Input
                                    type="text"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="たろう"
                                />
                            </div>

                            {/* Allergens */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-text-sub block">アレルギー品目（除去）</label>
                                    <button
                                        onClick={() => setChildAllergens(ALLERGEN_OPTIONS)}
                                        className="text-xs text-primary font-bold bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                                    >
                                        特定原材料7品目を全選択
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ALLERGEN_OPTIONS.map(allergen => (
                                        <button
                                            key={allergen}
                                            onClick={() => {
                                                if (childAllergens.includes(allergen)) {
                                                    setChildAllergens(prev => prev.filter(a => a !== allergen));
                                                } else {
                                                    setChildAllergens(prev => [...prev, allergen]);
                                                }
                                            }}
                                            className={`
                                                px-4 py-2 rounded-full text-sm font-bold transition-all border
                                                ${childAllergens.includes(allergen)
                                                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                                                    : 'bg-white text-text-sub border-slate-200 hover:border-rose-200 hover:text-rose-400'
                                                }
                                            `}
                                        >
                                            {allergen}
                                        </button>
                                    ))}
                                </div>
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

            <Footer />
        </div >
    );
}
