import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn, THEME_CONFIG, ThemeType } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeType | "ghost" | "outline" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const config = (variant in THEME_CONFIG) ? THEME_CONFIG[variant as ThemeType] : null;

    const baseStyles = "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-black tracking-[0.02em] transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";
    
    const sizes = {
      default: "h-10 px-4.5 py-2",
      sm: "h-8 px-3.5 text-[11px]",
      lg: "h-12 px-6 text-sm",
      icon: "h-10 w-10",
    };

    const variants = {
      theme: config ? `${config.primary} text-white hard-shadow-sm hover:brightness-110` : "",
      ghost: "bg-transparent text-zinc-400 hover:bg-surface-1 hover:text-white",
      outline: "border border-border-subtle bg-surface-1 text-zinc-100 hover:bg-surface-elevated hover:text-white",
      link: "h-auto rounded-none px-0 py-0 text-zinc-400 underline-offset-4 hover:text-white hover:underline",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          baseStyles,
          variant !== "link" && sizes[size],
          config ? variants.theme : variants[variant as keyof typeof variants],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
