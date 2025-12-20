'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon, Search, Check, X, ImagePlus, Save, Globe, Lock } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import { MEAL_SCENES, SCENE_ICONS } from '@/lib/constants';
import './RecipeForm.css';

export const RecipeForm = ({
    initialData = {},
    onSubmit,
    user,
    profile,
    isEditMode = false
}) => {
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

    // ALLERGEN_OPTIONS moved to useMemo for filtering based on selected children

    // ... (auto-calculate allergens, etc.)

    // Handle paste in memo area
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

    // UI state

    // Auto-calculate allergens from selected children
    useEffect(() => {
        if (!isEditMode && selectedChildren.length > 0 && profile?.children) {
            const selectedKids = profile.children.filter(c => selectedChildren.includes(c.id));
            const allergensSet = new Set();
            selectedKids.forEach(kid => {
                kid.allergens?.forEach(a => allergensSet.add(a));
            });
            // ユーザーが手動で削った分を尊重しつつ、選択中の子供たちの全アレルゲンを表示
            // ただし、初期状態や子供の変更時に連動させる
            setFreeFromAllergens(Array.from(allergensSet));
        } else if (!isEditMode && selectedChildren.length === 0) {
            setFreeFromAllergens([]);
        }
    }, [selectedChildren, isEditMode, profile?.children]);

    // UI state
    const [isFetchingOgp, setIsFetchingOgp] = useState(false);
    const [ogpFetched, setOgpFetched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Auto-select child if only one exists (only in create mode)
    useEffect(() => {
        if (!isEditMode && profile?.children?.length === 1 && selectedChildren.length === 0) {
            setSelectedChildren([profile.children[0].id]);
        }
    }, [profile, selectedChildren.length, isEditMode]);

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

            // Auto-fill title and image if not already set (or confirm overwrite?)
            // For now, simple overwrite logic as per original
            if (data.title) setTitle(data.title);
            if (data.image) setImage(data.image);
            if (data.description) setDescription(data.description);

            setOgpFetched(true);
        } catch (error) {
            console.error('OGP fetch error:', error);
            // Don't alert on auto-fetch failure to avoid annoying user if URL is just text
            if (!isSubmitting) {
                // Silent fail or optional UI indication? 
                // Keeping alert for manual trigger, but maybe suppress for auto?
                // For now, we'll keep it simple. If it was triggered automatically, maybe we shouldn't alert?
                // But we can't easily distinguish here without passing a flag.
                // Let's assume manual click for now for the alert, 
                // but for auto-fetch, users might be confused if nothing happens and error pops up.
                // Let's rely on standard error handling.
            }
        } finally {
            setIsFetchingOgp(false);
        }
    };

    // Auto-fetch OGP on mount if URL is provided via Share Target (and no image yet)
    useEffect(() => {
        if (initialData.sourceUrl && !initialData.image) {
            fetchOgpData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleChild = (childId) => {
        const isSelected = selectedChildren.includes(childId);
        let newSelected = isSelected
            ? selectedChildren.filter(id => id !== childId)
            : [...selectedChildren, childId];

        setSelectedChildren(newSelected);

        // Auto-add allergens for newly selected child
        if (!isSelected && profile?.children) {
            // アレルゲンの自動追加ロジックはuseEffectで行うため、ここでは何もしない
        }
    };

    const toggleAllergen = (allergen) => {
        setFreeFromAllergens(prev => {
            if (prev.includes(allergen)) {
                return prev.filter(a => a !== allergen);
            }
            // Manual addition is disabled
            return prev;
        });
    };

    const toggleScene = (scene) => {
        setSelectedScenes(prev =>
            prev.includes(scene)
                ? prev.filter(s => s !== scene)
                : [...prev, scene]
        );
    };

    const addCustomScene = () => {
        if (customScene.trim() && !selectedScenes.includes(customScene.trim())) {
            setSelectedScenes([...selectedScenes, customScene.trim()]);
            setCustomScene('');
        }
    };

    const removeScene = (sceneToRemove) => {
        setSelectedScenes(selectedScenes.filter(scene => scene !== sceneToRemove));
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
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

        if (!title.trim()) {
            alert('レシピ名は必須です');
            return;
        }

        if (isPublic === null) {
            alert('公開設定を選択してください');
            return;
        }

        if (!image) {
            alert('レシピ画像を登録してください');
            return;
        }

        if (selectedChildren.length === 0) {
            alert('お子様を選択してください');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = {
                title,
                description,
                image,
                sourceUrl,
                childIds: selectedChildren,
                scenes: selectedScenes,
                memo,
                tags,
                freeFromAllergens: freeFromAllergens,
                isPublic,
                positiveIngredients: [], // Legacy/Future support
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
            if (title || image || description) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [title, image, description]);

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            {/* OGP Loading Overlay */}
            {isFetchingOgp && (
                <div className="ogp-loading-overlay">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">URLから情報を取得しています...</span>
                </div>
            )}

            {/* URL Input Section - Priority #1 */}
            <div className="form-section url-section" id="recipe-form-url-input">
                <label className="section-label">
                    レシピURL / SNSリンク
                </label>
                <p className="section-help">Webサイト、TikTok、Instagramなどのリンクを入力してください</p>

                <div className="url-input-group">
                    <div className="input-with-icon">
                        <LinkIcon size={20} />
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => {
                                setSourceUrl(e.target.value);
                                setOgpFetched(false);
                            }}
                            placeholder="https://cookpad.com/..., https://www.instagram.com/..."
                            className="form-input"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={fetchOgpData}
                        disabled={!sourceUrl.trim() || isFetchingOgp}
                        className="fetch-ogp-btn"
                    >
                        {isFetchingOgp ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span className="hidden sm:inline">取得中...</span>
                            </>
                        ) : ogpFetched ? (
                            <>
                                <Check size={18} />
                                <span className="hidden sm:inline">取得済み</span>
                            </>
                        ) : (
                            <>
                                <Search size={18} />
                                <span className="hidden sm:inline">情報を読み取る</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Basic Info Section */}
            <div className="form-section">
                <div className="form-group">
                    <label>レシピ名 <span className="required">*</span></label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例: 米粉のパンケーキ"
                        required
                        className="form-input"
                    />
                </div>

                {/* Image Section - Always visible */}
                <div className="form-group" id="recipe-form-image-area">
                    <label>レシピ画像 <span className="required">*</span></label>
                    {isFetchingOgp ? (
                        <div className="image-upload-area loading">
                            <Loader2 className="animate-spin upload-icon" />
                            <span className="upload-text">画像を取得中...</span>
                        </div>
                    ) : image ? (
                        <div className="image-preview-container">
                            <div className="image-preview">
                                <img src={image} alt="Recipe" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                            <div className="image-actions">
                                <button
                                    type="button"
                                    onClick={triggerFileUpload}
                                    className="change-image-btn"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'アップロード中...' : '画像を差し替え'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImage('')}
                                    className="remove-image-btn"
                                    disabled={isUploading}
                                >
                                    画像を削除
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="image-upload-area"
                            onClick={triggerFileUpload}
                        >
                            {isUploading ? (
                                <Loader2 className="animate-spin upload-icon" />
                            ) : (
                                <ImagePlus className="upload-icon" />
                            )}
                            <span className="upload-text">
                                {isUploading ? 'アップロード中...' : '画像をアップロード'}
                            </span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden-input"
                    />
                </div>
            </div>

            {/* Children Selection */}
            {profile?.children && profile.children.length > 0 && (
                <div className="form-section">
                    <label className="section-label">
                        どのお子さまのためのレシピですか？ <span className="required">*</span>
                    </label>
                    <p className="section-help">複数選択可</p>

                    <div className="children-selection">
                        {profile.children.map(child => (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() => toggleChild(child.id)}
                                className={`child-select-card ${selectedChildren.includes(child.id) ? 'selected' : ''}`}
                            >
                                <div className="child-select-icon">
                                    {child.photo ? (
                                        <img src={child.photo} alt={child.name} />
                                    ) : (
                                        <span>{child.icon}</span>
                                    )}
                                </div>
                                <div className="child-select-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                                    <span className="child-select-name" style={{ fontWeight: 'bold' }}>{child.name}</span>
                                    {child.allergens && child.allergens.length > 0 && (
                                        <span className="child-select-allergens" style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {child.allergens.join('・')}
                                        </span>
                                    )}
                                </div>
                                {selectedChildren.includes(child.id) && (
                                    <Check size={20} className="check-icon" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Allergen Selection (Transparency) - Only show if children have allergens */}
            <div className="form-section">
                <label className="section-label">
                    使われていない材料
                </label>
                <p className="section-help">お子様のアレルギー情報から自動判定されます。不要な場合はタップして削除してください。</p>

                <div className="flex flex-wrap gap-2 mt-2">
                    {freeFromAllergens.map(allergen => (
                        <button
                            key={allergen}
                            type="button"
                            onClick={() => toggleAllergen(allergen)}
                            className="px-4 py-2 rounded-full text-sm font-bold transition-all border bg-green-500 text-white border-green-500 shadow-md hover:bg-green-600"
                        >
                            {allergen}なし
                            <Check size={14} className="ml-1 inline" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Meal Scenes */}
            <div className="form-section">
                <label className="section-label">おすすめシーン</label>
                <p className="section-help">このレシピに合うシーンを選択してください (複数選択可)</p>

                <div className="scene-selection">
                    {MEAL_SCENES.map(scene => (
                        <button
                            type="button"
                            key={scene}
                            onClick={() => toggleScene(scene)}
                            className={`scene-chip ${selectedScenes.includes(scene) ? 'selected' : ''}`}
                        >
                            <span className="mr-1">{SCENE_ICONS[scene] || '🍽️'}</span>
                            {scene}
                        </button>
                    ))
                    }

                    {/* Display custom scenes as chips */}
                    {
                        selectedScenes.filter(scene => !MEAL_SCENES.includes(scene)).map(scene => (
                            <span key={scene} className="scene-chip selected custom-scene">
                                {scene}
                                <button type="button" onClick={() => removeScene(scene)} className="remove-scene-btn">
                                    <X size={14} />
                                </button>
                            </span>
                        ))
                    }
                </div >

                <div className="custom-scene-input">
                    <input
                        type="text"
                        value={customScene}
                        onChange={(e) => setCustomScene(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomScene())}
                        placeholder="その他のシーンを入力"
                        className="form-input"
                    />
                    <button type="button" onClick={addCustomScene} className="add-btn">
                        追加
                    </button>
                </div>
            </div >

            {/* Memo */}
            <div className="form-section">
                <label className="section-label">おすすめポイント</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="このレシピのおすすめポイントを書きましょう"
                    className="form-textarea"
                    rows={4}
                />
            </div >

            {/* Tags */}
            <div className="form-section">
                <label className="section-label">タグ</label>
                <p className="section-help">その他、このレシピの特徴をメモしましょう</p>
                <div className="tags-container">
                    <div className="tags-list">
                        {tags.map(tag => (
                            <span key={tag} className="tag-chip">
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                            </span>
                        ))}
                    </div>
                    <div className="tag-input-wrapper">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                            placeholder="例: 時短、簡単、栄養満点"
                            className="form-input"
                        />
                        <button type="button" onClick={handleAddTag} className="add-btn">
                            追加
                        </button>
                    </div>
                </div>
            </div >

            {/* Public/Private Setting */}
            <div className="form-section">
                <label className="section-label">公開設定 <span className="required">*</span></label>
                <div className="flex gap-4 mt-2">
                    <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${isPublic === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'}`}
                    >
                        <Globe size={24} />
                        <span className="font-bold">公開</span>
                        <span className="text-xs">みんなにレシピを共有します</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${isPublic === false ? 'border-slate-500 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-400'}`}
                    >
                        <Lock size={24} />
                        <span className="font-bold">非公開</span>
                        <span className="text-xs">自分だけが見られます</span>
                    </button>
                </div>
            </div >

            <div className="floating-save-container">
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                    <span>{isEditMode ? '変更を保存' : 'レシピを保存'}</span>
                </button>
            </div>
        </form >
    );
};
