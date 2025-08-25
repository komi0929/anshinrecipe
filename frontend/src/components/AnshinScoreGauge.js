import React, { useState, useEffect } from 'react';

const AnshinScoreGauge = ({ score, breakdown, showDebug }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Color based on score bands
  const getColor = (score) => {
    if (score >= 85) return '#22C55E'; // Green
    if (score >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Calculate circumference and stroke offset
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={getColor(score)}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 250ms ease-out',
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[#111827]">
            {Math.round(animatedScore)}
          </span>
        </div>
      </div>
      
      {/* Debug breakdown */}
      {showDebug && breakdown && (
        <div className="mt-2 text-xs text-[#6B7280] space-y-1">
          <div>安全性: {breakdown.safety}</div>
          <div>信頼性: {breakdown.trust}</div>
          <div>適合性: {breakdown.context}</div>
          <div>人気度: {breakdown.popularity}</div>
        </div>
      )}
    </div>
  );
};

export default AnshinScoreGauge;