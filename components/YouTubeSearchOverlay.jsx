import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Youtube, RefreshCw, Plus } from 'lucide-react';
import YouTubeRecipeCard from './YouTubeRecipeCard';
import ChildSelector from './ChildSelector';
import { useToast } from './Toast';
import { MEAL_SCENES, SCENE_ICONS } from '@/lib/constants';
import './YouTubeSearchOverlay.css';

// 特徴（タグ）の選択肢
const FEATURE_OPTIONS = [
    '簡単', '時短', '栄養満点', 'ヘルシー', '野菜たっぷり',
    '子供向け', '作り置き', '節約', 'お弁当向き'
];

const YouTubeSearchOverlay = ({
    isOpen,
    onClose,
    onSelectRecipe,
    initialChildIds = []
}) => {
    // Search State
    const [query, setQuery] = useState('');
    const [selectedScenes, setSelectedScenes] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeature, setCustomFeature] = useState('');
    const [selectedChildren, setSelectedChildren] = useState(initialChildIds);

    // Results State
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Confirmation Modal State
    const [confirmingVideo, setConfirmingVideo] = useState(null);

    // Validation State
    const [showValidation, setShowValidation] = useState(false);

    // UI State
    const { addToast } = useToast();

    // Sync child selection when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedChildren(initialChildIds);
            setShowValidation(false);
        }
    }, [isOpen, initialChildIds]);

    const toggleScene = (scene) => {
        setSelectedScenes(prev =>
            prev.includes(scene) ? prev.filter(s => s !== scene) : [...prev, scene]
        );
    };

    const toggleFeature = (feature) => {
        setSelectedFeatures(prev =>
            prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
        );
    };

    const addCustomFeature = () => {
        const trimmed = customFeature.trim();
        if (trimmed && !selectedFeatures.includes(trimmed)) {
            setSelectedFeatures(prev => [...prev, trimmed]);
            setCustomFeature('');
        }
    };

    const handleSearch = async (e) => {
        e?.preventDefault();

        // Validation: child selection and query are required
        if (selectedChildren.length === 0 || !query.trim()) {
            setShowValidation(true);
            if (selectedChildren.length === 0) {
                addToast('お子様を選択してください', 'error');
            } else {
                addToast('検索ワードを入力してください', 'error');
            }
            return;
        }

        setShowValidation(false);
        setIsSearching(true);
        setSearchPerformed(true);
        setResults([]);
        setError(null);
        setPageIndex(0);

        // Combine scenes and features into search context
        const sceneStr = selectedScenes.join(' ');
        const featureStr = selectedFeatures.join(' ');

        try {
            const response = await fetch('/api/youtube/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    childIds: selectedChildren,
                    scenes: selectedScenes,
                    features: selectedFeatures
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Search failed');
            }

            const data = await response.json();
            setResults(data.data || []);

            if (data.data?.length === 0) {
                addToast('条件に合う動画が見つかりませんでした', 'info');
            }
        } catch (error) {
            console.error('YouTube Search Error:', error);
            setError(error.message);
            addToast('検索に失敗しました', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleNextPage = () => {
        const nextIndex = pageIndex + 3;
        if (nextIndex < results.length) {
            setPageIndex(nextIndex);
        } else {
            setPageIndex(0);
            addToast('最初のおすすめに戻りました', 'info');
        }
    };

    const handleCardSelect = (video) => {
        // Pass selected metadata along with video - tags will auto-populate
        const enrichedVideo = {
            ...video,
            selectedScenes,
            selectedFeatures,
            autoTags: selectedFeatures // These will be used for tags in RecipeForm
        };
        setConfirmingVideo(enrichedVideo);
    };

    const handleConfirmAdd = () => {
        if (confirmingVideo) {
            onSelectRecipe(confirmingVideo);
            onClose();
            addToast('レシピ情報を取得しています...', 'success');

            setQuery('');
            setResults([]);
            setSearchPerformed(false);
            setConfirmingVideo(null);
            setSelectedScenes([]);
            setSelectedFeatures([]);
            setCustomFeature('');
        }
    };

    const handleCancelConfirm = () => {
        setConfirmingVideo(null);
    };

    if (!isOpen) return null;

    const currentDisplayResults = results.slice(pageIndex, pageIndex + 3);
    const isFormValid = selectedChildren.length > 0 && query.trim().length > 0;

    return (
        <div className="youtube-overlay-backdrop">
            <div className="youtube-overlay-container animate-fade-in-up">
                {/* Header */}
                <div className="youtube-overlay-header">
                    <div className="flex items-center gap-2 text-red-600">
                        <Youtube size={22} />
                        <h2 className="text-base font-bold">YouTubeからレシピを探す</h2>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={22} />
                    </button>
                </div>

                <div className="youtube-overlay-content">
                    {/* Compact Search Form */}
                    <div className="yt-search-form">
                        {/* Child Selector - Required */}
                        <div className={`yt-section ${showValidation && selectedChildren.length === 0 ? 'yt-validation-error' : ''}`}>
                            <div className="yt-section-header">
                                <span className="yt-section-label">お子様</span>
                                <span className="yt-required">必須</span>
                            </div>
                            <ChildSelector
                                selected={selectedChildren}
                                onChange={setSelectedChildren}
                            />
                        </div>

                        {/* Search Input - Required, Icon OUTSIDE input */}
                        <div className={`yt-section ${showValidation && !query.trim() ? 'yt-validation-error' : ''}`}>
                            <div className="yt-section-header">
                                <span className="yt-section-label">検索ワード</span>
                                <span className="yt-required">必須</span>
                            </div>
                            <div className="yt-search-row">
                                <div className="yt-search-icon-box">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="例: ハンバーグ"
                                    className="yt-search-input-clean"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={isSearching || !isFormValid}
                                    className="yt-search-btn"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" size={18} /> : '検索'}
                                </button>
                            </div>
                        </div>

                        {/* Scene Chips - Optional */}
                        <div className="yt-section">
                            <div className="yt-section-header">
                                <span className="yt-section-label">シーン</span>
                                <span className="yt-optional">任意</span>
                            </div>
                            <div className="yt-chips-row">
                                {MEAL_SCENES.slice(0, 6).map(scene => (
                                    <button
                                        key={scene}
                                        type="button"
                                        onClick={() => toggleScene(scene)}
                                        className={`yt-chip ${selectedScenes.includes(scene) ? 'selected' : ''}`}
                                    >
                                        <span className="yt-chip-icon">{SCENE_ICONS[scene]}</span>
                                        {scene}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feature/Tag Chips - Optional with custom input */}
                        <div className="yt-section">
                            <div className="yt-section-header">
                                <span className="yt-section-label">特徴</span>
                                <span className="yt-optional">任意・タグに反映</span>
                            </div>
                            <div className="yt-chips-row">
                                {FEATURE_OPTIONS.slice(0, 6).map(feature => (
                                    <button
                                        key={feature}
                                        type="button"
                                        onClick={() => toggleFeature(feature)}
                                        className={`yt-chip ${selectedFeatures.includes(feature) ? 'selected' : ''}`}
                                    >
                                        {feature}
                                    </button>
                                ))}
                            </div>
                            {/* Custom tag input */}
                            <div className="yt-custom-tag-row">
                                <input
                                    type="text"
                                    value={customFeature}
                                    onChange={(e) => setCustomFeature(e.target.value)}
                                    placeholder="自由入力で追加"
                                    className="yt-custom-tag-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomFeature();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addCustomFeature}
                                    disabled={!customFeature.trim()}
                                    className="yt-custom-tag-btn"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            {/* Show selected custom features */}
                            {selectedFeatures.filter(f => !FEATURE_OPTIONS.includes(f)).length > 0 && (
                                <div className="yt-chips-row mt-2">
                                    {selectedFeatures.filter(f => !FEATURE_OPTIONS.includes(f)).map(feature => (
                                        <button
                                            key={feature}
                                            type="button"
                                            onClick={() => toggleFeature(feature)}
                                            className="yt-chip selected custom"
                                        >
                                            {feature}
                                            <X size={12} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="results-area">
                        {isSearching ? (
                            <div className="searching-state">
                                <Loader2 size={36} className="animate-spin text-red-500 mb-3" />
                                <p>レシピを探しています...</p>
                            </div>
                        ) : error ? (
                            <div className="empty-state text-red-600">
                                <p className="font-bold mb-2">エラーが発生しました</p>
                                <p className="text-xs bg-red-50 p-2 rounded">{error}</p>
                            </div>
                        ) : searchPerformed && results.length === 0 ? (
                            <div className="empty-state">
                                <p>見つかりませんでした 😢</p>
                                <p className="text-sm text-gray-500">検索ワードを変えてみてください</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="results-grid-container">
                                <div className="results-grid">
                                    {currentDisplayResults.map((video) => (
                                        <YouTubeRecipeCard
                                            key={video.id}
                                            video={video}
                                            onSelect={handleCardSelect}
                                        />
                                    ))}
                                </div>

                                {results.length > 3 && (
                                    <div className="pagination-area">
                                        <button onClick={handleNextPage} className="next-results-btn">
                                            <RefreshCw size={14} />
                                            他の案を見る
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmingVideo && (
                <div className="confirm-modal-backdrop" onClick={handleCancelConfirm}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={confirmingVideo.thumbnail}
                            alt={confirmingVideo.title}
                            className="confirm-modal-thumbnail"
                        />
                        <h3 className="confirm-modal-title">{confirmingVideo.title}</h3>
                        <p className="confirm-modal-channel">{confirmingVideo.channelTitle}</p>
                        {selectedFeatures.length > 0 && (
                            <p className="text-xs text-gray-500 mb-2">
                                タグに反映: {selectedFeatures.join(', ')}
                            </p>
                        )}
                        <p className="text-center text-gray-600 mb-4 text-sm">
                            このレシピをメモに追加しますか？
                        </p>
                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                onClick={handleCancelConfirm}
                                className="confirm-cancel-btn"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAdd}
                                className="confirm-add-btn"
                            >
                                追加する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubeSearchOverlay;



