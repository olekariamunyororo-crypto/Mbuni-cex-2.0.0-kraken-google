"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PageProps {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
  header?: React.ReactNode;
}

export function Page({ children, wide = false, className, header }: PageProps) {
  return (
    <div className="min-h-screen bg-bg text-foreground flex flex-col justify-start">
      {header && <div className="sticky top-0 z-30">{header}</div>}
      <main
        className={cn(
          "w-full mx-auto px-4 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 transition-all duration-200",
          wide ? "max-w-md md:max-w-6xl" : "max-w-md",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
