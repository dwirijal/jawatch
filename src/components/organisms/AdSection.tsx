import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { Ads } from '@/components/atoms/Ads';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { cn } from '@/lib/utils';

interface AdSectionProps {
  title?: string;
  subtitle?: string;
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
  slotClassName?: string;
}

export function AdSection({
  title = 'Sponsored',
  subtitle = 'Reserved inventory that follows the same layout, spacing, and surface rules as the rest of the product.',
  type = 'horizontal',
  className,
  slotClassName,
}: AdSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={Megaphone}
        className="pb-0"
        contentClassName="max-w-3xl"
      />
      <Ads type={type} className={slotClassName} />
    </section>
  );
}
