import 'server-only';

export function shouldWarmSearchIndex(): boolean {
  return process.env.NEXT_PHASE !== 'phase-production-build';
}
