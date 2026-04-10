import * as React from "react";

import { cn } from "../lib/cn";

type Option = { label: string; value: string };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
};

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-cyan-200 bg-white px-3 text-sm text-cyan-900 focus:border-cyan-500 focus:outline-none",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
