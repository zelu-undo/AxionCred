import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#22C55E] text-white hover:bg-[#4ADE80]",
        secondary: "border-transparent bg-[#1E3A8A] text-white hover:bg-[#2A4A9F]",
        destructive: "border-transparent bg-[#EF4444] text-white hover:bg-red-600",
        warning: "border-transparent bg-[#F59E0B] text-black hover:bg-yellow-500",
        success: "border-transparent bg-[#22C55E] text-white hover:bg-[#4ADE80]",
        outline: "text-[#1E3A8A] border-[#1E3A8A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
