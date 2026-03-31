import * as React from "react"
import { cn, THEME_CONFIG, ThemeType } from "@/lib/utils"

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  variant?: ThemeType;
  gradient?: boolean;
  italic?: boolean;
  outline?: boolean;
  uppercase?: boolean;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(({
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
}, ref) => {
  const config = THEME_CONFIG[variant] || THEME_CONFIG.default;
  const isHeading = Component.startsWith("h");

  const sizeMap = {
    xs: "text-[10px] leading-tight",
    sm: "text-xs leading-tight",
    base: "text-sm leading-snug",
    lg: "text-lg tracking-[-0.012em] leading-[1.2]",
    xl: "text-xl tracking-[-0.016em] leading-[1.12]",
    "2xl": "text-2xl tracking-[-0.02em] leading-[1.08]",
    "3xl": "text-3xl tracking-[-0.024em] leading-[1.02]",
    "4xl": "text-4xl md:text-5xl tracking-[-0.028em] leading-[0.98] font-[var(--font-heading)]",
    "5xl": "text-5xl md:text-7xl tracking-[-0.03em] leading-[0.95] font-[var(--font-heading)]",
    "6xl": "text-6xl md:text-8xl tracking-[-0.036em] leading-[0.92] font-[var(--font-heading)]",
  };

  const variableStyles = {
    "4xl": { fontVariationSettings: '"wght" 800, "wdth" 105' },
    "5xl": { fontVariationSettings: '"wght" 850, "wdth" 110' },
    "6xl": { fontVariationSettings: '"wght" 900, "wdth" 115' },
  };

  const baseStyles = cn(
    "transition-colors duration-300",
    isHeading ? "font-extrabold text-white/95" : "font-medium text-zinc-300"
  );
  // Handle gradient logic
  const gradientStyles = gradient
    ? `bg-gradient-to-b ${config.primary.replace('bg-', 'from-')} to-white/20 bg-clip-text text-transparent`
    : config.text;

  const sharedProps = {
    className: cn(
      baseStyles,
      italic && "italic",
      uppercase && "uppercase",
      size && sizeMap[size],
      !gradient && !outline && isHeading && config.text,
      gradient && gradientStyles,
      outline && "text-transparent",
      className
    ),
    style: {
      ...(outline ? { WebkitTextStroke: `1px var(--color-foreground, #fafafa)` } : {}),
      ...(size && variableStyles[size as keyof typeof variableStyles] ? variableStyles[size as keyof typeof variableStyles] : {}),
    },
    ...props,
  };

  if (!isHeading) {
    return <Component {...sharedProps}>{children}</Component>;
  }

  return (
    <Component
      ref={ref as React.Ref<HTMLHeadingElement>}
      {...sharedProps}
    >
      {children}
    </Component>
  )
});
Typography.displayName = "Typography";
