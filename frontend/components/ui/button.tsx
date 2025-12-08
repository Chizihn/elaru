import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer border-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(0,229,229,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,229,229,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        destructive:
          "bg-destructive text-destructive-foreground border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(255,51,51,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,51,51,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        outline:
          "border-3 border-border bg-background shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:bg-muted hover:shadow-[5px_5px_0px_0px_rgba(0,229,229,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        secondary:
          "bg-secondary text-secondary-foreground border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(255,51,133,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,51,133,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        ghost: "border-0 hover:bg-muted hover:text-foreground",
        link: "border-0 text-primary underline-offset-4 hover:underline normal-case",
        neon: "bg-transparent border-3 border-primary text-primary shadow-[0_0_10px_rgba(0,229,229,0.4)] hover:shadow-[0_0_20px_rgba(0,229,229,0.7)] hover:bg-primary/10",
        gradient:
          "bg-gradient-to-br from-primary via-secondary to-accent text-background border-3 border-foreground shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
