import * as React from "react"
import { cn, THEME_CONFIG, ThemeType } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ThemeType | "outline" | "solid";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const isTheme = variant in THEME_CONFIG;
  const config = isTheme ? THEME_CONFIG[variant as ThemeType] : THEME_CONFIG.default;

  const variantStyles = isTheme 
    ? `${config.bg} ${config.text} ${config.border} backdrop-blur-md`
    : variant === "solid" 
      ? "border-white bg-white text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
      : "border-white/10 bg-white/5 text-zinc-300 backdrop-blur-sm";

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-2.5 py-1 text-[9px] font-black uppercase leading-none tracking-[0.2em] transition-all",
        "relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/10 after:to-transparent after:opacity-0 hover:after:opacity-100",
        variantStyles, 
        className
      )} 
      {...props} 
    />
  )
}
