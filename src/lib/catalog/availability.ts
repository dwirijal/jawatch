import type { PublicAvailability } from './public-contract';

type AvailabilityInput = {
  totalUnits: number;
  readyUnits: number;
  updating?: boolean;
};

export function resolveAvailabilityState(input: AvailabilityInput): PublicAvailability {
  const totalUnits = Math.max(0, Math.trunc(input.totalUnits));
  const readyUnits = Math.max(0, Math.trunc(input.readyUnits));

  if (input.updating && readyUnits === 0) {
    return 'updating';
  }

  if (totalUnits === 0 || readyUnits === 0) {
    return 'unavailable';
  }

  if (readyUnits >= totalUnits) {
    return input.updating ? 'updating' : 'ready';
  }

  return 'partial';
}

export function resolveUnitAvailability({
  hasStreams = false,
  hasPages = false,
  updating = false,
}: {
  hasStreams?: boolean;
  hasPages?: boolean;
  updating?: boolean;
}): PublicAvailability {
  if (hasStreams || hasPages) {
    return updating ? 'updating' : 'ready';
  }

  return updating ? 'updating' : 'unavailable';
}
