// ═══════════════════════════════════════════════════════════════
// AD SLOT RENDERER — Renders AdSense/custom ad code
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import type { AdSlot } from '../../types';

interface AdSlotRendererProps {
  slot?: AdSlot;
}

export default function AdSlotRenderer({ slot }: AdSlotRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slot?.enabled || !slot.adCode || !ref.current) return;
    try {
      ref.current.innerHTML = slot.adCode;
      // Execute any scripts in the ad code
      const scripts = ref.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    } catch (e) {
      console.warn('Ad render error:', e);
    }
  }, [slot?.adCode, slot?.enabled]);

  if (!slot?.enabled || !slot.adCode) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-kdpl-border/40 bg-kdpl-card/30">
      <div className="text-[9px] text-kdpl-muted/50 text-right px-1">Advertisement</div>
      <div ref={ref} className="w-full" />
    </div>
  );
}
