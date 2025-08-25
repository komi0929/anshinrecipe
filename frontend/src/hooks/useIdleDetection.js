import { useState, useEffect, useCallback } from 'react';

const useIdleDetection = (idleThreshold = 30000) => {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetIdleTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsIdle(false);
  }, []);

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Set up idle detection timer
    const idleTimer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity >= idleThreshold) {
        setIsIdle(true);
      }
    }, 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      clearInterval(idleTimer);
    };
  }, [lastActivity, idleThreshold, resetIdleTimer]);

  return { isIdle, resetIdleTimer };
};

export default useIdleDetection;