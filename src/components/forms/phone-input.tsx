"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface PhoneInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Format phone: 11999999999 -> (11) 99999-9999
 */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Validate Brazilian phone (must have 10 or 11 digits)
 */
function validatePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  // Accepts: (11) 99999-9999 (11 digits) or (11) 9999-9999 (10 digits)
  return digits.length >= 10 && digits.length <= 11
}

export function PhoneInput({
  label = "Telefone",
  value,
  onChange,
  error,
  placeholder = "(11) 99999-9999",
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    onChange(formatted)
    setLocalError(null)
  }

  const handleBlur = () => {
    const digits = value.replace(/\D/g, "")
    if (digits.length === 0) {
      if (required) {
        setLocalError("Telefone é obrigatório")
      }
      return
    }
    
    if (!validatePhone(value)) {
      setLocalError("Telefone inválido")
    }
  }

  const displayError = error || localError
  const digits = value.replace(/\D/g, "")
  const isValid = digits.length >= 10 && digits.length <= 11 && !displayError

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id="phone"
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={displayError ? "border-red-500 focus:border-red-500" : ""}
      />
      {displayError && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
      {isValid && (
        <p className="text-xs text-green-600">
          {digits.length === 11 ? "Celular (com DDD)" : "Fixo (com DDD)"}
        </p>
      )}
    </div>
  )
}
