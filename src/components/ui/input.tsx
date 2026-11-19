import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 sm:h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[16px] sm:text-[14px] text-[#111827] placeholder:text-[#9CA3AF]",
          "transition-colors focus-visible:outline-none focus-visible:border-[#1E3A8A] focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/15",
          "disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:text-[#6B7280]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
