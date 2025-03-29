"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto", {
  variants: {
    width: {
      default: "max-w-7xl",
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      full: "max-w-full",
    },
    padding: {
      none: "px-0",
      default: "px-4 sm:px-6 lg:px-8",
      tight: "px-2 sm:px-4",
      wide: "px-6 sm:px-8 lg:px-12",
    },
  },
  defaultVariants: {
    width: "default",
    padding: "default",
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: React.ElementType;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, width, padding, as: Component = "div", ...props }, ref) => {
    const Comp = Component as React.ElementType;
    return (
      <Comp
        ref={ref}
        className={cn(containerVariants({ width, padding }), className)}
        {...props}
      />
    );
  },
);
Container.displayName = "Container";

export { Container, containerVariants };
