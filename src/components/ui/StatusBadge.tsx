"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusType = "success" | "warning" | "danger" | "neutral" | "brand";

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const styles: Record<StatusType, { bg: string; text: string; dotColor: string }> = {
    success: {
      bg: "bg-success-soft border-success/30",
      text: "text-primary",
      dotColor: "bg-primary",
    },
    warning: {
      bg: "bg-warning-soft border-warning/30",
      text: "text-warning",
      dotColor: "bg-warning",
    },
    danger: {
      bg: "bg-danger-soft border-danger/30",
      text: "text-danger",
      dotColor: "bg-danger",
    },
    neutral: {
      bg: "bg-white/5 border-white/10",
      text: "text-secondary",
      dotColor: "bg-muted",
    },
    brand: {
      bg: "bg-cta-soft border-cta/30",
      text: "text-cta-hover",
      dotColor: "bg-cta",
    },
  };

  const current = styles[status] || styles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border",
        current.bg,
        current.text,
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dotColor, status === "success" ? "live-dot" : "")}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
