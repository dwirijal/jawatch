import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { Ads } from '@/components/atoms/Ads';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { cn, ThemeType } from '@/lib/utils';

interface AdSectionProps {
  title?: string;
  subtitle?: string;
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
  slotClassName?: string;
  theme?: ThemeType;
}

export function AdSection({
  title = 'Partner Spotlight',
  subtitle = 'Promotional placement that follows the same rhythm, spacing, and surface rules as the rest of the product.',
  type = 'horizontal',
  className,
  slotClassName,
  theme,
}: AdSectionProps) {
  return (
    <section data-theme={theme} className={cn('space-y-4', className)}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={Megaphone}
        className="pb-0"
        contentClassName="max-w-3xl"
      />
      <Ads type={type} className={slotClassName} theme={theme} />
    </section>
  );
}
