import * as React from "react";

import { cn } from "../lib/cn";

const variantStyles = {
  neutral: "bg-cyan-50 text-cyan-800",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-cyan-100 text-cyan-800",
} as const;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variantStyles;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
