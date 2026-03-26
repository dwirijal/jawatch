import * as React from "react"
import { cn, THEME_CONFIG, ThemeType } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ThemeType | "outline" | "solid";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const isTheme = variant in THEME_CONFIG;
  const config = isTheme ? THEME_CONFIG[variant as ThemeType] : THEME_CONFIG.default;

  const variantStyles = isTheme 
    ? `${config.bg} ${config.text} ${config.border}`
    : variant === "solid" ? "border-white bg-white text-zinc-950" : "border-border-subtle bg-surface-1 text-zinc-400";

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase leading-none tracking-[0.16em] transition-colors",
        variantStyles, 
        className
      )} 
      {...props} 
    />
  )
}
