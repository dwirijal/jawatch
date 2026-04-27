import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn, THEME_CONFIG, type ThemeType } from "@/lib/utils";

type ButtonVariant =
  | ThemeType
  | "primary"
  | "secondary"
  | "quiet"
  | "ghost"
  | "media"
  | "danger"
  | "outline"
  | "link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-[var(--size-control-md)] px-[var(--space-md)] text-[var(--type-size-sm)]",
  sm: "h-[var(--size-control-sm)] px-[var(--space-sm)] text-[var(--type-size-xs)]",
  lg: "h-[var(--size-control-lg)] px-[var(--space-lg)] text-[var(--type-size-sm)] md:h-[calc(var(--size-control-lg)+var(--space-xs))] md:px-[var(--space-xl)] md:text-[var(--type-size-base)]",
  icon: "h-[var(--size-touch)] w-[var(--size-touch)]",
};

const VARIANT_CLASS: Record<Exclude<ButtonVariant, ThemeType>, string> = {
  primary:
    "border-transparent bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-strong)_100%)] text-[var(--accent-contrast)] shadow-[0_24px_55px_-36px_var(--shadow-color-strong)] hover:-translate-y-0.5 hover:brightness-[1.03]",
  secondary:
    "border-border-subtle bg-surface-elevated text-foreground shadow-[0_18px_38px_-34px_var(--shadow-color)] hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-1",
  quiet:
    "border-transparent bg-accent-soft text-foreground hover:-translate-y-0.5 hover:bg-surface-1",
  ghost:
    "border-transparent bg-transparent text-muted-foreground hover:border-border-subtle hover:bg-surface-1 hover:text-foreground",
  media:
    "border-white/12 bg-surface-1/34 text-[var(--accent-contrast)] shadow-[0_28px_70px_-42px_color-mix(in_srgb,var(--shadow-color-strong)_70%,transparent)] backdrop-blur-xl hover:bg-surface-1/48",
  danger:
    "border-transparent bg-[var(--signal-danger)] text-[var(--signal-danger-contrast)] shadow-[0_22px_50px_-34px_var(--signal-danger)] hover:-translate-y-0.5 hover:brightness-[1.05]",
  outline:
    "border-border-strong bg-transparent text-foreground hover:border-border-strong hover:bg-surface-1",
  link: "h-auto rounded-none border-transparent bg-transparent px-0 py-0 text-foreground hover:text-[var(--accent-strong)]",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isThemeVariant = variant in THEME_CONFIG;
    const themeConfig = isThemeVariant ? THEME_CONFIG[variant as ThemeType] : null;

    return (
      <Comp
        ref={ref}
        className={cn(
          "focus-tv inline-flex shrink-0 cursor-pointer items-center justify-center gap-[var(--space-xs)] rounded-[var(--radius-md)] border font-semibold tracking-[var(--type-tracking-normal)] transition-[background,border-color,color,box-shadow,transform,filter] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variant !== "link" && SIZE_CLASS[size],
          isThemeVariant
            ? cn(
                "border-transparent hover:-translate-y-0.5 hover:brightness-[1.03]",
                themeConfig?.primary,
                themeConfig?.contrast,
                themeConfig?.shadow,
              )
            : VARIANT_CLASS[variant as Exclude<ButtonVariant, ThemeType>],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
