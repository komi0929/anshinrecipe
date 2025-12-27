'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon, Search, Check, X, ImagePlus, Save, Globe, Lock, Sparkles, BrainCircuit, AlertCircle } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import { MEAL_SCENES, SCENE_ICONS } from '@/lib/constants';
import { SmartEmbed } from '@/components/SmartEmbed'; // Import SmartEmbed
import SmartImportOverlay from './SmartImportOverlay'; // Import SmartImportOverlay
import YouTubeSearchOverlay from './YouTubeSearchOverlay'; // Import YouTubeSearchOverlay
import { Youtube } from 'lucide-react'; // Import Youtube icon
import { useAnalytics } from '@/hooks/useAnalytics';
import './RecipeForm.css';

export const RecipeForm = ({
    initialData = {},
    onSubmit,
    user,
    profile,
    isEditMode = false
}) => {
    // Analytics
    const { trackSmartImportStart, trackSmartImportSuccess, trackSmartImportFail, trackRecipeCreate } = useAnalytics();

    // Form state
    const [sourceUrl, setSourceUrl] = useState(initialData.sourceUrl || '');
    const [title, setTitle] = useState(initialData.title || '');
    const [image, setImage] = useState(initialData.image || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [selectedChildren, setSelectedChildren] = useState(initialData.childIds || []);
    const [selectedScenes, setSelectedScenes] = useState(initialData.scenes || []);
    const [customScene, setCustomScene] = useState('');
    const [memo, setMemo] = useState(initialData.memo || '');
    const [tags, setTags] = useState(initialData.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [freeFromAllergens, setFreeFromAllergens] = useState(initialData.freeFromAllergens || []);
    const [isPublic, setIsPublic] = useState(initialData.isPublic !== undefined ? initialData.isPublic : true);
    // New: Smart Canvas (Memo Images)
    const [memoImages, setMemoImages] = useState(initialData.memoImages || []);

    // NEW FIELD: Ingredients and Steps (Merged text for display/edit)
    const [ingredientsAndSteps, setIngredientsAndSteps] = useState('');
    const [showIngredientsField, setShowIngredientsField] = useState(false); // Logic for visibility

    // UI state
    const [isFetchingOgp, setIsFetchingOgp] = useState(false);
    const [ogpFetched, setOgpFetched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Smart Import State
    const [isSmartImporting, setIsSmartImporting] = useState(false);
    const [smartImportError, setSmartImportError] = useState(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const originalSourceUrl = useRef(initialData.sourceUrl || ''); // Track original URL for edit mode

    // Auto-calculate allergens from selected children
    useEffect(() => {
        if (!isEditMode && selectedChildren.length > 0 && profile?.children) {
            const selectedKids = profile.children.filter(c => selectedChildren.includes(c.id));
            const allergensSet = new Set();
            selectedKids.forEach(kid => {
                kid.allergens?.forEach(a => allergensSet.add(a));
            });
            setFreeFromAllergens(Array.from(allergensSet));
        } else if (!isEditMode && selectedChildren.length === 0) {
            setFreeFromAllergens([]);
        }
    }, [selectedChildren, isEditMode, profile?.children]);

    // Auto-select child if only one exists (only in create mode)
    useEffect(() => {
        if (!isEditMode && profile?.children?.length === 1 && selectedChildren.length === 0) {
            setSelectedChildren([profile.children[0].id]);
        }
    }, [profile, selectedChildren.length, isEditMode]);

    // Handle OGP Fetch
    const fetchOgpData = async () => {
        if (!sourceUrl.trim()) return;

        setIsFetchingOgp(true);
        try {
            const response = await fetch('/api/ogp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sourceUrl })
            });

            if (!response.ok) throw new Error('Failed to fetch OGP data');

            const data = await response.json();

            // Auto-fill basic data for immediate feedback
            if (data.title && !title) setTitle(data.title);
            // Prefer max resolution thumbnail for YouTube
            if (data.image && !image) setImage(data.image);
            if (data.description && !description) setDescription(data.description);

            setOgpFetched(true);
        } catch (error) {
            console.error('OGP fetch error:', error);
        } finally {
            setIsFetchingOgp(false);
        }
    };

    // Handle Smart Import (AI Analysis) - Background Process & Auto Apply
    useEffect(() => {
        const fetchSmartImport = async () => {
            if (!sourceUrl.trim() || sourceUrl.length < 10) {
                setShowIngredientsField(false);
                return;
            }

            // Only convert valid URLs
            try {
                new URL(sourceUrl);
            } catch (e) {
                return;
            }

            // Skip re-analysis if in edit mode and URL hasn't changed
            if (isEditMode && sourceUrl === originalSourceUrl.current) {
                return;
            }

            // RESET FORM DATA ON NEW URL DETECTION
            // User requested: "When URL is pasted/changed, reset information immediately"
            setTitle(''); // Clear title
            setImage('');
            setDescription('');
            setTags([]); // Clear tags
            setIngredientsAndSteps(''); // Clear ingredients
            setIngredientsAndSteps(''); // Clear ingredients
            setShowIngredientsField(true); // Show field immediately with loading state

            // Start Overlay & Import Process
            setShowOverlay(true);
            setIsSmartImporting(true);
            setSmartImportError(null);
            setOgpFetched(false); // Reset OGP state

            try {
                // Track smart import start
                trackSmartImportStart(sourceUrl);

                // Trigger OGP fetch
                fetchOgpData();

                const response = await fetch('/api/smart-import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: sourceUrl })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}`);
                }

                const result = await response.json();
                console.log('Smart Import Result:', result);

                if (result.success && result.data) {
                    const d = result.data;

                    // --- AUTO APPLY LOGIC ---
                    if (d.title) setTitle(d.title);
                    if (d.image_url && (!image || image.includes('placeholder'))) setImage(d.image_url);
                    if (d.description) setDescription(d.description);

                    // Ingredients & Steps
                    const materialsText = d.ingredients && d.ingredients.length > 0 ? `【材料】\n${d.ingredients.map(i => `- ${i}`).join('\n')}` : '';
                    const stepsText = d.steps && d.steps.length > 0 ? `【作り方】\n${d.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '';
                    const contentToAdd = [materialsText, stepsText].filter(Boolean).join('\n\n');

                    if (contentToAdd) {
                        setIngredientsAndSteps(contentToAdd);
                        setShowIngredientsField(true);
                    } else {
                        setShowIngredientsField(false);
                    }

                    // Tags - FIX: Use functional update to ensure fresh state
                    if (d.tags && Array.isArray(d.tags) && d.tags.length > 0) {
                        setTags(prevTags => {
                            const uniqueTags = new Set(d.tags.map(t => t.replace(/^#/, '').trim()));
                            return Array.from(uniqueTags);
                        });
                    }

                    // Track success
                    trackSmartImportSuccess(sourceUrl, !!(d.ingredients && d.ingredients.length > 0));

                } else {
                    console.warn('Smart Import returned no data');
                    setSmartImportError('解析できましたが、有効な情報が見つかりませんでした');
                    trackSmartImportFail(sourceUrl, 'No valid data returned');
                }
            } catch (error) {
                console.error('Smart Import Error:', error);
                setSmartImportError(`うまく情報を取得できませんでした (${error.message})`);
                trackSmartImportFail(sourceUrl, error.message);
            } finally {
                setIsSmartImporting(false);
            }
        };

        const timer = setTimeout(() => {
            fetchSmartImport();
        }, 500); // 0.5s debounce - faster response

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceUrl]);

    // Handle Error State visibility logic
    useEffect(() => {
        if (smartImportError) {
            const hideTimer = setTimeout(() => {
                setShowIngredientsField(false);
                setSmartImportError(null);
            }, 5000);
            return () => clearTimeout(hideTimer);
        }
    }, [smartImportError]);


    // ... (keeping image upload handlers same)
    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                setIsUploading(true);
                const blob = items[i].getAsFile();
                try {
                    const publicUrl = await uploadImage(blob);
                    if (publicUrl) {
                        setMemoImages(prev => [...prev, { image_url: publicUrl, isNew: true }]);
                    }
                } catch (err) {
                    console.error('Paste upload failed', err);
                    alert('画像の貼り付けに失敗しました');
                } finally {
                    setIsUploading(false);
                }
            }
        }
    };

    const handleMemoImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadImage(file);
            if (publicUrl) {
                setMemoImages(prev => [...prev, { image_url: publicUrl, isNew: true }]);
            }
        } catch (error) {
            console.error('Image upload failed', error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setIsUploading(false);
        }
    };

    const removeMemoImage = (index) => {
        setMemoImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadImage(file);
            setImage(publicUrl);
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) { alert('レシピ名は必須です'); return; }
        if (isPublic === null) { alert('公開設定を選択してください'); return; }
        if (!image) { alert('レシピ画像を登録してください'); return; }
        if (selectedChildren.length === 0) { alert('お子様を選択してください'); return; }

        setIsSubmitting(true);
        try {
            let finalMemo = memo;
            if (ingredientsAndSteps && ingredientsAndSteps.trim() && showIngredientsField && !isSmartImporting) {
                finalMemo = memo ? `${memo}\n\n${ingredientsAndSteps}` : ingredientsAndSteps;
            }

            const formData = {
                title,
                description,
                image,
                sourceUrl,
                childIds: selectedChildren,
                scenes: selectedScenes,
                memo: finalMemo,
                tags,
                freeFromAllergens: freeFromAllergens,
                isPublic,
                positiveIngredients: [],
                memoImages: memoImages
            };

            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission failed', error);
            alert('保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Unsaved Changes Alert
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Skip warning if form is being submitted (navigating away after save)
            if (isSubmitting) return;
            if (title || image || description || ingredientsAndSteps) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [title, image, description, ingredientsAndSteps, isSubmitting]);

    // Tag handlers
    const handleAddTag = (e) => { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } };
    const removeTag = (tagToRemove) => { setTags(tags.filter(tag => tag !== tagToRemove)); };
    const toggleAllergen = (allergen) => { setFreeFromAllergens(prev => { if (prev.includes(allergen)) { return prev.filter(a => a !== allergen); } return prev; }); };
    const toggleChild = (childId) => { const isSelected = selectedChildren.includes(childId); let newSelected = isSelected ? selectedChildren.filter(id => id !== childId) : [...selectedChildren, childId]; setSelectedChildren(newSelected); };
    const toggleScene = (scene) => { setSelectedScenes(prev => prev.includes(scene) ? prev.filter(s => s !== scene) : [...prev, scene]); };
    const addCustomScene = () => { if (customScene.trim() && !selectedScenes.includes(customScene.trim())) { setSelectedScenes([...selectedScenes, customScene.trim()]); setCustomScene(''); } };
    const removeScene = (sceneToRemove) => { setSelectedScenes(selectedScenes.filter(scene => scene !== sceneToRemove)); };

    const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);

    // YouTube Selection Handler
    const handleYouTubeSelect = (videoData) => {
        // 1. Populate fields
        setSourceUrl(videoData.url); // This will trigger Smart Import automatically via useEffect
        setTitle(videoData.title);
        setImage(videoData.thumbnail);
        setDescription(videoData.description);

        // 2. Track analytics if needed
        // trackYouTubeSelect(videoData.id); (optional)

        // 3. Mark OGP as fetched so it doesn't try to overwrite everything (unless smart import does)
        setOgpFetched(true);
    };

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            {/* OGP Loading Overlay removed as per previous update */}

            {/* YouTube Search Button */}
            <div className="form-section pb-0 mb-0">
                <button
                    type="button"
                    onClick={() => setShowYouTubeSearch(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-1"
                >
                    <Youtube size={24} />
                    YouTubeから見つける
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                    お子様のアレルギーを考慮したレシピを検索できます
                </p>
            </div>

            {/* URL Input Section */}
            <div className="form-section url-section mt-4" id="recipe-form-url-input">
                <label className="section-label">レシピURL / SNSリンク</label>
                <div className="url-input-group">
                    <div className="input-with-icon">
                        <LinkIcon size={20} />
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => { setSourceUrl(e.target.value); setOgpFetched(false); }}
                            placeholder="https://cookpad.com/..., https://www.instagram.com/..."
                            className="form-input"
                        />
                    </div>
                </div>
            </div>

            {/* Smart Embed Preview (New Placement) */}
            {sourceUrl && (
                <div className="w-full max-w-md mx-auto">
                    <SmartEmbed url={sourceUrl} />
                </div>
            )}

            {/* Basic Info Section (Title & Image) */}
            <div className="form-section">
                <div className="form-group">
                    <label>レシピ名 <span className="required">*</span></label>
                    <div className="relative">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 米粉のパンケーキ" required className="form-input" />
                        {isFetchingOgp && <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-gray-400" />}
                    </div>
                </div>

                <div className="form-group" id="recipe-form-image-area">
                    <label>レシピ画像 <span className="required">*</span></label>
                    {isFetchingOgp ? (<div className="image-upload-area loading"> <Loader2 className="animate-spin upload-icon" /> <span className="upload-text">画像を取得中...</span> </div>) : image ? (<div className="image-preview-container"> <div className="image-preview"> <img src={image} alt="Recipe" onError={(e) => e.target.style.display = 'none'} /> </div> <div className="image-actions"> <button type="button" onClick={triggerFileUpload} className="change-image-btn" disabled={isUploading}> {isUploading ? 'アップロード中...' : '画像を差し替え'} </button> <button type="button" onClick={() => setImage('')} className="remove-image-btn" disabled={isUploading}> 画像を削除 </button> </div> </div>) : (<div className="image-upload-area" onClick={triggerFileUpload}> {isUploading ? (<Loader2 className="animate-spin upload-icon" />) : (<ImagePlus className="upload-icon" />)} <span className="upload-text"> {isUploading ? 'アップロード中...' : '画像をアップロード'} </span> </div>)}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden-input" />
                </div>
            </div>

            {/* NEW PLACEMENT: Ingredients & Steps (Automatic Field) - Below Image/Title */}
            {showIngredientsField && (
                <div className="form-section animate-fade-in-down">
                    <label className="section-label flex items-center gap-2">
                        {isSmartImporting ? <Loader2 size={16} className="animate-spin text-purple-500" /> : smartImportError ? <AlertCircle size={16} className="text-red-500" /> : <Sparkles size={16} className="text-purple-500" />}
                        {isSmartImporting ? 'AIが情報をまとめています...' : smartImportError ? '情報取得エラー' : '材料・つくり方 (AI自動入力)'}
                    </label>

                    {smartImportError ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100">
                            {smartImportError}
                            <br /><span className="text-xs font-normal">※この表示は数秒後に消えます</span>
                        </div>
                    ) : (
                        <textarea
                            value={ingredientsAndSteps || (isSmartImporting ? "AIがレシピ情報を解析中です..." : "")}
                            onChange={(e) => setIngredientsAndSteps(e.target.value)}
                            disabled={isSmartImporting}
                            className={`form-textarea transition-all duration-300 ${isSmartImporting ? 'bg-gray-50 text-gray-400' : 'bg-purple-50 border-purple-200 focus:border-purple-400'}`}
                            rows={isSmartImporting ? 4 : 15}
                            style={{ fontSize: '15px', lineHeight: '1.6' }}
                        />
                    )}
                </div>
            )}

            {/* Children Selection */}
            {profile?.children && profile.children.length > 0 && (
                <div className="form-section">
                    <label className="section-label">どのお子さまのためのレシピですか？ <span className="required">*</span></label>
                    <div className="children-selection"> {profile.children.map(child => (<button key={child.id} type="button" onClick={() => toggleChild(child.id)} className={`child-select-card ${selectedChildren.includes(child.id) ? 'selected' : ''}`} > <div className="child-select-icon"> {child.photo ? (<img src={child.photo} alt={child.name} />) : (<span>{child.icon}</span>)} </div> <div className="child-select-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}> <span className="child-select-name" style={{ fontWeight: 'bold' }}>{child.name}</span> {child.allergens && child.allergens.length > 0 && (<div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}> {child.allergens.map(a => (<span key={a} style={{ fontSize: '12px', padding: '2px 8px', background: '#fff7ed', color: '#ea580c', borderRadius: '9999px', fontWeight: 'bold', border: '1px solid #fed7aa' }}> {a}なし </span>))} </div>)} </div> {selectedChildren.includes(child.id) && (<Check size={20} className="check-icon" />)} </button>))} </div>
                </div>
            )}

            {/* Allergen Selection */}
            {profile?.children && profile.children.some(c => c.allergens?.length > 0) && (
                <div className="form-section">
                    <label className="section-label">使われていない材料</label>
                    <div className="flex flex-wrap gap-2 mt-2"> {freeFromAllergens.map(allergen => (<button key={allergen} type="button" onClick={() => toggleAllergen(allergen)} className="px-4 py-2 rounded-full text-sm font-bold transition-all border bg-green-500 text-white border-green-500 shadow-md hover:bg-green-600" > {allergen}なし <Check size={14} className="ml-1 inline" /> </button>))} </div>
                </div>
            )}

            {/* Meal Scenes */}
            <div className="form-section">
                <label className="section-label">おすすめシーン</label>
                <div className="scene-selection"> {MEAL_SCENES.map(scene => (<button type="button" key={scene} onClick={() => toggleScene(scene)} className={`scene-chip ${selectedScenes.includes(scene) ? 'selected' : ''}`} > <span className="mr-1">{SCENE_ICONS[scene] || '🍽️'}</span> {scene} </button>))} {selectedScenes.filter(scene => !MEAL_SCENES.includes(scene)).map(scene => (<span key={scene} className="scene-chip selected custom-scene"> {scene} <button type="button" onClick={() => removeScene(scene)} className="remove-scene-btn"> <X size={14} /> </button> </span>))} </div >
                <div className="custom-scene-input"> <input type="text" value={customScene} onChange={(e) => setCustomScene(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomScene())} placeholder="その他のシーンを入力" className="form-input" /> <button type="button" onClick={addCustomScene} className="add-btn"> 追加 </button> </div>
            </div >

            {/* Memo */}
            <div className="form-section">
                <label className="section-label">おすすめポイント・メモ</label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="【材料】や【作り方】など、メモしておきたいことを書きましょう" className="form-textarea" rows={8} />
            </div >

            {/* Tags */}
            <div className="form-section">
                <label className="section-label">タグ</label>
                <div className="tags-container"> <div className="tags-list"> {tags.map(tag => (<span key={tag} className="tag-chip"> #{tag} <button type="button" onClick={() => removeTag(tag)}>&times;</button> </span>))} </div> <div className="tag-input-wrapper"> <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)} placeholder="例: 時短、簡単、栄養満点" className="form-input" /> <button type="button" onClick={handleAddTag} className="add-btn"> 追加 </button> </div> </div>
            </div >

            {/* Public/Private Setting */}
            <div className="form-section">
                <label className="section-label">公開設定 <span className="required">*</span></label>
                <div className="flex gap-4 mt-2"> <button type="button" onClick={() => setIsPublic(true)} className={`flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${isPublic === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'}`} > <Globe size={24} /> <span className="font-bold">公開</span> <span className="text-xs">みんなにレシピを共有します</span> </button> <button type="button" onClick={() => setIsPublic(false)} className={`flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${isPublic === false ? 'border-slate-500 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-400'}`} > <Lock size={24} /> <span className="font-bold">非公開</span> <span className="text-xs">自分だけが見られます</span> </button> </div>
            </div >

            <div className="floating-save-container">
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                    <span>{isEditMode ? '変更を保存' : 'レシピを保存'}</span>
                </button>
            </div>

            {/* Smart Import Overlay */}
            <SmartImportOverlay
                isVisible={showOverlay}
                onRunning={isSmartImporting}
                onComplete={() => setShowOverlay(false)}
            />

            {/* YouTube Search Overlay */}
            <YouTubeSearchOverlay
                isOpen={showYouTubeSearch}
                onClose={() => setShowYouTubeSearch(false)}
                onSelectRecipe={handleYouTubeSelect}
                initialChildIds={selectedChildren}
            />
        </form >
    );
};
