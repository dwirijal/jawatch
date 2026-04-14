export function compareMovieUpdatedAtDesc(
  left: { updated_at?: Date | string | null },
  right: { updated_at?: Date | string | null },
): number {
  const leftTime = normalizeUpdatedAt(left.updated_at);
  const rightTime = normalizeUpdatedAt(right.updated_at);

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return 0;
}

function normalizeUpdatedAt(value: Date | string | null | undefined): number {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : 0;
  }

  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
  }

  return 0;
}
