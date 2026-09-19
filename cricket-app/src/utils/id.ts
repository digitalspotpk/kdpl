// ═══════════════════════════════════════════════════════════════
// Collision-safe ID generator.
// Replaces the old `Date.now()`-based IDs, which could collide when
// two records were created in the same millisecond (e.g. a fast
// double-tap on mobile, or two organizers on different devices
// adding a record at nearly the same instant).
// ═══════════════════════════════════════════════════════════════

let fallbackCounter = 0;

export function genId(prefix: string): string {
  // Prefer the browser's crypto.randomUUID() — collision-proof.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for older environments: time + monotonic counter + random.
  fallbackCounter = (fallbackCounter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${fallbackCounter}_${rand}`;
}
