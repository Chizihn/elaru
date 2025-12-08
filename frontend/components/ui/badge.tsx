import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] [a&]:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] [a&]:hover:translate-x-[-1px] [a&]:hover:translate-y-[-1px]",
        secondary:
          "bg-secondary text-secondary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] [a&]:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] [a&]:hover:translate-x-[-1px] [a&]:hover:translate-y-[-1px]",
        destructive:
          "bg-destructive text-white border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] [a&]:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] [a&]:hover:translate-x-[-1px] [a&]:hover:translate-y-[-1px]",
        outline:
          "text-foreground border-border bg-background [a&]:hover:bg-muted [a&]:hover:border-primary",
        neon: "bg-primary/10 text-primary border-primary shadow-[0_0_10px_rgba(0,229,229,0.4)] [a&]:hover:shadow-[0_0_15px_rgba(0,229,229,0.6)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
