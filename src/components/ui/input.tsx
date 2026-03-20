import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `
          flex h-11 w-full rounded-lg 
          border border-gray-200 bg-white 
          px-4 py-2 text-sm 
          placeholder:text-gray-400 
          transition-all duration-200
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 
          focus:border-emerald-500 focus:shadow-sm focus:shadow-emerald-500/10
          disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 disabled:hover:border-gray-200
          `,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
