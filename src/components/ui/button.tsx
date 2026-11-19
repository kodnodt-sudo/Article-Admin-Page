import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#1E3A8A] text-white border border-[#1E3A8A] hover:bg-[#172554] hover:border-[#172554] shadow-sm",
  secondary:
    "bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#FAFAFA] shadow-sm",
  ghost:
    "bg-transparent text-[#6B7280] border border-transparent hover:text-[#111827] hover:bg-[#F3F4F6]",
  danger:
    "bg-[#DC2626] text-white border border-[#DC2626] hover:bg-[#B91C1C] hover:border-[#B91C1C] shadow-sm",
  "danger-outline":
    "bg-white text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-4 text-[14px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
