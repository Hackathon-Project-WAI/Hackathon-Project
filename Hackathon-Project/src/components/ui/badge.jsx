import * as React from "react"
import { cva } from "class-variance-authority"

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-slate-50",
        secondary: "border-transparent bg-slate-100 text-slate-900",
        destructive: "border-transparent bg-red-500 text-white",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-amber-500 text-white",
        outline: "text-slate-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

