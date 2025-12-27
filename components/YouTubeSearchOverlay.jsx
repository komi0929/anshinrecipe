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
    const [pageIndex, setPageIndex] = useState(0); // For pagination (client-side slicing of 30 results)
    const [searchPerformed, setSearchPerformed] = useState(false);

    // UI State
    const { addToast } = useToast();

    // Sync child selection when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedChildren(initialChildIds);
            // Reset searches if opened fresh? Maybe keep consistent if user closes/reopens?
            // Let's keep state for better UX unless explicitly cleared
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
            addToast('検索に失敗しました。API設定などを確認してください。', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleNextPage = () => {
        const nextIndex = pageIndex + 3;
        if (nextIndex < results.length) {
            setPageIndex(nextIndex);
        } else {
            setPageIndex(0); // Cycle back to start or fetch more? Cycle for now.
            addToast('最初のおすすめに戻りました', 'info');
        }
    };

    const handleSelect = (video) => {
        onSelectRecipe(video);
        onClose();
        addToast('レシピ情報を取得しています...', 'success');

        // Reset state after selection (optional, but good for next use)
        setQuery('');
        setResults([]);
        setSearchPerformed(false);
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
                        {/* Child Selector used here to contextualize search */}
                        <div className="mb-4">
                            <ChildSelector
                                selected={selectedChildren}
                                onChange={setSelectedChildren}
                            />
                        </div>

                        <div className="search-bar-group">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="何を作りますか？ (例: ハンバーグ, うどん)"
                                    className="search-input"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    autoFocus
                                />
                            </div>
                            <input
                                type="text"
                                value={scene}
                                onChange={(e) => setScene(e.target.value)}
                                placeholder="シーン (任意)"
                                className="scene-input"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="search-submit-btn"
                            >
                                {isSearching ? <Loader2 className="animate-spin" /> : '検索'}
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
                                            onSelect={handleSelect}
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
                            // Use instructions state
                            <div className="initial-instructions">
                                <div className="step-badge">1</div>
                                <p>食べたい料理を入力</p>
                                <div className="arrow-down">⬇</div>
                                <div className="step-badge">2</div>
                                <p>AIが安全なレシピを厳選</p>
                                <div className="arrow-down">⬇</div>
                                <div className="step-badge">3</div>
                                <p>選んで自動入力！</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YouTubeSearchOverlay;
