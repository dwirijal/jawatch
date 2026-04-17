import type { PublicAvailability } from '@/lib/catalog/public-contract';

export type TitleOverrideInput = {
  titleId: string;
  availability?: PublicAvailability;
  releaseDate?: string | null;
  editedBy: string;
};

export type TitleOverride = TitleOverrideInput & {
  editedAt: string;
};

export function createTitleOverride(input: TitleOverrideInput, now = new Date()): TitleOverride {
  return {
    ...input,
    editedAt: now.toISOString(),
  };
}
