'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon, Search, Check, X, ImagePlus, Save } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import { MEAL_SCENES } from '@/lib/constants';
import './AddRecipePage.css'; // Reuse existing styles or create RecipeForm.css

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

    const ALLERGEN_OPTIONS = ['卵', '乳', '小麦', 'えび', 'かに', 'そば', '落花生'];

    // Auto-calculate allergens from selected children
    useEffect(() => {
        if (!isEditMode && selectedChildren.length > 0 && profile?.children) {
            // Only runs if user hasn't manually modified yet? 
            // For MVP simplicity: If freeFromAllergens is empty, auto-fill.
            if (freeFromAllergens.length === 0) {
                const selectedKids = profile.children.filter(c => selectedChildren.includes(c.id));
                const allergensSet = new Set();
                selectedKids.forEach(kid => {
                    kid.allergens?.forEach(a => allergensSet.add(a));
                });
                if (allergensSet.size > 0) {
                    setFreeFromAllergens(Array.from(allergensSet));
                }
            }
        }
    }, [selectedChildren, isEditMode, profile]);

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
            alert('レシピ情報の取得に失敗しました。URLを確認してください。');
        } finally {
            setIsFetchingOgp(false);
        }
    };

    const toggleChild = (childId) => {
        const isSelected = selectedChildren.includes(childId);
        let newSelected = isSelected
            ? selectedChildren.filter(id => id !== childId)
            : [...selectedChildren, childId];

        setSelectedChildren(newSelected);

        // Auto-add allergens for newly selected child
        if (!isSelected && profile?.children) {
            const child = profile.children.find(c => c.id === childId);
            if (child && child.allergens) {
                // Add new allergens to existing list
                const newAllergens = new Set([...freeFromAllergens, ...child.allergens]);
                setFreeFromAllergens(Array.from(newAllergens));
            }
        }
    };

    const toggleAllergen = (allergen) => {
        setFreeFromAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
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
                positiveIngredients: [] // Legacy/Future support
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
            {/* URL Input Section - Priority #1 */}
            <div className="form-section url-section">
                <label className="section-label">
                    レシピURL
                </label>
                <p className="section-help">レシピのURLを入力してください</p>

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
                            placeholder="https://cookpad.com/..."
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
                                <span>取得中...</span>
                            </>
                        ) : ogpFetched ? (
                            <>
                                <Check size={18} />
                                <span>取得済み</span>
                            </>
                        ) : (
                            <>
                                <Search size={18} />
                                <span>情報を取得</span>
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
                    <p className="field-hint">OGP取得後も自由に編集できます</p>
                </div>

                {/* Image Section - Always visible */}
                <div className="form-group">
                    <label>レシピ画像</label>
                    {image ? (
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
                            <p className="field-hint">※OGP取得で自動入力された画像もこちらで変更できます</p>
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
                        どのお子さまのためのレシピか選択してください <span className="required">*</span>
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
                                <div className="child-select-info">
                                    <span className="child-select-name">{child.name}</span>
                                    {child.allergens && child.allergens.length > 0 && (
                                        <span className="child-select-allergens">
                                            {child.allergens.slice(0, 3).join(', ')}
                                            {child.allergens.length > 3 && '...'}
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
            </div>
    )
}

{/* Allergen Selection (Transparency) */ }
<div className="form-section">
    <label className="section-label">
        除去アレルギー情報 (自動判定)
    </label>
    <p className="section-help">このレシピに含まれていない（除去されている）アレルギーを選択してください。<br />お子様を選択すると自動で追加されますが、手動で修正も可能です。</p>

    <div className="flex flex-wrap gap-2 mt-2">
        {ALLERGEN_OPTIONS.map(allergen => (
            <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`
                            px-4 py-2 rounded-full text-sm font-bold transition-all border
                            ${freeFromAllergens.includes(allergen)
                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'
                    }
                        `}
            >
                {allergen}なし
                {freeFromAllergens.includes(allergen) && <Check size={14} className="ml-1 inline" />}
            </button>
        ))}
    </div>
    {(freeFromAllergens.length === 0 && selectedChildren.length > 0) && (
        <p className="text-xs text-orange-500 mt-2">
            ※注意: アレルギー除去情報が設定されていません。本当にアレルギー物質を含まないか確認してください。
        </p>
    )}
</div>

{/* Meal Scenes */ }
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
                {scene}
            </button>
        ))}

        {/* Display custom scenes as chips */}
        {selectedScenes.filter(scene => !MEAL_SCENES.includes(scene)).map(scene => (
            <span key={scene} className="scene-chip selected custom-scene">
                {scene}
                <button type="button" onClick={() => removeScene(scene)} className="remove-scene-btn">
                    <X size={14} />
                </button>
            </span>
        ))}
    </div>

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
</div>

{/* Memo */ }
<div className="form-section">
    <label className="section-label">メモ</label>
    <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="レシピの特徴や工夫した点など、自由にメモできます"
        className="form-textarea"
        rows={4}
    />
</div>

{/* Tags */ }
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
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>{isEditMode ? '変更を保存' : 'レシピを保存'}</span>
        </button>
    </form >
);
};
