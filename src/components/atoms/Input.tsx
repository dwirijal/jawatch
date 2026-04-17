import * as React from "react";
import { cn } from "@/lib/utils";

type InputVariant = "default" | "search" | "auth" | "inline-filter";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

const INPUT_VARIANTS: Record<InputVariant, string> = {
  default:
    "border-border-subtle bg-surface-1 text-foreground placeholder:text-muted-foreground focus:border-[color:var(--accent)]",
  search:
    "border-transparent bg-transparent text-foreground placeholder:text-muted-foreground focus:border-transparent",
  auth:
    "border-border-subtle bg-surface-elevated text-foreground placeholder:text-muted-foreground focus:border-[color:var(--accent)]",
  "inline-filter":
    "border-border-subtle bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[color:var(--accent)]",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "focus-tv flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-2 text-sm shadow-[0_12px_26px_-24px_var(--shadow-color)] outline-none transition-[background,border-color,color,box-shadow] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          INPUT_VARIANTS[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
