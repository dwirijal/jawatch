import * as React from "react";
import { cn, THEME_CONFIG, type ThemeType } from "@/lib/utils";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  variant?: ThemeType;
  gradient?: boolean;
  italic?: boolean;
  outline?: boolean;
  uppercase?: boolean;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
}

const SIZE_CLASS = {
  xs: "text-[var(--type-size-xs)] uppercase leading-[var(--type-line-tight)] tracking-[var(--type-tracking-kicker)] font-bold",
  sm: "text-[var(--type-size-sm)] leading-[var(--type-line-body)] tracking-[var(--type-tracking-normal)]",
  base: "text-[var(--type-size-base)] leading-[var(--type-line-body)] tracking-[var(--type-tracking-normal)]",
  lg: "text-[var(--type-size-lg)] leading-[var(--type-line-relaxed)] tracking-[var(--type-tracking-normal)]",
  xl: "text-[var(--type-size-xl)] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-medium",
  "2xl": "text-[var(--type-size-2xl)] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-medium",
  "3xl": "text-[var(--type-size-3xl)] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-[var(--font-heading)] font-medium",
  "4xl": "text-[var(--type-size-4xl)] md:text-[var(--type-size-section-title)] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-[var(--font-heading)]",
  "5xl": "text-[var(--type-size-display)] md:text-[var(--type-size-display)] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-[var(--font-heading)]",
  "6xl": "text-[var(--type-size-display)] md:text-[calc(var(--type-size-display)+var(--type-size-xl))] leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] font-[var(--font-heading)]",
} as const;

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      as: Component = "p",
      variant = "default",
      gradient = false,
      italic = false,
      outline = false,
      uppercase = false,
      size,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const config = THEME_CONFIG[variant] || THEME_CONFIG.default;
    const isHeading = Component.startsWith("h");

    return (
      <Component
        ref={ref as never}
        className={cn(
          "transition-colors duration-200",
          isHeading ? "text-foreground" : "text-muted-foreground",
          italic && "italic",
          uppercase && "uppercase",
          size && SIZE_CLASS[size],
          gradient &&
            "bg-[linear-gradient(135deg,var(--foreground)_0%,color-mix(in_srgb,var(--foreground)_66%,var(--accent)_34%)_100%)] bg-clip-text text-transparent",
          outline && "text-transparent",
          !gradient && variant !== "default" && !outline && config.text,
          className,
        )}
        style={outline ? { WebkitTextStroke: "1px var(--foreground)" } : undefined}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Typography.displayName = "Typography";
