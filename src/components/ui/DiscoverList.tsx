"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiscoverItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  badge?: string;
  onClick?: () => void;
}

export interface DiscoverListProps {
  items: DiscoverItem[];
  className?: string;
}

/**
 * Feature / Discover List per Section 6.10 of Mbuni Design System:
 * [Icon]  Title
 *         Short description
 * Chevron on the right, soft dividers between rows.
 */
export function DiscoverList({ items, className }: DiscoverListProps) {
  return (
    <div
      className={cn(
        "glass-raised rounded-3xl p-2 border border-[var(--color-glass-border)] divide-y divide-divider/60",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.07] transition-all duration-150 text-left group select-none"
          >
            {/* Icon well */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{
                backgroundColor: item.iconColor ? `${item.iconColor}18` : "rgba(255,255,255,0.06)",
                border: item.iconColor ? `1px solid ${item.iconColor}33` : "1px solid rgba(255,255,255,0.08)",
                color: item.iconColor || "#ffffff",
              }}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white tracking-tight">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/10 text-white tnum">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-tertiary truncate mt-0.5">
                {item.description}
              </p>
            </div>

            {/* Trailing chevron */}
            <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
