import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Youtube, Sparkles, RefreshCw } from 'lucide-react';
import YouTubeRecipeCard from './YouTubeRecipeCard';
import ChildSelector from './ChildSelector';
import { useToast } from './Toast';
import './YouTubeSearchOverlay.css';

const YouTubeSearchOverlay = ({
    isOpen,
    onClose,
    onSelectRecipe,
    initialChildIds = []
}) => {
    // Search State
    const [query, setQuery] = useState('');
    const [scene, setScene] = useState('');
    const [selectedChildren, setSelectedChildren] = useState(initialChildIds);

    // Results State
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Confirmation Modal State
    const [confirmingVideo, setConfirmingVideo] = useState(null);

    // UI State
    const { addToast } = useToast();

    // Sync child selection when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedChildren(initialChildIds);
        }
    }, [isOpen, initialChildIds]);

    const handleSearch = async (e) => {
        e?.preventDefault();

        if (!query.trim()) {
            addToast('検索ワードを入力してください', 'error');
            return;
        }

        setIsSearching(true);
        setSearchPerformed(true);
        setResults([]);
        setError(null);
        setPageIndex(0);

        try {
            const response = await fetch('/api/youtube/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    childIds: selectedChildren,
                    scene: scene.trim()
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

    // Show confirmation modal instead of immediate selection
    const handleCardSelect = (video) => {
        setConfirmingVideo(video);
    };

    // Confirmed selection
    const handleConfirmAdd = () => {
        if (confirmingVideo) {
            onSelectRecipe(confirmingVideo);
            onClose();
            addToast('レシピ情報を取得しています...', 'success');

            setQuery('');
            setResults([]);
            setSearchPerformed(false);
            setConfirmingVideo(null);
        }
    };

    // Cancel confirmation
    const handleCancelConfirm = () => {
        setConfirmingVideo(null);
    };

    if (!isOpen) return null;

    const currentDisplayResults = results.slice(pageIndex, pageIndex + 3);

    return (
        <div className="youtube-overlay-backdrop">
            <div className="youtube-overlay-container animate-fade-in-up">
                {/* Header */}
                <div className="youtube-overlay-header">
                    <div className="flex items-center gap-2 text-red-600">
                        <Youtube size={24} />
                        <h2 className="text-lg font-bold">YouTubeからレシピを探す</h2>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="youtube-overlay-content">
                    {/* Search Form */}
                    <div className="search-controls">
                        <div className="mb-4">
                            <ChildSelector
                                selected={selectedChildren}
                                onChange={setSelectedChildren}
                            />
                        </div>

                        <div className="search-bar-group">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="何を作りますか？ (例: ハンバーグ)"
                                    className="search-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            <input
                                type="text"
                                value={scene}
                                onChange={(e) => setScene(e.target.value)}
                                placeholder="シーン (任意)"
                                className="scene-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="search-submit-btn"
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={20} /> : '検索'}
                            </button>
                        </div>

                        <p className="search-hint">
                            <Sparkles size={12} className="inline mr-1 text-yellow-500" />
                            お子様のアレルギー情報を考慮して、あんしんレシピを優先表示します
                        </p>
                    </div>

                    {/* Results Area */}
                    <div className="results-area">
                        {isSearching ? (
                            <div className="searching-state">
                                <Loader2 size={40} className="animate-spin text-red-500 mb-4" />
                                <p>美味しいレシピを探しています...</p>
                                <p className="text-sm text-gray-500 mt-2">アレルギー情報と照合中</p>
                            </div>
                        ) : error ? (
                            <div className="empty-state text-red-600">
                                <p className="font-bold mb-2">エラーが発生しました 😢</p>
                                <p className="text-xs font-mono bg-red-50 p-2 rounded border border-red-100 mb-2">{error}</p>
                                <p className="text-sm text-gray-500">
                                    {error.includes('blocked') ? 'API設定(Google Console)を確認してください' : 'もう一度お試しください'}
                                </p>
                            </div>
                        ) : searchPerformed && results.length === 0 ? (
                            <div className="empty-state">
                                <p>見つかりませんでした 😢</p>
                                <p className="text-sm text-gray-500">検索ワードを変えて試してみてください</p>
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
                                            <RefreshCw size={16} />
                                            他の案を見る ({pageIndex + 3} / {results.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="initial-empty-state">
                                <p>🍳 食べたい料理を検索してみましょう</p>
                            </div>
                        )}
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

