import * as React from "react"
import { cn, THEME_CONFIG, ThemeType } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ThemeType | "outline" | "solid";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const isTheme = variant in THEME_CONFIG;
  const config = isTheme ? THEME_CONFIG[variant as ThemeType] : THEME_CONFIG.default;

  const variantStyles = isTheme 
    ? `${config.bg} ${config.text} ${config.border}`
    : variant === "solid" ? "bg-zinc-100 text-zinc-900 border-zinc-100" : "bg-transparent border-zinc-800 text-zinc-500";

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] border transition-colors",
        variantStyles, 
        className
      )} 
      {...props} 
    />
  )
}
