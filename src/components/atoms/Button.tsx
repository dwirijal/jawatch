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

    const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50";
    
    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 px-4 text-xs",
      lg: "h-14 px-10 text-base",
      icon: "h-10 w-10",
    };

    const variants = {
      theme: config ? `${config.primary} ${config.shadow} text-white` : "",
      ghost: "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100",
      outline: "border border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-100",
      link: "text-zinc-400 underline-offset-4 hover:underline",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          baseStyles,
          sizes[size],
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
