"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "p-0.5 text-[12px] h-8",
    md: "p-1 text-[13px] h-10",
    lg: "p-1.5 text-[14px] h-12",
  };

  const itemSizeClasses = {
    sm: "py-1 px-2.5 rounded-lg",
    md: "py-1.5 px-3.5 rounded-[10px]",
    lg: "py-2 px-4 rounded-xl",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl bg-surface/80 backdrop-blur-md border border-[var(--color-glass-border)] w-full",
        sizeClasses[size],
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 select-none",
              itemSizeClasses[size],
              active
                ? "bg-elevated text-white shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_var(--color-glass-highlight)] border border-white/10"
                : "text-secondary hover:text-white hover:bg-white/[0.03]"
            )}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 text-[10px] px-1.5 py-0.2 rounded-full tnum",
                  active ? "bg-primary-soft text-primary font-bold" : "bg-white/10 text-secondary"
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "lime" | "purple";
  size?: "sm" | "md";
}

export function Chip({
  className,
  active = false,
  variant = "default",
  size = "sm",
  children,
  ...props
}: ChipProps) {
  const sizeClasses = {
    sm: "h-7 px-3 text-[12px]",
    md: "h-9 px-4 text-[13px]",
  };

  const activeStyles =
    variant === "lime"
      ? "bg-primary-soft text-primary border-primary/30"
      : variant === "purple"
      ? "bg-cta-soft text-white border-cta/30"
      : "bg-white/10 text-white border-white/20";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-medium border transition-all duration-150 active:scale-95 tnum",
        sizeClasses[size],
        active
          ? activeStyles
          : "bg-surface/60 text-secondary border-[var(--color-glass-border)] hover:text-white hover:bg-white/5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
