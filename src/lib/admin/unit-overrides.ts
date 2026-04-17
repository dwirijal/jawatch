import type { PublicAvailability } from '@/lib/catalog/public-contract';

export type UnitOverrideInput = {
  unitId: string;
  availability?: PublicAvailability;
  releaseDate?: string | null;
  editedBy: string;
};

export type UnitOverride = UnitOverrideInput & {
  editedAt: string;
};

export function createUnitOverride(input: UnitOverrideInput, now = new Date()): UnitOverride {
  return {
    ...input,
    editedAt: now.toISOString(),
  };
}
