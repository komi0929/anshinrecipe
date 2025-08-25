import React from 'react';
import AnshinScoreGauge from './AnshinScoreGauge';

const RecipeCard = ({ recipe, showDebug }) => {
  const handleViewRecipe = () => {
    window.open(recipe.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      {/* Recipe Image */}
      <div className="w-full aspect-video mb-3 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+5paZ55yf55S75YOP</text>Cjwvc3ZnPgo=';
          }}
        />
      </div>

      {/* Recipe Content */}
      <div className="space-y-3">
        {/* Title */}
        <h3 className="font-bold text-base text-[#111827] line-clamp-2 leading-tight">
          {recipe.title}
        </h3>

        {/* Source Badge */}
        <div className="flex items-center">
          <span className="text-xs text-[#6B7280] bg-gray-100 px-2 py-1 rounded-md">
            {recipe.source}
          </span>
        </div>

        {/* AnshinScore and Catchphrase Row */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              あんしんスコア
            </div>
            <AnshinScoreGauge
              score={recipe.anshinScore}
              breakdown={recipe.scoreBreakdown}
              showDebug={showDebug}
            />
            
            {/* Debug information for axis shift */}
            {showDebug && recipe.axisShift && (
              <div className="mt-2 text-xs text-[#6B7280] space-y-1">
                <div>軸変更: {recipe.axisShift}</div>
                {recipe.originalScore && (
                  <div>元スコア: {recipe.originalScore} → {recipe.anshinScore}</div>
                )}
                {recipe.differenceScore !== undefined && (
                  <div>差分スコア: {recipe.differenceScore}</div>
                )}
              </div>
            )}
          </div>
          
          {/* Catchphrase */}
          {recipe.catchphrase && (
            <div className="flex-1 text-right">
              <div className="text-sm text-[#10B981] font-medium">
                {recipe.catchphrase}
              </div>
              {showDebug && recipe.catchphraseSource && (
                <div className="text-xs text-[#6B7280] mt-1">
                  出典: {recipe.catchphraseSource}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleViewRecipe}
          className="w-full bg-[#10B981] text-white py-2 rounded-lg font-medium hover:bg-[#047857] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors"
        >
          レシピを見る
        </button>
      </div>
    </div>
  );
};

export default RecipeCard;