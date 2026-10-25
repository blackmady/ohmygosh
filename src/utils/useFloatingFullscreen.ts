import { useState, useRef, useEffect } from 'react';

export function useFloatingFullscreen(isFullscreen: boolean, onExit: () => void) {
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  // When entering fullscreen, show a subtle floating hint pill for 2.5s, then fade out
  useEffect(() => {
    if (isFullscreen) {
      setShowHint(true);
      const timer = window.setTimeout(() => setShowHint(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowFloatingBar(false);
      setShowHint(false);
    }
  }, [isFullscreen]);

  // Handle ESC key to exit
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExit]);

  // Mouse enters the top trigger zone: wait 250ms dwell time before revealing
  const handleTopTriggerEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setShowFloatingBar(true);
    }, 250);
  };

  // Mouse leaves top trigger zone: cancel dwell timer or start hide grace period
  const handleTopTriggerLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    leaveTimerRef.current = window.setTimeout(() => {
      setShowFloatingBar(false);
    }, 500);
  };

  // Mouse enters the floating bar itself: keep it open
  const handleBarMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setShowFloatingBar(true);
  };

  // Mouse leaves floating bar: grace period then hide
  const handleBarMouseLeave = () => {
    leaveTimerRef.current = window.setTimeout(() => {
      setShowFloatingBar(false);
    }, 500);
  };

  return {
    showFloatingBar,
    showHint,
    handleTopTriggerEnter,
    handleTopTriggerLeave,
    handleBarMouseEnter,
    handleBarMouseLeave,
  };
}
