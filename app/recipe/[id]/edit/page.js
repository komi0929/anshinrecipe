'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft, Save, Loader2, Link as LinkIcon, Search, Check, X, ImagePlus, Upload } from 'lucide-react';
import Link from 'next/link';
import { uploadImage } from '@/lib/imageUpload';
import { MEAL_SCENES } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';

const EditRecipePage = () => {
    const router = useRouter();
    const { id } = useParams();
    const { updateRecipe } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();

    // Form state
    const [sourceUrl, setSourceUrl] = useState('');
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [selectedScenes, setSelectedScenes] = useState([]);
    const [customScene, setCustomScene] = useState('');
    const [memo, setMemo] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingOgp, setIsFetchingOgp] = useState(false);
    const [ogpFetched, setOgpFetched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login');
        }
    }, [user, profileLoading, router]);

    // Fetch existing recipe data
    useEffect(() => {
        const fetchRecipe = async () => {
            if (!id || !user) return;

            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Verify ownership
                if (data.user_id !== user.id) {
                    alert('編集権限がありません');
                    router.push(`/recipe/${id}`);
                    return;
                }

                // Populate form
                setTitle(data.title || '');
                setSourceUrl(data.source_url || '');
                setImage(data.image_url || '');
                setDescription(data.description || '');
                setSelectedChildren(data.child_ids || []);
                setSelectedScenes(data.scenes || []);
                setMemo(data.memo || '');
                setTags(data.tags || []);

            } catch (error) {
                console.error('Error fetching recipe:', error);
                alert('レシピの読み込みに失敗しました');
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipe();
    }, [id, user, router]);

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

            // Only overwrite if currently empty or user confirms? 
            // For now, let's only overwrite if empty to be safe
            if (data.title && !title) setTitle(data.title);
            if (data.image && !image) setImage(data.image);
            if (data.description && !description) setDescription(data.description);

            setOgpFetched(true);
        } catch (error) {
            console.error('OGP fetch error:', error);
            alert('レシピ情報の取得に失敗しました。URLを確認してください。');
        } finally {
            setIsFetchingOgp(false);
        }
    };

    const toggleChild = (childId) => {
        setSelectedChildren(prev =>
            prev.includes(childId)
                ? prev.filter(id => id !== childId)
                : [...prev, childId]
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
            await updateRecipe(id, {
                title,
                description,
                image,
                sourceUrl,
                childIds: selectedChildren,
                scenes: selectedScenes,
                memo,
                tags
            });
            router.push(`/recipe/${id}`);
        } catch (error) {
            console.error('Failed to update recipe', error);
            alert('レシピの更新に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (profileLoading || isLoading) return <div className="loading-spinner">読み込み中...</div>;
    if (!user) return null;

    return (
        <div className="container add-recipe-page">
            <div className="page-header">
                <Link href={`/recipe/${id}`} className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">レシピを編集</h1>
            </div>

            <form onSubmit={handleSubmit} className="recipe-form">
                {/* URL Input Section */}
                <div className="form-section url-section">
                    <label className="section-label">
                        レシピURL
                    </label>
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
                    </div>

                    {/* Image Section */}
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
                {profile.children && profile.children.length > 0 && (
                    <div className="form-section">
                        <label className="section-label">
                            どのお子さまのためのレシピか選択してください <span className="required">*</span>
                        </label>
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
                )}

                {/* Meal Scenes */}
                <div className="form-section">
                    <label className="section-label">おすすめシーン</label>
                    <div className="scene-selection">
                        {MEAL_SCENES.map(scene => (
                            <button
                                key={scene}
                                type="button"
                                onClick={() => toggleScene(scene)}
                                className={`scene-chip ${selectedScenes.includes(scene) ? 'selected' : ''}`}
                            >
                                {scene}
                            </button>
                        ))}
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

                {/* Memo */}
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

                {/* Tags */}
                <div className="form-section">
                    <label className="section-label">タグ</label>
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
                                placeholder="例: 時短"
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
                    <span>変更を保存</span>
                </button>
            </form>
        </div>
    );
};

export default EditRecipePage;
