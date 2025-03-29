import React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Panel({ className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))] rounded-lg p-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
