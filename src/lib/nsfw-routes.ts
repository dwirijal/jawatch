export const RETIRED_NSFW_ROOT = '/nsfw';

export function isRetiredNsfwPath(pathname: string): boolean {
  return pathname === RETIRED_NSFW_ROOT || pathname.startsWith(`${RETIRED_NSFW_ROOT}/`);
}
