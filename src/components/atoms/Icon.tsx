import * as React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  icon: LucideIcon;
}

export function Icon({ icon: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}
