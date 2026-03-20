import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm shadow-emerald-500/20",
        secondary:
          "border-transparent bg-[#1E3A8A] text-white hover:bg-[#1E40AF] shadow-sm shadow-blue-500/20",
        destructive:
          "border-transparent bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm shadow-red-500/20",
        warning:
          "border-transparent bg-[#F59E0B] text-black hover:bg-[#D97706] shadow-sm shadow-amber-500/20",
        success:
          "border-transparent bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm shadow-emerald-500/20",
        info:
          "border-transparent bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-sm shadow-blue-500/20",
        outline: "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        ghost: "border-transparent text-gray-600 hover:bg-gray-100",
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
