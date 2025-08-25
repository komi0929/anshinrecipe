import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Environment constant for idle threshold (test: 30s, production: 120s)
export const IDLE_THRESHOLD_MS = process.env.REACT_APP_IDLE_THRESHOLD_MS || 30000;

const SessionFeedback = ({ 
  onClose, 
  onFeedback, 
  searchContext, 
  searchQuery, 
  resultSetIds,
  anonId 
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showReasons, setShowReasons] = useState(false);

  const reasonOptions = [
    '難しすぎた',
    '好みに合わなかった', 
    '探しているシーンと違った',
    'その他'
  ];

  const handleFeedbackSelect = async (feedbackType) => {
    setSelectedFeedback(feedbackType);

    if (feedbackType === 'ideal_match') {
      // Send immediately for positive feedback
      await sendTelemetry(feedbackType);
      onClose();
    } else if (feedbackType === 'not_found') {
      // Show reasons selection
      setShowReasons(true);
    } else if (feedbackType === 'allergen_included') {
      // Send allergen report and telemetry
      await sendAllergenReport();
      await sendTelemetry(feedbackType);
      onClose();
    }
  };

  const handleReasonToggle = (reason) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReasonsSubmit = async () => {
    await sendTelemetry('not_found', selectedReasons, noteText);
    onClose();
  };

  const sendTelemetry = async (value, reasons = null, note = null) => {
    const payload = {
      type: 'session_feedback',
      value: value,
      reasons: reasons,
      note: note,
      query: searchQuery,
      context: searchContext,
      setIds: resultSetIds,
      anonId: anonId,
      ts: new Date().toISOString()
    };

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/v1/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Telemetry sent:', payload);
      if (onFeedback) onFeedback(payload);
    } catch (error) {
      console.error('Failed to send telemetry:', error);
    }
  };

  const sendAllergenReport = async () => {
    const payload = {
      event: 'report_allergen_mismatch',
      recipeId: resultSetIds?.[0] || null,
      context: searchContext,
      query: searchQuery,
      anonId: anonId,
      ts: new Date().toISOString()
    };

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Allergen feedback sent:', payload);
    } catch (error) {
      console.error('Failed to send allergen feedback:', error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="container mx-auto p-4 max-w-md">
        {!showReasons ? (
          <>
            {/* Main feedback question */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#111827]">
                今日の検索で理想のレシピに出会えましたか？
              </h3>
              <button
                onClick={onClose}
                className="text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Feedback buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleFeedbackSelect('ideal_match')}
                className="w-full flex items-center justify-center gap-2 bg-[#10B981] text-white py-2 px-3 rounded-lg hover:bg-[#047857] transition-colors text-sm"
              >
                <CheckCircle size={16} />
                ◯ 出会えた
              </button>
              
              <button
                onClick={() => handleFeedbackSelect('not_found')}
                className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] text-white py-2 px-3 rounded-lg hover:bg-[#D97706] transition-colors text-sm"
              >
                <AlertTriangle size={16} />
                △ 出会えなかった
              </button>
              
              <button
                onClick={() => handleFeedbackSelect('allergen_included')}
                className="w-full flex items-center justify-center gap-2 bg-[#EF4444] text-white py-2 px-3 rounded-lg hover:bg-[#DC2626] transition-colors text-sm"
              >
                <XCircle size={16} />
                ✕ アレルゲンが含まれていた
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Reasons selection */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#111827]">
                理由を教えてください（複数選択可）
              </h3>
              <button
                onClick={onClose}
                className="text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Reason chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {reasonOptions.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReasonToggle(reason)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedReasons.includes(reason)
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-gray-100 text-[#111827] hover:bg-gray-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Optional note input */}
            {selectedReasons.includes('その他') && (
              <div className="mb-4">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, 20))}
                  placeholder="詳細（20字以内）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B]"
                />
                <div className="text-xs text-[#6B7280] mt-1">
                  {noteText.length}/20文字
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleReasonsSubmit}
              className="w-full bg-[#F59E0B] text-white py-2 px-3 rounded-lg hover:bg-[#D97706] transition-colors text-sm"
            >
              送信
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionFeedback;