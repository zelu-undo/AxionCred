"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface DocumentInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Format CPF: 12345678901 -> 123.456.789-01
 */
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Format CNPJ: 12345678901234 -> 12.345.678/9012-34
 */
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/**
 * Detect if value looks like CNPJ (14 digits) or CPF (11 digits)
 */
function detectType(value: string): "cpf" | "cnpj" | "unknown" {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 14) return "cnpj"
  if (digits.length === 11) return "cpf"
  return "unknown"
}

/**
 * Validate CPF using standard algorithm
 */
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let remainder = sum % 11
  const firstCheck = remainder < 2 ? 0 : 11 - remainder
  if (parseInt(digits[9]) !== firstCheck) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  remainder = sum % 11
  const secondCheck = remainder < 2 ? 0 : 11 - remainder
  return parseInt(digits[10]) === secondCheck
}

/**
 * Validate CNPJ using standard algorithm
 */
function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  // Check first digit
  let sum = 0
  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights[i]
  }
  let remainder = sum % 11
  const firstCheck = remainder < 2 ? 0 : 11 - remainder
  if (parseInt(digits[12]) !== firstCheck) return false

  // Check second digit
  sum = 0
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i]
  }
  remainder = sum % 11
  const secondCheck = remainder < 2 ? 0 : 11 - remainder
  return parseInt(digits[13]) === secondCheck
}

export function DocumentInput({
  label = "CPF/CNPJ",
  value,
  onChange,
  error,
  placeholder = "000.000.000-00",
  required = false,
  disabled = false,
}: DocumentInputProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj" | "unknown">("unknown")

  // Update document type when value changes
  useEffect(() => {
    setDocumentType(detectType(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const type = detectType(inputValue)
    
    let formatted = inputValue
    if (type === "cnpj") {
      formatted = formatCNPJ(inputValue)
    } else if (type === "cpf") {
      formatted = formatCPF(inputValue)
    } else {
      // While typing, show formatted as CPF until it has 12+ digits
      const digits = inputValue.replace(/\D/g, "")
      if (digits.length < 12) {
        formatted = formatCPF(inputValue)
      } else {
        formatted = formatCNPJ(inputValue)
      }
    }
    
    onChange(formatted)
    setLocalError(null)
  }

  const handleBlur = () => {
    const digits = value.replace(/\D/g, "")
    if (digits.length === 0) {
      if (required) {
        setLocalError("Documento é obrigatório")
      }
      return
    }
    
    if (digits.length === 11) {
      if (!validateCPF(value)) {
        setLocalError("CPF inválido")
      }
    } else if (digits.length === 14) {
      if (!validateCNPJ(value)) {
        setLocalError("CNPJ inválido")
      }
    } else if (digits.length > 0 && digits.length < 11) {
      setLocalError("CPF incompleto")
    } else if (digits.length > 11 && digits.length < 14) {
      setLocalError("CNPJ incompleto")
    }
  }

  const displayError = error || localError

  return (
    <div className="space-y-2">
      <Label htmlFor="document">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id="document"
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
      {documentType === "cpf" && value.replace(/\D/g, "").length === 11 && !displayError && (
        <p className="text-xs text-green-600">CPF válido</p>
      )}
      {documentType === "cnpj" && value.replace(/\D/g, "").length === 14 && !displayError && (
        <p className="text-xs text-green-600">CNPJ válido</p>
      )}
    </div>
  )
}
