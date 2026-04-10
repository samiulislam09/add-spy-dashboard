import * as React from "react";

import { cn } from "../lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-cyan-200 bg-white px-3 text-sm text-cyan-950 placeholder:text-cyan-500 focus:border-cyan-500 focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
