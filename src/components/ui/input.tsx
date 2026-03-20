import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show password toggle button */
  showPasswordToggle?: boolean
  /** Error state */
  error?: string
  /** Success state */
  success?: boolean
  /** Hint text below input */
  hint?: string
  /** Dark variant for dark backgrounds */
  dark?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showPasswordToggle, error, success, hint, dark = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type
    
    // Adjust styles based on dark prop
    const placeholderColor = dark ? "placeholder:text-white/40" : "placeholder:text-gray-400"
    const bgColor = dark ? "bg-white/5" : "bg-white"
    const textColor = dark ? "text-white" : "text-gray-900"
    const borderColor = dark ? "border-white/20" : "border-gray-300"
    const focusBg = dark ? "focus:bg-white/10" : "focus:bg-white"
    const iconColor = dark ? "text-white/40" : "text-gray-400"
    const iconFocusColor = dark ? "group-focus-within:text-[#22C55E]" : ""

    return (
      <div className="relative">
        <input
          type={inputType}
          className={cn(
            "flex h-11 w-full rounded-lg border px-4 py-2 text-sm transition-all duration-300",
            placeholderColor,
            bgColor,
            textColor,
            borderColor,
            // Base styles
            "focus:outline-none focus:ring-2",
            focusBg,
            // State styles
            error
              ? dark 
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" 
                : "border-red-400 focus:border-red-500 focus:ring-red-500/20 focus:shadow-red-500/10"
              : success
              ? dark
                ? "border-green-400 focus:border-green-500 focus:ring-green-500/20"
                : "border-green-400 focus:border-green-500 focus:ring-green-500/20 focus:shadow-green-500/10"
              : dark
              ? "focus:border-[#22C55E] focus:ring-[#22C55E]/20"
              : "border-gray-300 focus:border-[#22C55E] focus:ring-[#22C55E]/30 focus:shadow-[#22C55E]/10",
            // Focus shadow (only for light mode)
            !dark && "focus:shadow-lg",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Password toggle */}
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none",
              dark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-600",
              dark && "focus:text-[#22C55E]",
              !dark && "focus:text-[#22C55E]"
            )}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
        {/* Error icon - adjusted for dark background */}
        {error && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 flex items-center",
            dark && "text-red-400"
          )}>
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        {/* Success icon - adjusted for dark background */}
        {success && !error && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            dark && "text-green-400"
          )}>
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {/* Hint text */}
        {hint && !error && (
          <p className={cn(
            "text-xs mt-1",
            dark ? "text-white/50" : "text-gray-500"
          )}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
