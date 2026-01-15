'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Settings, FileText, HelpCircle, LogOut,
    Trash2, ChevronRight, Camera, Plus, MapPin,
    ShieldAlert, Info, Mail, Pencil, Loader2, Award, MessageCircle, Zap, Smartphone, Users, Star,
    Heart, Bookmark, Utensils
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Footer } from '@/components/Footer';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadImage } from '@/lib/imageUpload';
import AllergySelector from '@/components/AllergySelector';
import IconPicker from '@/components/IconPicker';
import { useMapData } from '@/hooks/useMapData';
import { BookmarkButton } from '@/components/social/BookmarkButton'; // Make sure this is imported if used (or we rely on raw logic)

export default function ProfilePage() {
    console.log('ProfilePage: Render Start');
    const {
        user, profile, loading,
        updateUserName, updateAvatar,
        addChild, updateChild, deleteChild,
        deleteAccount
    } = useProfile();

    const { restaurants } = useMapData();
    const router = useRouter();
    const fileInputRef = useRef(null);
    const childFileInputRef = useRef(null);

    // Unified Tab State: 'kitchen' (Recipe App) | 'map' (Eating Out App)
    const [appMode, setAppMode] = useState('kitchen');

    // Sub-tabs for Map
    const [mapTab, setMapTab] = useState('bookmarks'); // 'bookmarks' | 'visited' | 'likes'
    // Sub-tabs for Kitchen
    const [kitchenTab, setKitchenTab] = useState('my_recipes'); // 'my_recipes' | 'saved' | 'reports'

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    // Data State
    const [mapData, setMapData] = useState({ bookmarks: [], reviews: [], likes: [] });
    const [kitchenData, setKitchenData] = useState({ myRecipes: [], savedRecipes: [], reports: [] });
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Child Modal State
    const [showChildModal, setShowChildModal] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [childName, setChildName] = useState('');
    const [childIcon, setChildIcon] = useState('👶');
    const [childPhoto, setChildPhoto] = useState(null);
    const [childPhotoFile, setChildPhotoFile] = useState(null);
    const [childAllergens, setChildAllergens] = useState([]);
    const [formErrors, setFormErrors] = useState({});

    // Info Modals
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    // Fetch Data based on Mode
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                if (appMode === 'map') {
                    // Fetch Map Data
                    const [bookmarks, reviews, likes] = await Promise.all([
                        supabase.from('bookmarks').select('restaurant_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
                        supabase.from('reviews').select('*, restaurants(name), menus(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
                        supabase.from('review_likes').select('review_id, reviews(*, restaurants(name), menus(name))').eq('user_id', user.id)
                    ]);
                    setMapData({
                        bookmarks: bookmarks.data || [],
                        reviews: reviews.data || [],
                        likes: likes.data || []
                    });
                } else {
                    // Fetch Kitchen Data
                    const [myRecipes, saved, reports] = await Promise.all([
                        supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                        supabase.from('saved_recipes').select('*, recipes(*)').eq('user_id', user.id),
                        supabase.from('tried_reports').select('*, recipes(*)').eq('user_id', user.id).order('created_at', { ascending: false })
                    ]);
                    setKitchenData({
                        myRecipes: myRecipes.data || [],
                        savedRecipes: saved.data || [],
                        reports: reports.data || []
                    });
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [appMode, user]);

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

    // ... (Child handlers - kept same)
    const handleSaveChild = async () => { /* ... existing logic ... */
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
        /* ... existing logic ... */
        if (child) { setEditingChild(child); setChildName(child.name); setChildIcon(child.icon || '👶'); setChildPhoto(child.photo || null); setChildAllergens(child.allergens || []); }
        else { setEditingChild(null); setChildName(''); setChildIcon('👶'); setChildPhoto(null); setChildAllergens([]); }
        setChildPhotoFile(null); setShowChildModal(true);
    };

    const closeChildModal = () => { setShowChildModal(false); setEditingChild(null); setFormErrors({}); };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* 1. Unified Header (Account & Children) */}
            <div className="bg-white p-6 pb-2 rounded-b-[32px] shadow-sm z-10 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 border-2 border-white shadow-md relative">
                            {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-orange-300"><User size={32} /></div>}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名前" autoFocus className="h-8 text-sm" />
                                    <Button size="sm" onClick={handleUpdateName}>保存</Button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-800">{profile?.userName || 'ユーザー'}</h2>
                                        {profile?.isPro && <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">PRO</span>}
                                        <button onClick={() => { setNewName(profile?.userName || ''); setIsEditingName(true); }} className="p-1 text-slate-400 hover:text-orange-500 transition-colors"><Pencil size={14} /></button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{profile?.bio || '自己紹介がまだありません'}</p>
                                </div>
                            )}

                            {/* Stats & SNS */}
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1">
                                <div className="flex items-center gap-1">
                                    <Utensils size={12} className="text-orange-400" />
                                    <span>{profile?.stats?.recipeCount || 0} レシピ</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText size={12} className="text-green-400" />
                                    <span>{profile?.stats?.reportCount || 0} レポ</span>
                                </div>
                            </div>

                            {/* Children */}
                            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                                {profile?.children?.map(child => (
                                    <div key={child.id} onClick={() => openChildModal(child)} className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors shrink-0">
                                        <span className="text-xs">{child.icon}</span>
                                        <span className="text-xs font-bold text-orange-800">{child.name}</span>
                                    </div>
                                ))}
                                <button onClick={() => openChildModal(null)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 shrink-0"><Plus size={12} /></button>
                            </div>
                        </div>
                    </div>
                    <Link href="/settings" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><Settings size={20} /></Link>
                </div>

            </div>

            {/* 2. Action Menu (Restored) */}
            <div className="flex gap-3 px-2 mb-6 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setShowAnnouncementsModal(true)}
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 min-w-[140px] hover:bg-slate-50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <Info size={18} />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400">運営からの</div>
                        <div className="text-xs font-bold text-slate-700">お知らせ</div>
                    </div>
                </button>

                <Link
                    href="/shortcut-guide"
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 min-w-[140px] hover:bg-slate-50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                        <Zap size={18} />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400">アプリをもっと</div>
                        <div className="text-xs font-bold text-slate-700">便利な使い方</div>
                    </div>
                </Link>

                <button
                    onClick={() => setShowInquiryModal(true)}
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 min-w-[140px] hover:bg-slate-50 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                        <Mail size={18} />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400">困ったときは</div>
                        <div className="text-xs font-bold text-slate-700">お問い合わせ</div>
                    </div>
                </button>
            </div>

            {/* 3. App Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl relative mx-4">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${appMode === 'map' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'}`} />
                <button
                    onClick={() => setAppMode('kitchen')}
                    className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${appMode === 'kitchen' ? 'text-orange-600' : 'text-slate-400'}`}
                >
                    <Utensils size={18} /> マイキッチン
                </button>
                <button
                    onClick={() => setAppMode('map')}
                    className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${appMode === 'map' ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <MapPin size={18} /> マイマップ
                </button>
            </div>

            {/* 4. Content Area */}
            <div className="px-4 py-6">
                {appMode === 'map' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* MAP CONTENT */}
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-200 px-2">
                            {['bookmarks', 'reviews', 'likes'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setMapTab(tab)}
                                    className={`pb-2 text-sm font-bold border-b-2 transition-all px-2 ${mapTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}
                                >
                                    {tab === 'bookmarks' && '行きたい'}
                                    {tab === 'reviews' && '食べた！'}
                                    {tab === 'likes' && 'いいね'}
                                </button>
                            ))}
                        </div>

                        {isLoadingData ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-400" /></div>
                        ) : (
                            <div className="space-y-4">
                                {mapTab === 'bookmarks' && (
                                    mapData.bookmarks.length === 0 ? <EmptyState icon={<Bookmark size={48} />} text="行きたいお店を保存しましょう" color="blue" /> :
                                        mapData.bookmarks.map(b => {
                                            const r = restaurants.find(rest => rest.id === b.restaurant_id);
                                            return r ? <div key={b.restaurant_id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center" onClick={() => router.push(`/map/${r.id}`)}>
                                                <div className="font-bold text-slate-700">{r.name}</div>
                                                <ChevronRight size={16} className="text-slate-300" />
                                            </div> : null
                                        })
                                )}
                                {mapTab === 'reviews' && (
                                    mapData.reviews.length === 0 ? <EmptyState icon={<Camera size={48} />} text="食べたお店を記録しましょう" color="blue" /> :
                                        mapData.reviews.map(r => (
                                            <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm mb-3">
                                                <div className="text-sm font-bold text-slate-800">{r.restaurants?.name}</div>
                                                <div className="text-xs text-slate-500 mt-1">{r.menus?.name || 'メニュー記録なし'}</div>
                                                {r.comment && <div className="mt-2 text-sm bg-slate-50 p-2 rounded-lg">{r.comment}</div>}
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* KITCHEN CONTENT */}
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-200 px-2">
                            {['my_recipes', 'saved', 'reports'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setKitchenTab(tab)}
                                    className={`pb-2 text-sm font-bold border-b-2 transition-all px-2 ${kitchenTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400'}`}
                                >
                                    {tab === 'my_recipes' && 'レシピ'}
                                    {tab === 'saved' && '保存'}
                                    {tab === 'reports' && 'つくレポ'}
                                </button>
                            ))}
                        </div>

                        {isLoadingData ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-400" /></div>
                        ) : (
                            <div className="space-y-4">
                                {kitchenTab === 'my_recipes' && (
                                    kitchenData.myRecipes.length === 0 ?
                                        <div className="text-center py-8">
                                            <EmptyState icon={<Utensils size={48} />} text="レシピを投稿してみましょう" color="orange" />
                                            <Button className="mt-4 bg-orange-400 hover:bg-orange-500 text-white" onClick={() => router.push('/recipe/new')}>投稿する</Button>
                                        </div> :
                                        kitchenData.myRecipes.map(r => (
                                            <div key={r.id} onClick={() => router.push(`/recipe/${r.id}`)} className="bg-white p-3 rounded-2xl shadow-sm flex gap-3 items-center cursor-pointer">
                                                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden relative shrink-0">
                                                    {r.image && <Image src={r.image} fill className="object-cover" alt={r.title} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 truncate">{r.title}</div>
                                                    <div className="text-xs text-slate-400 mt-1">❤ {r.likes_count || 0}</div>
                                                </div>
                                            </div>
                                        ))
                                )}
                                {kitchenTab === 'saved' && (
                                    kitchenData.savedRecipes.length === 0 ? <EmptyState icon={<Heart size={48} />} text="お気に入りのレシピを保存" color="orange" /> :
                                        kitchenData.savedRecipes.map(s => (
                                            <div key={s.id} onClick={() => router.push(`/recipe/${s.recipes?.id}`)} className="bg-white p-3 rounded-2xl shadow-sm flex gap-3 items-center cursor-pointer">
                                                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden relative shrink-0">
                                                    {s.recipes?.image && <Image src={s.recipes.image} fill className="object-cover" alt={s.recipes.title} />}
                                                </div>
                                                <div className="font-bold text-slate-800 truncate">{s.recipes?.title}</div>
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals placeholders */}
            {/* Keeping existing modals logic if needed */}
            {
                showChildModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-center">{editingChild ? 'お子様情報を編集' : 'お子様を追加'}</h3>

                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-4xl relative cursor-pointer" onClick={() => childFileInputRef.current?.click()}>
                                    {childPhoto ? <img src={childPhoto} className="w-full h-full rounded-full object-cover" /> : childIcon}
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-slate-100"><Camera size={16} className="text-orange-400" /></div>
                                </div>
                                <input type="file" ref={childFileInputRef} className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setChildPhotoFile(f); }} />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">お名前</label>
                                    <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="例: はなちゃん" className="bg-slate-50 border-none" />
                                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">アレルギー</label>
                                    <AllergySelector selectedAllergens={childAllergens} onChange={setChildAllergens} />
                                    {formErrors.allergens && <p className="text-red-500 text-xs mt-1">{formErrors.allergens}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button variant="ghost" className="flex-1" onClick={closeChildModal}>キャンセル</Button>
                                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSaveChild}>保存する</Button>
                            </div>
                            {editingChild && (
                                <button onClick={async () => { if (confirm('本当に削除しますか？')) { await deleteChild(editingChild.id); closeChildModal(); } }} className="w-full mt-4 text-xs text-red-400 py-2">このお子様を削除</button>
                            )}
                        </div>
                    </div>
                )
            }
            {/* Announcements Modal */}
            {
                showAnnouncementsModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAnnouncementsModal(false)}>
                        <div className="bg-white w-full max-w-md max-h-[85vh] rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">お知らせ</h3>
                                <button onClick={() => setShowAnnouncementsModal(false)} className="text-slate-400 text-xl">×</button>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl font-bold text-sm">✨ 新機能：活動記録が見られるようになりました！</div>
                            <Button onClick={() => setShowAnnouncementsModal(false)} className="mt-4">閉じる</Button>
                        </div>
                    </div>
                )
            }

            {
                showInquiryModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)}>
                        <div className="bg-white w-full max-w-xs rounded-[32px] p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold mb-6">お問い合わせ</h3>
                            <a href="mailto:support@anshinrecipe.com" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold"><Mail size={20} /> メール</a>
                            <button onClick={() => setShowInquiryModal(false)} className="mt-6 text-sm font-bold text-slate-400">閉じる</button>
                        </div>
                    </div>
                )
            }

            <Footer />
        </div >
    );
}

// Simple Empty State Component
const EmptyState = ({ icon, text, color }) => {
    // Tailwind needs full class names to be present in the source
    const colorStyles = {
        orange: {
            container: "text-orange-300 bg-orange-50/30 border-orange-100",
            text: "text-orange-400"
        },
        blue: {
            container: "text-blue-300 bg-blue-50/30 border-blue-100",
            text: "text-blue-400"
        }
    };

    const styles = colorStyles[color] || colorStyles.orange;

    return (
        <div className={`flex flex-col items-center justify-center py-12 rounded-3xl border-2 border-dashed ${styles.container}`}>
            <div className="mb-3 opacity-50">{icon}</div>
            <p className={`font-bold text-sm ${styles.text}`}>{text}</p>
        </div>
    );
};
