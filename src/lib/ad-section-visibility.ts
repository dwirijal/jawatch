export type AdRenderState = 'pending' | 'ready' | 'hidden';

export function normalizeAdSectionSlotCount(count?: number): 1 | 2 {
  return count === 1 ? 1 : 2;
}

export function getAdSectionRenderState(states: AdRenderState[]) {
  const readyCount = states.filter((state) => state === 'ready').length;
  const hiddenCount = states.filter((state) => state === 'hidden').length;
  const settled = readyCount + hiddenCount === states.length;

  return {
    visible: readyCount > 0,
    settled,
    readyCount,
    hiddenCount,
  };
}
