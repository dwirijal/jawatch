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
  xs: "text-[11px] uppercase tracking-[0.2em] font-bold",
  sm: "text-xs leading-relaxed",
  base: "text-[15px] leading-relaxed",
  lg: "text-lg leading-relaxed tracking-tight",
  xl: "text-xl leading-snug tracking-tight font-medium",
  "2xl": "text-2xl leading-snug tracking-tight font-medium",
  "3xl": "text-3xl leading-tight tracking-tight font-[var(--font-heading)] font-medium",
  "4xl": "text-4xl md:text-5xl leading-[1.1] tracking-[-0.04em] font-[var(--font-heading)]",
  "5xl": "text-5xl md:text-7xl leading-[1.02] tracking-[-0.055em] font-[var(--font-heading)]",
  "6xl": "text-6xl md:text-8xl leading-[0.95] tracking-[-0.065em] font-[var(--font-heading)]",
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
