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
    lg: "text-lg tracking-[-0.018em] leading-snug",
    xl: "text-xl tracking-[-0.02em] leading-[1.04]",
    "2xl": "text-2xl tracking-[-0.022em] leading-[1.02]",
    "3xl": "text-3xl tracking-[-0.025em] leading-none",
    "4xl": "text-4xl md:text-5xl tracking-[-0.03em] leading-none",
    "5xl": "text-5xl md:text-7xl tracking-[-0.032em] leading-[0.94]",
    "6xl": "text-6xl md:text-8xl tracking-[-0.05em] leading-[0.9]",
  };

  const baseStyles = cn(
    "transition-colors duration-300",
    isHeading ? "font-black tracking-tight text-white" : "font-medium text-zinc-300"
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
    style: outline ? { WebkitTextStroke: `1px var(--color-foreground, #fafafa)` } : {},
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
