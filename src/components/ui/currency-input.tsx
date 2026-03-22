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

const formatCurrencyValue = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")
  
  if (!digits) return ""
  
  // Convert to number and divide by 100 to get cents
  const numberValue = parseInt(digits, 10) / 100
  
  // Format as Brazilian currency
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const parseCurrencyValue = (value: string): number => {
  const digits = value.replace(/\D/g, "")
  return parseInt(digits, 10) / 100
}

export const CurrencyInput = forwardRef<CurrencyInputRef, CurrencyInputProps>(
  ({ value, onChange, prefix = "R$", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }))

    useEffect(() => {
      if (value !== undefined && value !== null) {
        const stringValue = typeof value === "number" ? value.toString() : value
        setDisplayValue(formatCurrencyValue(stringValue))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Allow only digits and comma
      const filtered = inputValue.replace(/[^\d,]/g, "")
      
      setDisplayValue(filtered)
      
      if (onChange) {
        const numericValue = parseCurrencyValue(filtered)
        onChange(numericValue.toString())
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus for easy replacement
      e.target.select()
    }

    const handleBlur = () => {
      // Format on blur
      if (displayValue) {
        const formatted = formatCurrencyValue(displayValue)
        setDisplayValue(formatted)
        
        if (onChange) {
          const numericValue = parseCurrencyValue(displayValue)
          onChange(numericValue.toString())
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
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
