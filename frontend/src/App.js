import React, { useState, useEffect } from "react";
import "./App.css";
import { X, Plus, ChevronDown, RefreshCw } from "lucide-react";
import RecipeCard from "./components/RecipeCard";
import SessionFeedback from "./components/SessionFeedback";
import useIdleDetection from "./hooks/useIdleDetection";
import { getOrCreateAnonId, canShowFeedbackToday, markFeedbackShownToday, getSessionData } from "./utils/sessionUtils";

// Environment constant for idle threshold
const IDLE_THRESHOLD_MS = process.env.REACT_APP_IDLE_THRESHOLD_MS || 30000;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  // State for allergens
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [showAllAllergens, setShowAllAllergens] = useState(false);
  
  // State for context chips
  const [selectedContext, setSelectedContext] = useState("");
  
  // State for search text
  const [searchText, setSearchText] = useState("");
  
  // State for search results
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State for Top10 expansion
  const [showTop10, setShowTop10] = useState(false);
  
  // State for alternative sets
  const [hasUsedAlternative, setHasUsedAlternative] = useState(false);

  // State for session feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [anonId] = useState(() => getOrCreateAnonId());

  // Idle detection
  const { isIdle, resetIdleTimer } = useIdleDetection(IDLE_THRESHOLD_MS);

  // State for search loading
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Check for debug mode
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

  // Handle idle detection for feedback banner
  useEffect(() => {
    if (isIdle && hasSearched && !showFeedback && canShowFeedbackToday(anonId)) {
      setShowFeedback(true);
      markFeedbackShownToday(anonId);
    }
  }, [isIdle, hasSearched, showFeedback, anonId]);

  // Mandatory allergens (always visible)
  const mandatoryAllergens = ["卵", "乳", "小麦", "そば", "落花生", "えび", "かに", "くるみ"];
  
  // Additional 20 allergens (collapsible)
  const additionalAllergens = [
    "あわび", "いか", "いくら", "オレンジ", "カシューナッツ", "キウイフルーツ", 
    "牛肉", "ごま", "さけ", "さば", "大豆", "鶏肉", "バナナ", "豚肉", 
    "まつたけ", "もも", "やまいも", "りんご", "ゼラチン", "アーモンド"
  ];

  // Context options
  const contextOptions = ["時短", "イベント", "健康", "初心者"];

  const toggleAllergen = (allergen) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(item => item !== allergen)
        : [...prev, allergen]
    );
    resetIdleTimer(); // Reset idle on user interaction
  };

  const removeAllergen = (allergen) => {
    setSelectedAllergens(prev => prev.filter(item => item !== allergen));
    resetIdleTimer();
  };

  const handleContextSelect = (context) => {
    setSelectedContext(prev => prev === context ? "" : context);
    resetIdleTimer();
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    console.log("Search clicked:", { selectedAllergens, selectedContext, searchText });
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Build search query
      const queryParams = new URLSearchParams({
        q: searchText
      });
      
      if (selectedContext) {
        queryParams.append('context', selectedContext);
      }
      
      if (selectedAllergens.length > 0) {
        queryParams.append('allergens', selectedAllergens.join(','));
      }
      
      if (isDebugMode) {
        queryParams.append('debug', '1');
      }
      
      const searchUrl = `${BACKEND_URL}/api/v1/search?${queryParams.toString()}`;
      console.log('Calling search API:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Search API error:', errorData);
        
        if (response.status === 502 && errorData.error === 'cse_failed') {
          setSearchError({
            type: 'cse_failed',
            message: 'Search service is temporarily unavailable',
            details: isDebugMode ? errorData : null
          });
        } else {
          setSearchError({
            type: 'general_error',
            message: 'Search failed. Please try again.',
            details: isDebugMode ? errorData : null
          });
        }
        return;
      }
      
      const searchData = await response.json();
      console.log('Search results:', searchData);
      
      setSearchResults(searchData.results || []);
      setHasSearched(true);
      setShowTop10(false);
      setHasUsedAlternative(false);
      resetIdleTimer(); // Reset idle timer on search
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError({
        type: 'network_error',
        message: 'Network error. Please check your connection and try again.',
        details: isDebugMode ? error.message : null
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleShowTop10 = () => {
    setShowTop10(true);
    resetIdleTimer();
  };

  const handleContextAlternative = async () => {
    if (!selectedContext || hasUsedAlternative) return;

    // For now, re-run the search with context emphasis
    // This could be enhanced to call a specific reranking endpoint
    await handleSearch();
    setHasUsedAlternative(true);
    resetIdleTimer();
  };

    // Combine reranked results with alternatives
    const combinedResults = [...rerankedResults, ...validAlternatives]
      .sort((a, b) => b.anshinScore - a.anshinScore);

    setSearchResults(combinedResults);
    setShowTop10(false);
    setHasUsedAlternative(true);
    resetIdleTimer();
  };

  const getAlternativeButtonText = () => {
    if (!selectedContext) return "";
    
    const contextLabels = {
      "時短": "時短をさらに優先",
      "イベント": "見栄えを重視", 
      "健康": "より健康的を優先",
      "初心者": "やさしさを優先"
    };

    return `別の候補を試す（${contextLabels[selectedContext]}）`;
  };

  const getSetDescription = () => {
    if (hasUsedAlternative) {
      const descriptions = {
        "時短": "軸変更：調理時間と工程数を最優先",
        "イベント": "軸変更：見た目と装飾性を最優先",
        "健康": "軸変更：カロリーと栄養価を最優先", 
        "初心者": "軸変更：手順の簡単さを最優先"
      };
      return descriptions[selectedContext] || "";
    }
    return "";
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
  };

  const handleFeedbackSubmit = (payload) => {
    console.log('Feedback submitted:', payload);
    // Additional handling if needed
  };

  const top3Results = searchResults.slice(0, 3);
  const top10Results = searchResults.slice(3, 10);

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-start pt-8 mb-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            あんしんレシピ
          </h1>
          <h2 className="text-lg font-medium text-[#10B981] mb-6 text-center">
            3stepであんしん＆おいしいレシピと出会えます
          </h2>
          
          {/* Debug info */}
          {isDebugMode && (
            <div className="text-xs text-[#6B7280] mb-4">
              Debug: Idle={isIdle ? 'Yes' : 'No'}, 
              Threshold={IDLE_THRESHOLD_MS}ms, 
              AnonId={anonId.slice(-8)}
            </div>
          )}
        </div>

        {!hasSearched ? (
          <>
            {/* Selected Allergen Badges */}
            {selectedAllergens.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {selectedAllergens.map((allergen) => (
                    <div
                      key={allergen}
                      className="bg-[#10B981] text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
                    >
                      {allergen}
                      <button
                        onClick={() => removeAllergen(allergen)}
                        className="hover:opacity-70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergen Picker */}
            <div className="mb-6">
              <h3 className="text-[#111827] font-medium mb-3">避けたい食材</h3>
              
              {/* Mandatory allergens */}
              <div className="flex flex-wrap gap-2 mb-3">
                {mandatoryAllergens.map((allergen) => (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergen(allergen)}
                    className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                      selectedAllergens.includes(allergen)
                        ? "bg-[#10B981] text-white border-[#10B981]"
                        : "bg-white text-[#111827] border-gray-300 hover:border-[#10B981]"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>

              {/* Expand button */}
              <button
                onClick={() => {
                  setShowAllAllergens(!showAllAllergens);
                  resetIdleTimer();
                }}
                className="flex items-center gap-2 text-[#10B981] text-sm hover:text-[#047857] transition-colors mb-3"
              >
                <Plus size={16} />
                {showAllAllergens ? "20品目を非表示" : "＋さらに20品目を表示"}
              </button>

              {/* Additional allergens (collapsible) */}
              {showAllAllergens && (
                <div className="flex flex-wrap gap-2">
                  {additionalAllergens.map((allergen) => (
                    <button
                      key={allergen}
                      onClick={() => toggleAllergen(allergen)}
                      className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                        selectedAllergens.includes(allergen)
                          ? "bg-[#10B981] text-white border-[#10B981]"
                          : "bg-white text-[#111827] border-gray-300 hover:border-[#10B981]"
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Context Chips */}
            <div className="mb-6">
              <h3 className="text-[#111827] font-medium mb-3">今日の気分</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {contextOptions.map((context) => (
                  <button
                    key={context}
                    onClick={() => handleContextSelect(context)}
                    className={`rounded-full px-3 py-1 text-sm border whitespace-nowrap transition-colors ${
                      selectedContext === context
                        ? "bg-[#10B981] text-white border-[#10B981]"
                        : "bg-white text-[#111827] border-gray-300 hover:border-[#10B981]"
                    }`}
                  >
                    {context}
                  </button>
                ))}
              </div>
            </div>

            {/* Free-text Search */}
            <div className="mb-6">
              <h3 className="text-[#111827] font-medium mb-3">フリーワード検索</h3>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  resetIdleTimer();
                }}
                placeholder="例：ケーキ、カレー、パスタ"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-colors"
              />
            </div>
          </>
        ) : (
          <>
            {/* Search Results Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    あんしんレシピ {showTop10 ? 'Top10' : 'Top3'}
                  </h3>
                  {getSetDescription() && (
                    <div className="text-sm text-[#0EA5E9] mt-1">
                      {getSetDescription()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setHasSearched(false);
                    setSearchResults([]);
                    setShowTop10(false);
                    setHasUsedAlternative(false);
                    setShowFeedback(false);
                    resetIdleTimer();
                  }}
                  className="text-[#10B981] text-sm hover:text-[#047857] transition-colors"
                >
                  検索に戻る
                </button>
              </div>
              {isDebugMode && (
                <div className="mt-2 text-xs text-[#6B7280]">
                  デバッグモード: スコア詳細とキャッチフレーズ出典を表示
                </div>
              )}
            </div>

            {/* Top3 Recipe Cards */}
            <div className="space-y-4 mb-6">
              {top3Results.map((recipe, index) => (
                <div key={recipe.id}>
                  <div className="text-sm font-medium text-[#6B7280] mb-2">
                    #{index + 1}
                  </div>
                  <RecipeCard recipe={recipe} showDebug={isDebugMode} />
                </div>
              ))}
            </div>

            {/* Top10 Expansion Button */}
            {!showTop10 && top10Results.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={handleShowTop10}
                  className="w-full bg-white border border-[#10B981] text-[#10B981] py-3 rounded-lg font-medium hover:bg-[#10B981] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronDown size={20} />
                  Top10を表示
                </button>
              </div>
            )}

            {/* Top10 Results (4-10) */}
            {showTop10 && (
              <div className="space-y-4 mb-6">
                <div className="text-center py-2">
                  <div className="text-sm font-medium text-[#6B7280]">
                    残りの結果 (4位〜10位)
                  </div>
                </div>
                {top10Results.map((recipe, index) => (
                  <div key={recipe.id}>
                    <div className="text-sm font-medium text-[#6B7280] mb-2">
                      #{index + 4}
                    </div>
                    <RecipeCard recipe={recipe} showDebug={isDebugMode} />
                  </div>
                ))}
              </div>
            )}

            {/* Context-Tied Alternative Set Button */}
            {selectedContext && !hasUsedAlternative && (
              <div className="mb-6">
                <button
                  onClick={handleContextAlternative}
                  className="w-full bg-[#0EA5E9] text-white py-3 rounded-lg font-medium hover:bg-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  {getAlternativeButtonText()}
                </button>
                <div className="text-xs text-[#6B7280] text-center mt-2">
                  選択したコンテキストに特化した軸で再検索します
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Error Display */}
      {searchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium mb-2">
            {searchError.message}
          </div>
          {isDebugMode && searchError.details && (
            <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(searchError.details, null, 2)}
            </pre>
          )}
          <button 
            onClick={() => setSearchError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            ✕ 閉じる
          </button>
        </div>
      )}

      {/* Bottom-fixed Search Button - only show when not showing results */}
      {!hasSearched && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAFAF9] border-t border-gray-200">
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchText.trim()}
            className={`w-full py-3 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors ${
              isSearching || !searchText.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#10B981] text-white hover:bg-[#047857]'
            }`}
          >
            {isSearching ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>検索中...</span>
              </div>
            ) : (
              'レシピを検索'
            )}
          </button>
        </div>
      )}

      {/* Session Feedback Banner */}
      {showFeedback && hasSearched && (
        <SessionFeedback
          onClose={handleFeedbackClose}
          onFeedback={handleFeedbackSubmit}
          searchContext={selectedContext}
          searchQuery={searchText}
          resultSetIds={searchResults.map(r => r.id)}
          anonId={anonId}
        />
      )}
    </div>
  );
}

export default App;