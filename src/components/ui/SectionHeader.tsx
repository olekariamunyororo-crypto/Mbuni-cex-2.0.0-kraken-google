"use client";

import React from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Section Header per Section 6.4 of Mbuni Design System:
 * Title text-[17px] font-bold tracking-tight + optional trailing action / arrow.
 */
export function SectionHeader({
  title,
  subtitle,
  actionText,
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3 mb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-tight text-white">{title}</h2>
        {subtitle && (
          <p className="text-[12px] text-tertiary mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-secondary hover:text-white transition-colors shrink-0 group select-none pb-0.5"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
