import type { PublicAvailability, PublicUnit } from './public-contract';

function isConsumableAvailability(availability: PublicAvailability): boolean {
  return availability === 'ready' || availability === 'partial';
}

type ResumeInput<TUnit extends Pick<PublicUnit, 'id' | 'availability'>> = {
  lastUnitId?: string | null;
  units: TUnit[];
};

export function resolveResumeTarget<TUnit extends Pick<PublicUnit, 'id' | 'availability'>>({
  lastUnitId,
  units,
}: ResumeInput<TUnit>): TUnit | null {
  if (units.length === 0) {
    return null;
  }

  const lastIndex = lastUnitId ? units.findIndex((unit) => unit.id === lastUnitId) : -1;

  if (lastIndex >= 0 && isConsumableAvailability(units[lastIndex].availability)) {
    return units[lastIndex];
  }

  const searchStart = lastIndex >= 0 ? lastIndex + 1 : 0;
  const laterTarget = units.slice(searchStart).find((unit) => isConsumableAvailability(unit.availability));
  if (laterTarget) {
    return laterTarget;
  }

  const earlierTarget = units.slice(0, Math.max(lastIndex, 0)).reverse().find((unit) =>
    isConsumableAvailability(unit.availability),
  );

  return earlierTarget ?? null;
}
