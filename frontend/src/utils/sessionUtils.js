// Utility functions for session management and anonymous ID handling

export const generateAnonId = () => {
  return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

export const getOrCreateAnonId = () => {
  let anonId = localStorage.getItem('anshin_anon_id');
  if (!anonId) {
    anonId = generateAnonId();
    localStorage.setItem('anshin_anon_id', anonId);
  }
  return anonId;
};

export const canShowFeedbackToday = (anonId) => {
  const today = new Date().toDateString();
  const lastShownDate = localStorage.getItem(`anshin_feedback_shown_${anonId}`);
  return lastShownDate !== today;
};

export const markFeedbackShownToday = (anonId) => {
  const today = new Date().toDateString();
  localStorage.setItem(`anshin_feedback_shown_${anonId}`, today);
};

export const getSessionData = (searchContext, searchQuery, searchResults) => {
  return {
    context: searchContext,
    query: searchQuery,
    setIds: searchResults.map(r => r.id),
  };
};