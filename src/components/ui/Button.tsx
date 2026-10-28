"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        // Design system Section 6.1 variants:
        // Primary: Solid purple or white, 52px height for lg, high-contrast
        primary:
          "bg-cta text-white hover:bg-cta-hover shadow-[0_4px_20px_rgba(127,102,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] font-semibold",
        "primary-white":
          "bg-white text-black hover:bg-white/90 shadow-[0_4px_16px_rgba(255,255,255,0.15)] font-semibold",
        // Secondary: Dark glass pill (bg-surface + border), white text
        secondary:
          "bg-surface/80 border border-[var(--color-glass-border)] text-white hover:bg-surface hover:border-white/20 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_var(--color-glass-highlight)] font-semibold",
        // Tertiary: Text only / underline
        tertiary:
          "bg-transparent text-secondary hover:text-white underline-offset-4 hover:underline border-0 font-medium px-2 shadow-none active:scale-100",
        // Destructive: Red text or soft red background
        destructive:
          "border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25 shadow-[0_4px_16px_rgba(255,92,92,0.15)] font-semibold",
        danger:
          "border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25 shadow-[0_4px_16px_rgba(255,92,92,0.15)] font-semibold",
        // Outline & Ghost
        outline:
          "bg-transparent border border-[var(--color-glass-border)] text-white hover:bg-white/5 shadow-[inset_0_1px_0_var(--color-glass-highlight)]",
        ghost:
          "bg-transparent text-primary hover:bg-primary/10 border-0",
        // Icon: Circular glass well
        icon:
          "rounded-full p-2.5 bg-surface/80 border border-[var(--color-glass-border)] text-secondary hover:text-white hover:bg-surface active:scale-95 shadow-[inset_0_1px_0_var(--color-glass-highlight)]",
        // Backward compatibility
        default:
          "bg-cta text-white hover:bg-cta-hover shadow-[0_4px_20px_rgba(127,102,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] font-semibold",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-[52px] px-6 text-[16px] rounded-[14px]",
        md: "h-11 px-5 text-[15px] rounded-xl",
        sm: "h-9 px-4 text-[13px] rounded-xl",
        default: "h-11 px-5 text-[15px] rounded-xl",
        icon: "h-10 w-10 p-0 rounded-full",
      },
      pill: {
        true: "rounded-full",
        false: "",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      pill: false,
    },
  }
);

export type ButtonVariant =
  | "primary"
  | "primary-white"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "danger"
  | "outline"
  | "ghost"
  | "icon"
  | "default"
  | "link";

export type ButtonSize = "lg" | "md" | "sm" | "default" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  pill?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      pill = false,
      asChild = false,
      loading = false,
      fullWidth = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({
            variant: variant as any,
            size: size as any,
            pill,
            fullWidth,
            className,
          })
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export default Button;
