import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/Toast';
import { Search, Image as ImageIcon, X, Check } from 'lucide-react';
import './AddRecipePage.css';

const SCENES = ['おかず', 'お弁当', 'おやつ', 'イベント', 'その他'];

const AddRecipePage = () => {
    const navigate = useNavigate();
    const { addRecipe } = useRecipes();
    const { profile } = useProfile();
    const { addToast } = useToast();

    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [memo, setMemo] = useState('');
    const [selectedScene, setSelectedScene] = useState('');
    const [targetChildren, setTargetChildren] = useState([]);

    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState('');

    const handleUrlBlur = async () => {
        if (!url || !url.startsWith('http')) return;

        setIsFetching(true);
        setFetchError('');

        try {
            const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.status === 'success') {
                const { title: fetchedTitle, image: fetchedImage } = data.data;
                if (fetchedTitle && !title) setTitle(fetchedTitle);
                if (fetchedImage?.url && !image) setImage(fetchedImage.url);
            } else {
                setFetchError('情報の取得に失敗しました');
            }
        } catch (error) {
            console.error('Error fetching OGP:', error);
            setFetchError('通信エラーが発生しました');
        } finally {
            setIsFetching(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('ファイルサイズは2MB以下にしてください');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleChild = (childId) => {
        setTargetChildren(prev =>
            prev.includes(childId)
                ? prev.filter(id => id !== childId)
                : [...prev, childId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            alert('レシピ名を入力してください');
            return;
        }

        const recipe = {
            id: Date.now().toString(),
            title,
            image: image || 'https://placehold.co/600x400?text=No+Image',
            sourceUrl: url,
            description: memo,
            tags: selectedScene ? [selectedScene] : [],
            targetChildren,
            createdAt: new Date().toISOString(),
        };

        addRecipe(recipe);
        addToast('レシピを保存しました！');
        navigate('/');
    };

    return (
        <div className="container add-recipe-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="close-button">
                    <X size={24} />
                </button>
                <h1 className="page-title">レシピ登録</h1>
                <div className="w-8"></div> {/* Spacer for centering */}
            </div>

            <form onSubmit={handleSubmit} className="recipe-form">
                {/* URL Input */}
                <div className="form-group">
                    <label className="form-label-sm">URL (画像は自動で探します)</label>
                    <input
                        type="url"
                        className="form-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onBlur={handleUrlBlur}
                        placeholder="https://..."
                    />
                    {isFetching && <p className="status-text">情報を取得中...</p>}
                    {fetchError && <p className="error-text">{fetchError}</p>}
                </div>

                {/* Recipe Name */}
                <div className="form-group">
                    <label className="form-label-sm">レシピ名 <span className="required">*</span></label>
                    <input
                        type="text"
                        className="form-input-lg"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例: 米粉のパンケーキ"
                        required
                    />
                </div>

                {/* Photo Area */}
                <div className="form-group">
                    <label className="form-label-sm">写真</label>
                    <div className="photo-upload-area">
                        {image ? (
                            <div className="image-preview-wrapper">
                                <img src={image} alt="Preview" className="image-preview" />
                                <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => setImage('')}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="upload-placeholder">
                                <div className="icon-circle">
                                    <ImageIcon size={24} color="#94A3B8" />
                                </div>
                                <span className="upload-text">写真をのせる</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Scene Selection */}
                <div className="form-group">
                    <label className="form-label-sm">シーン (任意)</label>
                    <div className="scene-chips">
                        {SCENES.map(scene => (
                            <button
                                key={scene}
                                type="button"
                                className={`scene-chip ${selectedScene === scene ? 'active' : ''}`}
                                onClick={() => setSelectedScene(scene === selectedScene ? '' : scene)}
                            >
                                {scene}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Children */}
                <div className="form-group">
                    <label className="form-label-sm">だれのためのレシピ？</label>
                    <div className="child-selector-container">
                        {profile.children.length > 0 ? (
                            <div className="child-toggles">
                                {profile.children.map(child => (
                                    <button
                                        key={child.id}
                                        type="button"
                                        className={`child-toggle ${targetChildren.includes(child.id) ? 'active' : ''}`}
                                        onClick={() => toggleChild(child.id)}
                                    >
                                        <div className="child-toggle-avatar">
                                            {child.photo ? (
                                                <img src={child.photo} alt={child.name} />
                                            ) : (
                                                <span>👶</span>
                                            )}
                                            {targetChildren.includes(child.id) && (
                                                <div className="check-badge"><Check size={10} /></div>
                                            )}
                                        </div>
                                        <span className="child-toggle-name">{child.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sub text-sm">お子様が登録されていません</p>
                        )}
                    </div>
                </div>

                {/* Memo */}
                <div className="form-group">
                    <label className="form-label-sm">メモ</label>
                    <textarea
                        className="form-textarea"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="材料や作り方のメモ..."
                        rows={4}
                    />
                </div>

                {/* Submit Button */}
                <div className="form-footer">
                    <button type="submit" className="btn btn-primary btn-block btn-lg">
                        <span className="icon-save">💾</span> 保存する
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddRecipePage;
