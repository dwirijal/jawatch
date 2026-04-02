import { StaticCastCard, type CastItem } from '@/components/atoms/StaticCastCard';
import { ThemeType } from '@/lib/utils';

export type { CastItem } from '@/components/atoms/StaticCastCard';

interface CastRailProps {
  items: CastItem[];
  theme: Extract<ThemeType, 'anime' | 'movie'>;
  layout?: 'grid' | 'scroll';
}

export function CastRail({ items, theme, layout = 'grid' }: CastRailProps) {
  if (layout === 'scroll') {
    return (
      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-start gap-3 pb-1">
          {items.map((item) => (
            <StaticCastCard key={item.id} item={item} theme={theme} layout="scroll" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => <StaticCastCard key={item.id} item={item} theme={theme} layout="grid" />)}
    </div>
  );
}
