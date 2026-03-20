import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#22C55E] text-white hover:bg-[#4ADE80] hover:shadow-lg hover:shadow-[#22C55E]/30 hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-[#EF4444] text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]",
        outline: "border border-[#1E3A8A] bg-white text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white border-2 hover:border-[#22C55E]",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] active:scale-[0.98]",
        link: "text-[#22C55E] underline-offset-4 hover:underline hover:text-[#4ADE80]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
