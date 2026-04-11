"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Input, InputProps } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<InputProps, "value" | "onChange"> {
  value?: string | number
  onChange?: (value: string) => void
  prefix?: string
}

export interface CurrencyInputRef {
  focus: () => void
}

// Format raw digits to Brazilian currency (last 2 digits are cents)
const formatToCurrency = (digits: string): string => {
  if (!digits || digits === "0") return ""
  
  // Pad with zeros if less than 3 digits (less than 1 cent)
  const padded = digits.padStart(3, "0")
  
  // Split into integer and decimal parts (last 2 = cents)
  const decimalPart = padded.slice(-2)
  const integerPart = padded.slice(0, -2)
  
  // Format integer part with dots for thousands using Brazilian format
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  
  return `${formattedInteger},${decimalPart}`
}

// Parse currency string to numeric value (in cents)
const parseToCents = (value: string): number => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")
  if (!digits) return 0
  return parseInt(digits, 10)
}

export const CurrencyInput = forwardRef<CurrencyInputRef, CurrencyInputProps>(
  ({ value, onChange, prefix = "R$", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const isFocusedRef = useRef(false)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }))

    // Update display when external value changes
    useEffect(() => {
      if (!isFocusedRef.current && value !== undefined && value !== null) {
        const stringValue = typeof value === "number" ? value.toString() : value
        const cents = parseToCents(stringValue)
        if (cents > 0) {
          setDisplayValue(formatToCurrency(cents.toString()))
        } else {
          setDisplayValue("")
        }
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Keep only digits (allow typing freely)
      const digits = inputValue.replace(/\D/g, "")
      
      // Limit to reasonable length (max 15 digits = billions)
      const limitedDigits = digits.slice(0, 15)
      
      // Format for display while typing
      const formatted = formatToCurrency(limitedDigits)
      setDisplayValue(formatted)
      
      // Send cents value to parent
      if (onChange) {
        const cents = parseToCents(limitedDigits)
        onChange(cents.toString())
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true
      // Select all on focus for easy replacement
      e.target.select()
    }

    const handleBlur = () => {
      isFocusedRef.current = false
      // Format on blur - ensure proper display
      const digits = displayValue.replace(/\D/g, "")
      if (digits) {
        const formatted = formatToCurrency(digits)
        setDisplayValue(formatted)
        
        if (onChange) {
          const cents = parseToCents(digits)
          onChange(cents.toString())
        }
      }
    }

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          ref={inputRef}
          {...props}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={prefix ? "pl-10" : ""}
          placeholder={prefix ? "0,00" : "0,00"}
          inputMode="decimal"
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
