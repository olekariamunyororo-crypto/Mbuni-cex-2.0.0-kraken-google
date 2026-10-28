"use client";

import React from "react";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";
import { cn } from "@/lib/utils";

export interface OstrichProps {
  className?: string;
  size?: number | string;
}

export function Ostrich({ className, size = 32 }: OstrichProps) {
  return (
    <div
      className={cn("text-primary inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <OstrichLogo className="w-full h-full" />
    </div>
  );
}

export default Ostrich;
