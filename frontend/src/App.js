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

  // State for search loading and errors
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Idle detection
  const { isIdle, resetIdleTimer } = useIdleDetection(IDLE_THRESHOLD_MS);

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
  
  // Collapsible allergens (show when expanded)
  const collapsibleAllergens = [
    "あわび", "いか", "いくら", "オレンジ", "カシューナッツ", "キウイフルーツ",
    "牛肉", "ごま", "さけ", "さば", "大豆", "鶏肉", "バナナ", "豚肉",
    "まつたけ", "もも", "やまいも", "りんご", "ゼラチン", "魚介類（えび・かに以外）"
  ];

  const handleAllergenToggle = (allergen) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleAllergenRemove = (allergen) => {
    setSelectedAllergens(prev => prev.filter(a => a !== allergen));
  };

  const handleContextToggle = (context) => {
    setSelectedContext(prev => prev === context ? "" : context);
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
        <div className="flex flex-col items-center justify-center pt-8 mb-8">
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

        {/* Allergen Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#374151] mb-3">
            使わない食材を選んでください（任意）
          </h3>
          
          {/* Mandatory allergens */}
          <div className="flex flex-wrap gap-2 mb-3">
            {mandatoryAllergens.map(allergen => (
              <button
                key={allergen}
                onClick={() => handleAllergenToggle(allergen)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedAllergens.includes(allergen)
                    ? 'bg-[#10B981] text-white border-[#10B981]'
                    : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#10B981]'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
          
          {/* Collapsible allergens */}
          {showAllAllergens && (
            <div className="flex flex-wrap gap-2 mb-3">
              {collapsibleAllergens.map(allergen => (
                <button
                  key={allergen}
                  onClick={() => handleAllergenToggle(allergen)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedAllergens.includes(allergen)
                      ? 'bg-[#10B981] text-white border-[#10B981]'
                      : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#10B981]'
                  }`}
                >
                  {allergen}
                </button>
              ))}
            </div>
          )}
          
          {/* Show more/less button */}
          <button
            onClick={() => setShowAllAllergens(!showAllAllergens)}
            className="flex items-center space-x-1 text-sm text-[#10B981] hover:text-[#047857]"
          >
            <span>{showAllAllergens ? "戻す" : "他のアレルゲンも見る"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllAllergens ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Selected allergens chips */}
          {selectedAllergens.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E5E7EB]">
              {selectedAllergens.map(allergen => (
                <div
                  key={allergen}
                  className="flex items-center space-x-1 bg-[#10B981] text-white px-2 py-1 rounded-full text-sm"
                >
                  <span>{allergen}</span>
                  <button
                    onClick={() => handleAllergenRemove(allergen)}
                    className="hover:bg-[#047857] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#374151] mb-3">
            今日の気分は？（任意）
          </h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {["時短", "イベント", "健康", "初心者"].map(context => (
              <button
                key={context}
                onClick={() => handleContextToggle(context)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedContext === context
                    ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                    : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#0EA5E9]'
                }`}
              >
                {context}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#374151] mb-3">
            作りたいレシピは？
          </h3>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="例：卵を使わないケーキ"
            className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
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

        {/* Search Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="space-y-6">
            {/* Top 3 Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827]">
                あんしんTop3
              </h3>
              {top3Results.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  rank={index + 1}
                  showDebug={isDebugMode}
                />
              ))}
            </div>

            {/* Top10 Button or Results */}
            {!showTop10 && top10Results.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleShowTop10}
                  className="bg-white border border-[#D1D5DB] text-[#374151] px-6 py-3 rounded-xl hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors"
                >
                  <Plus className="w-4 h-4 inline-block mr-2" />
                  Top10を表示
                </button>
              </div>
            )}

            {/* Top10 Results */}
            {showTop10 && top10Results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Top10
                </h3>
                {top10Results.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    rank={index + 4}
                    isDebugMode={isDebugMode}
                  />
                ))}
              </div>
            )}

            {/* Alternative Context Set Button */}
            {selectedContext && !hasUsedAlternative && (
              <div className="text-center pt-4 border-t border-[#E5E7EB]">
                <button
                  onClick={handleContextAlternative}
                  className="bg-white border border-[#D1D5DB] text-[#374151] px-6 py-3 rounded-xl hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline-block mr-2" />
                  別の候補を試す
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {hasSearched && searchResults.length === 0 && !searchError && (
          <div className="text-center py-8">
            <div className="text-[#6B7280] text-lg mb-2">
              レシピが見つかりませんでした
            </div>
            <div className="text-[#9CA3AF] text-sm">
              検索条件を変更してお試しください
            </div>
          </div>
        )}
      </div>

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