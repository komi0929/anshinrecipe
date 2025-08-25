import React, { useState } from "react";
import "./App.css";
import { X, Plus } from "lucide-react";
import RecipeCard from "./components/RecipeCard";
import { mockRecipes } from "./mockData";

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

  // Check for demo mode to show results immediately
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

  // Show demo results if demo mode is enabled
  React.useEffect(() => {
    if (isDemoMode) {
      setSearchResults(mockRecipes);
      setHasSearched(true);
    }
  }, [isDemoMode]);

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
  };

  const removeAllergen = (allergen) => {
    setSelectedAllergens(prev => prev.filter(item => item !== allergen));
  };

  const handleContextSelect = (context) => {
    setSelectedContext(prev => prev === context ? "" : context);
  };

  const handleSearch = () => {
    console.log("Search clicked:", { selectedAllergens, selectedContext, searchText });
    
    // Filter recipes based on selected allergens and add context matching
    let filteredRecipes = mockRecipes.filter(recipe => {
      // Check if recipe contains any selected allergens (for demo, we'll assume none do)
      const hasSelectedAllergens = selectedAllergens.some(allergen => 
        recipe.title.includes(allergen)
      );
      return !hasSelectedAllergens;
    });

    // Apply context filtering and boost scores
    if (selectedContext) {
      filteredRecipes = filteredRecipes.map(recipe => {
        let boostedScore = recipe.anshinScore;
        let updatedCatchphrase = recipe.catchphrase;
        
        // Context matching logic
        if (selectedContext === "時短" && recipe.title.includes("時短")) {
          boostedScore += 2;
          updatedCatchphrase = "時短レシピ";
        } else if (selectedContext === "健康" && recipe.title.includes("野菜")) {
          boostedScore += 1;
          updatedCatchphrase = "栄養満点";
        } else if (selectedContext === "初心者" && recipe.title.includes("簡単")) {
          boostedScore += 1;
          updatedCatchphrase = "初心者OK";
        }
        
        return {
          ...recipe,
          anshinScore: Math.min(boostedScore, 100),
          catchphrase: updatedCatchphrase
        };
      });
    }

    // Sort by score and take top 3
    const top3Results = filteredRecipes
      .sort((a, b) => b.anshinScore - a.anshinScore)
      .slice(0, 3);

    setSearchResults(top3Results);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center justify-start pt-8 mb-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            あんしんレシピ
          </h1>
          <h2 className="text-lg font-medium text-[#10B981] mb-6 text-center">
            3stepであんしん＆おいしいレシピと出会えます
          </h2>
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
                onClick={() => setShowAllAllergens(!showAllAllergens)}
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
                onChange={(e) => setSearchText(e.target.value)}
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
                <h3 className="text-lg font-bold text-[#111827]">
                  あんしんレシピ Top3
                </h3>
                <button
                  onClick={() => {
                    setHasSearched(false);
                    setSearchResults([]);
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

            {/* Recipe Cards */}
            <div className="space-y-4">
              {searchResults.map((recipe, index) => (
                <div key={recipe.id}>
                  <div className="text-sm font-medium text-[#6B7280] mb-2">
                    #{index + 1}
                  </div>
                  <RecipeCard recipe={recipe} showDebug={isDebugMode} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom-fixed Search Button - only show when not showing results */}
      {!hasSearched && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAFAF9] border-t border-gray-200">
          <button
            onClick={handleSearch}
            className="w-full bg-[#10B981] text-white py-3 rounded-xl font-medium hover:bg-[#047857] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors"
          >
            レシピを検索
          </button>
        </div>
      )}
    </div>
  );
}

export default App;