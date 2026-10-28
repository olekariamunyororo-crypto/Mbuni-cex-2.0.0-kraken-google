"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  variant?: "default" | "error" | "success" | "warning";
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, hint, prefix, suffix, variant = "default", disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const variantBorder =
      error || variant === "error"
        ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
        : variant === "success"
        ? "border-success focus-within:border-success focus-within:ring-success/20"
        : variant === "warning"
        ? "border-warning focus-within:border-warning focus-within:ring-warning/20"
        : "border-[var(--color-glass-border)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(163,230,53,0.15)]";

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-secondary">
            {label}
          </label>
        )}
        <div
          className={cn(
            "h-[52px] px-3.5 rounded-xl flex items-center gap-2 bg-surface/80 backdrop-blur-md border transition-all duration-150",
            variantBorder,
            disabled ? "opacity-40 cursor-not-allowed" : "",
            className
          )}
        >
          {prefix && <div className="text-secondary shrink-0">{prefix}</div>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent text-[16px] text-white placeholder:text-muted outline-none tnum"
            {...props}
          />
          {suffix && <div className="text-secondary shrink-0">{suffix}</div>}
        </div>
        {error ? (
          <p className="text-[12px] text-danger font-medium mt-1">{error}</p>
        ) : hint ? (
          <p className="text-[12px] text-tertiary mt-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = "TextField";
