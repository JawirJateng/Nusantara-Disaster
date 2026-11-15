import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-surface text-ink border border-line hover:bg-surface-muted",
        primary:
          "bg-forest-700 text-surface hover:bg-forest-600 active:bg-forest-800",
        secondary:
          "bg-mint-100 text-forest-900 hover:bg-mint-200 active:bg-mint-300",
        accent:
          "bg-sage-400 text-forest-900 hover:bg-sage-300 active:bg-sage-500",
        ghost:
          "text-ink hover:bg-surface-muted",
        outline:
          "bg-transparent text-forest-800 border-2 border-sage-400 hover:bg-mint-100",
        destructive:
          "bg-danger text-surface hover:bg-danger/90",
        link:
          "text-forest-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };