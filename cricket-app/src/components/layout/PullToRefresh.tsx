// ═══════════════════════════════════════════════════════════════
// KDPL PULL TO REFRESH — simple touch-gesture wrapper
// ═══════════════════════════════════════════════════════════════

import { useRef, useState } from 'react';
import { RefreshIcon } from '../ui/Icons';

const THRESHOLD = 70;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const dragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    if ((containerRef.current?.scrollTop ?? 0) > 0) return;
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && (containerRef.current?.scrollTop ?? 0) <= 0) {
      setPull(Math.min(delta * 0.5, 110));
    } else {
      dragging.current = false;
      setPull(0);
    }
  };

  const onTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      setTimeout(() => window.location.reload(), 500);
    } else {
      setPull(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="flex-1 overflow-y-auto kdpl-scroll relative"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pull, opacity: Math.min(pull / THRESHOLD, 1) }}
      >
        <div style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}>
          <RefreshIcon size={20} className={`text-kdpl-neon ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>
      {children}
    </div>
  );
}
