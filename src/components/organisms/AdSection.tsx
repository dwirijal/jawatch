'use client';

import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { Ads } from '@/components/atoms/Ads';
import { AdRenderState, getAdSectionRenderState, normalizeAdSectionSlotCount } from '@/lib/ad-section-visibility';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { cn, ThemeType } from '@/lib/utils';

export interface AdSectionProps {
  title?: string;
  subtitle?: string;
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
  slotClassName?: string;
  theme?: ThemeType;
  count?: number;
}

export function AdSection({
  title = 'Sponsor pilihan',
  subtitle = 'Iklan ditampilkan secukupnya untuk membantu biaya server tanpa mengganggu sesi nonton atau baca.',
  type = 'horizontal',
  className,
  slotClassName,
  theme,
  count,
}: AdSectionProps) {
  const slotCount = normalizeAdSectionSlotCount(count);
  const [slotStatuses, setSlotStatuses] = React.useState<AdRenderState[]>(() => Array.from({ length: slotCount }, () => 'pending'));

  React.useEffect(() => {
    setSlotStatuses(Array.from({ length: slotCount }, () => 'pending'));
  }, [slotCount, type, theme]);

  const renderState = getAdSectionRenderState(slotStatuses);

  const handleStatusChange = React.useCallback((index: number, status: AdRenderState) => {
    setSlotStatuses((current) => {
      if (current[index] === status) {
        return current;
      }

      const next = [...current];
      next[index] = status;
      return next;
    });
  }, []);

  if (renderState.settled && !renderState.visible) {
    return null;
  }

  const slotsClassName = cn(
    'grid gap-4',
    slotCount === 2 && type !== 'vertical' && 'md:grid-cols-2',
    slotCount === 2 && type === 'vertical' && 'xl:grid-cols-2',
  );

  return (
    <section data-theme={theme} className={cn('space-y-4', className)}>
      {renderState.visible ? (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          icon={Megaphone}
          className="pb-0"
          contentClassName="max-w-3xl"
        />
      ) : null}
      <div className={slotsClassName}>
        {Array.from({ length: slotCount }, (_, index) => (
          <Ads
            key={`${type}-${index}`}
            type={type}
            className={slotClassName}
            theme={theme}
            onStatusChange={(status) => handleStatusChange(index, status)}
          />
        ))}
      </div>
    </section>
  );
}
