export type WatchSurfaceKind = 'movie' | 'series' | 'shorts';
export type WatchSurfaceMode = 'default' | 'theatrical';
export type EffectiveWatchSurfaceMode = WatchSurfaceMode | 'shorts';
export type WatchSurfaceRailRole = 'navigation' | 'related' | null;

export interface WatchSurfaceLayoutInput {
  kind: WatchSurfaceKind;
  isTheatrical: boolean;
}

export interface WatchSurfaceLayout {
  kind: WatchSurfaceKind;
  effectiveMode: EffectiveWatchSurfaceMode;
  allowModeSwitch: boolean;
  showRail: boolean;
  railRole: WatchSurfaceRailRole;
}

export type CompactWatchSurfaceSection = 'stage' | 'body' | 'rail';
export interface CompactWatchSurfaceSectionDescriptor {
  id: CompactWatchSurfaceSection;
  bordered: boolean;
}

export interface CompactWatchSurfaceOrderInput {
  hasBody: boolean;
  hasRail: boolean;
}

export function resolveWatchSurfaceLayout({
  kind,
  isTheatrical,
}: WatchSurfaceLayoutInput): WatchSurfaceLayout {
  if (kind === 'shorts') {
    return {
      kind,
      effectiveMode: 'shorts',
      allowModeSwitch: false,
      showRail: false,
      railRole: null,
    };
  }

  if (isTheatrical) {
    return {
      kind,
      effectiveMode: 'theatrical',
      allowModeSwitch: true,
      showRail: false,
      railRole: null,
    };
  }

  return {
    kind,
    effectiveMode: 'default',
    allowModeSwitch: true,
    showRail: true,
    railRole: kind === 'series' ? 'navigation' : 'related',
  };
}

export function resolveCompactWatchSurfaceSectionOrder({
  hasBody,
  hasRail,
}: CompactWatchSurfaceOrderInput): CompactWatchSurfaceSection[] {
  const sections: CompactWatchSurfaceSection[] = ['stage'];

  if (hasBody) {
    sections.push('body');
  }

  if (hasRail) {
    sections.push('rail');
  }

  return sections;
}

export function resolveCompactWatchSurfaceSections(
  input: CompactWatchSurfaceOrderInput,
): CompactWatchSurfaceSectionDescriptor[] {
  return resolveCompactWatchSurfaceSectionOrder(input).map((section, index) => ({
    id: section,
    bordered: index > 0,
  }));
}
