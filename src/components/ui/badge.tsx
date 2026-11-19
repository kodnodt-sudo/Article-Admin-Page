import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "published" | "draft";
}

const badgeStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[#FAFAFA] text-[#4B5563] border-[#E5E7EB]",
  published: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]",
  draft: "bg-[#FAFAFA] text-[#4B5563] border-[#E5E7EB]",
};

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[12px] font-medium leading-4",
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
