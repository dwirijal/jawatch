import * as React from "react";
import { cn, THEME_CONFIG, type ThemeType } from "@/lib/utils";

type BadgeVariant = ThemeType | "outline" | "solid" | "status";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const BADGE_VARIANTS: Record<Exclude<BadgeVariant, ThemeType>, string> = {
  outline: "border-border-subtle bg-surface-1 text-muted-foreground",
  solid: "border-transparent bg-foreground text-background shadow-[0_18px_40px_-28px_var(--shadow-color)]",
  status: "border-transparent bg-accent-soft text-foreground",
};

export function Badge({ className, variant = "outline", ...props }: BadgeProps) {
  const isThemeVariant = variant in THEME_CONFIG;
  const config = isThemeVariant ? THEME_CONFIG[variant as ThemeType] : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--space-2xs)] rounded-full border px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black uppercase leading-[var(--type-line-tight)] tracking-[var(--type-tracking-kicker)] transition-[background,border-color,color,transform] duration-200",
        isThemeVariant
          ? cn(config?.bg, config?.text, config?.border)
          : BADGE_VARIANTS[variant as Exclude<BadgeVariant, ThemeType>],
        className,
      )}
      {...props}
    />
  );
}
