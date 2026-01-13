'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Settings, FileText, HelpCircle, LogOut,
    Trash2, ChevronRight, Camera, Plus, MapPin,
    ShieldAlert, Info, Mail, Pencil, Loader2, Award, MessageCircle, Zap, Smartphone, Users, Star
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
import { useMapData } from '@/hooks/useMapData';

export default function ProfilePage() {
    const {
        user, profile, loading, likedRecipeIds,
        visitedRestaurantIds, wishlistRestaurantIds,
        updateUserName, updateAvatar,
        addChild, updateChild, deleteChild,
        toggleUserRestaurant,
        deleteAccount
    } = useProfile();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
    const { restaurants } = useMapData();
    const router = useRouter();
    const fileInputRef = useRef(null);
    const childFileInputRef = useRef(null);

    // Local state
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'map', 'recipes'
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [showChildModal, setShowChildModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null);

    const [childName, setChildName] = useState('');
    const [childIcon, setChildIcon] = useState('👶');
    const [childPhoto, setChildPhoto] = useState(null);
    const [childPhotoFile, setChildPhotoFile] = useState(null);
    const [childAllergens, setChildAllergens] = useState([]);
    const [formErrors, setFormErrors] = useState({});

    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
    const [announcementTab, setAnnouncementTab] = useState('roadmap');
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

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

    const handleSaveChild = async () => {
        const errors = {};
        if (!childName.trim()) errors.name = 'お名前を入力してください';
        if (childAllergens.length === 0) errors.allergens = 'アレルギーを選択してください';
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        let photoUrl = childPhoto;
        if (childPhotoFile) {
            try { photoUrl = await uploadImage(childPhotoFile, 'child-photos'); }
            catch (error) { alert('写真のアップロードに失敗しました'); return; }
        }

        const childData = { name: childName, icon: childIcon, photo: photoUrl, allergens: childAllergens };
        try {
            if (editingChild) await updateChild(editingChild.id, childData);
            else await addChild(childData);
            closeChildModal();
        } catch (error) { console.error('Error saving child:', error); }
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
        setShowChildModal(true);
    };

    const closeChildModal = () => {
        setShowChildModal(false);
        setEditingChild(null);
        setFormErrors({});
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const handleDeleteAccount = async () => {
        if (confirm('本当にアカウントを削除しますか？')) {
            await deleteAccount();
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Tab Switcher */}
            <div className="px-6 pt-6 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>プロフィール</button>
                    <button onClick={() => setActiveTab('map')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>マップ記録</button>
                    <button onClick={() => setActiveTab('recipes')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'recipes' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>マイレシピ</button>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {activeTab === 'profile' && (
                    <>
                        {/* Profile Card */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-md relative">
                                    {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-orange-300"><User size={40} /></div>}
                                </div>
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="flex-1 min-w-0">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名前" autoFocus className="h-10 text-sm" />
                                        <Button size="sm" onClick={handleUpdateName}>保存</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <h2 className="text-xl font-bold text-text-main">{profile.userName || 'ユーザー'}</h2>
                                        <button onClick={() => { setNewName(profile.userName || ''); setIsEditingName(true); }} className="p-1 text-slate-400 hover:text-primary transition-colors"><Pencil size={16} /></button>
                                    </div>
                                )}
                                <p className="text-xs text-text-sub mt-1">マイレシピ公式メンバー</p>
                            </div>
                        </div>

                        {/* Badges */}
                        <div>
                            <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">獲得バッジ</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {/* Simple Badge UI for now */}
                                <div className="flex flex-col items-center min-w-[72px]">
                                    <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shadow-sm text-2xl">🥇</div>
                                    <span className="text-[11px] font-bold text-text-main mt-1">はじめて</span>
                                </div>
                            </div>
                        </div>

                        {/* Children Settings */}
                        <div>
                            <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">お子様の設定</h3>
                            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                                {profile.children?.map((child) => (
                                    <div key={child.id} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none active:bg-slate-50 cursor-pointer" onClick={() => openChildModal(child)}>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl border border-orange-100">
                                                {child.icon || '👶'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main">{child.name}</span>
                                                <span className="text-xs text-orange-600 font-bold">{child.allergens?.join('・')} 不使用</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300" size={20} />
                                    </div>
                                ))}
                                <button className="w-full p-4 flex items-center justify-center gap-2 text-primary font-bold hover:bg-orange-50" onClick={() => openChildModal(null)}>
                                    <Plus size={18} /> お子様を追加する
                                </button>
                            </div>
                        </div>

                        {/* App Info */}
                        <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                            <button onClick={() => setShowAnnouncementsModal(true)} className="w-full p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 text-left">
                                <div className="flex items-center gap-3 text-text-main"><Info size={20} className="text-slate-400" /><span>お知らせ</span></div>
                                <ChevronRight className="text-slate-300" size={20} />
                            </button>
                            <button onClick={() => setShowFAQModal(true)} className="w-full p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 text-left">
                                <div className="flex items-center gap-3 text-text-main"><HelpCircle size={20} className="text-slate-400" /><span>よくある質問 (Q&A)</span></div>
                                <ChevronRight className="text-slate-300" size={20} />
                            </button>
                            <button onClick={() => setShowInquiryModal(true)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-left">
                                <div className="flex items-center gap-3 text-text-main"><Mail size={20} className="text-slate-400" /><span>お問い合わせ</span></div>
                                <ChevronRight className="text-slate-300" size={20} />
                            </button>
                        </div>

                        {/* Account Actions */}
                        <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                            <button onClick={handleSignOut} className="w-full p-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 text-left">
                                <div className="flex items-center gap-3 text-text-main"><LogOut size={20} className="text-slate-400" /><span>ログアウト</span></div>
                            </button>
                            <button onClick={handleDeleteAccount} className="w-full p-4 flex items-center justify-between hover:bg-rose-50 text-left text-alert font-bold">
                                <div className="flex items-center gap-3"><Trash2 size={20} /><span>アカウントを削除する</span></div>
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'map' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">行ったお店 ({visitedRestaurantIds.length})</h3>
                            {visitedRestaurantIds.length > 0 ? (
                                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                                    {visitedRestaurantIds.map((id) => {
                                        const rest = restaurants.find(r => r.id === id);
                                        return (
                                            <div key={id} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none">
                                                <Link href={`/map/${id}`} className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-sm line-clamp-1">{rest?.name || '読み込み中...'}</span>
                                                        <span className="text-[10px] text-slate-400">来店済み</span>
                                                    </div>
                                                </Link>
                                                <button onClick={(e) => { e.preventDefault(); toggleUserRestaurant(id, 'visited'); }} className="text-xs bg-slate-50 text-slate-400 px-3 py-1 rounded-full font-bold ml-2">削除</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-[24px] p-8 text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">記録がありません</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-sub mb-3 ml-2">行きたいお店 ({wishlistRestaurantIds.length})</h3>
                            {wishlistRestaurantIds.length > 0 ? (
                                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                                    {wishlistRestaurantIds.map((id) => {
                                        const rest = restaurants.find(r => r.id === id);
                                        return (
                                            <div key={id} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-none">
                                                <Link href={`/map/${id}`} className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                                                        <Star size={20} fill="currentColor" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-sm line-clamp-1">{rest?.name || '読み込み中...'}</span>
                                                        <span className="text-[10px] text-blue-400">保存済み</span>
                                                    </div>
                                                </Link>
                                                <button onClick={(e) => { e.preventDefault(); toggleUserRestaurant(id, 'wishlist'); }} className="text-xs bg-slate-50 text-slate-400 px-3 py-1 rounded-full font-bold ml-2">削除</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-[24px] p-8 text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">保存がありません</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'recipes' && (
                    <div className="bg-white rounded-[32px] p-10 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400"><FileText size={32} /></div>
                        <h4 className="font-bold text-slate-800 mb-2">投稿・お気に入りレシピ</h4>
                        <p className="text-sm text-slate-500 mb-6">まだレシピがありません</p>
                        <Link href="/" className="inline-block py-3 px-8 bg-primary text-white rounded-full font-bold text-sm shadow-md active:scale-95">レシピを探す</Link>
                    </div>
                )}
            </div>

            {/* Child Modal */}
            {showChildModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeChildModal}>
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-6">{editingChild ? 'お子様情報を編集' : 'お子様を追加'}</h3>
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => childFileInputRef.current?.click()}>
                                    {childPhotoFile ? <img src={URL.createObjectURL(childPhotoFile)} className="w-full h-full object-cover" /> : childPhoto ? <img src={childPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-400" size={32} />}
                                </div>
                                <input type="file" ref={childFileInputRef} className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0]) setChildPhotoFile(e.target.files[0]); }} />
                                <IconPicker selected={childIcon} onChange={icon => { setChildIcon(icon); setChildPhoto(null); setChildPhotoFile(null); }} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-text-sub mb-2 block">お名前</label>
                                <Input type="text" value={childName} onChange={e => setChildName(e.target.value)} placeholder="たろう" className={formErrors.name ? 'border-rose-500' : ''} />
                                {formErrors.name && <p className="text-rose-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-text-sub mb-2 block">アレルギー</label>
                                <AllergySelector selected={childAllergens} onChange={setChildAllergens} />
                                {formErrors.allergens && <p className="text-rose-500 text-xs mt-1">{formErrors.allergens}</p>}
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            {editingChild && <button onClick={() => { if (confirm('削除しますか？')) { deleteChild(editingChild.id); closeChildModal(); } }} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-50"><Trash2 size={20} className="text-rose-500" /></button>}
                            <Button onClick={handleSaveChild} className="flex-1">{editingChild ? '保存する' : '追加する'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements Modal */}
            {showAnnouncementsModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAnnouncementsModal(false)}>
                    <div className="bg-white w-full max-w-md max-h-[85vh] rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">お知らせ</h3>
                            <button onClick={() => setShowAnnouncementsModal(false)} className="text-slate-400 text-xl">×</button>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                            {['roadmap', 'updates', 'news'].map(t => (
                                <button key={t} onClick={() => setAnnouncementTab(t)} className={`flex-1 py-2 text-xs font-bold rounded-xl ${announcementTab === t ? 'bg-white shadow-sm text-primary' : 'text-text-sub'}`}>
                                    {t === 'roadmap' ? '予定' : t === 'updates' ? '履歴' : '全体'}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl font-bold text-sm">✨ 新機能：マップ記録が追加されました！</div>
                            <p className="text-xs text-slate-500 leading-relaxed">これまでの改善履歴やお知らせは順次更新予定です。</p>
                        </div>
                        <Button onClick={() => setShowAnnouncementsModal(false)} className="mt-4">閉じる</Button>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFAQModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFAQModal(false)}>
                    <div className="bg-white w-full max-w-md max-h-[80vh] rounded-[32px] p-6 shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">よくある質問</h3>
                            <button onClick={() => setShowFAQModal(false)} className="text-slate-400">×</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { q: 'お店の保存方法は？', a: 'マップの店舗詳細ページにある「保存」ボタンをタップしてください。' },
                                { q: '行ったお店の記録はどうやる？', a: 'お店のメニュー詳細ページの「来店済み」にチェックを入れると記録されます。' }
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="font-bold text-sm text-slate-700 mb-2">Q. {item.q}</p>
                                    <p className="text-xs text-slate-500">A. {item.a}</p>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setShowFAQModal(false)} className="mt-8 w-full">閉じる</Button>
                    </div>
                </div>
            )}

            {/* Inquiry Modal */}
            {showInquiryModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)}>
                    <div className="bg-white w-full max-w-xs rounded-[32px] p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-6">お問い合わせ</h3>
                        <div className="space-y-4">
                            <a href="https://line.me/R/ti/p/@668fqaht" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold">
                                <MessageCircle size={20} /> LINEで相談
                            </a>
                            <a href="mailto:support@anshinrecipe.com" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold">
                                <Mail size={20} /> メールを送る
                            </a>
                        </div>
                        <button onClick={() => setShowInquiryModal(false)} className="mt-6 text-sm font-bold text-slate-400">閉じる</button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
