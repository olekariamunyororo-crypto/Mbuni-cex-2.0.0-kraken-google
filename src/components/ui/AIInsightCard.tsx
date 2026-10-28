"use client";

import React, { useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIInsightCardProps {
  title?: string;
  insight: string;
  accent?: "lime" | "purple";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  dismissible?: boolean;
}

export function AIInsightCard({
  title = "AI Market Copilot",
  insight,
  accent = "lime",
  actionLabel,
  onAction,
  className,
  dismissible = true,
}: AIInsightCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const accentColor =
    accent === "lime"
      ? "border-l-primary text-primary"
      : "border-l-cta text-cta";

  return (
    <div
      className={cn(
        "glass-soft rounded-2xl p-4 border-l-4 border-t border-r border-b relative transition-all duration-200",
        accentColor,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
              accent === "lime" ? "bg-primary-soft text-primary" : "bg-cta-soft text-cta"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-semibold tracking-tight text-white uppercase tracking-wider">
            {title}
          </span>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss AI insight"
            className="text-tertiary hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-[13px] text-secondary leading-relaxed mt-2.5 font-normal">
        {insight}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
