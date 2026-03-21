"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, MapPin } from "lucide-react"

interface AddressData {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

interface CepInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onAddressFound?: (address: Partial<AddressData>) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Format CEP: 12345678 -> 12345-678
 */
function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function CepInput({
  label = "CEP",
  value,
  onChange,
  onAddressFound,
  error,
  placeholder = "00000-000",
  required = false,
  disabled = false,
}: CepInputProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    onChange(formatted)
    setLocalError(null)
  }

  const handleBlur = async () => {
    const digits = value.replace(/\D/g, "")
    
    if (digits.length === 0) {
      if (required) {
        setLocalError("CEP é obrigatório")
      }
      return
    }
    
    if (digits.length !== 8) {
      setLocalError("CEP inválido")
      return
    }

    // Fetch address from ViaCEP API
    setIsLoading(true)
    setLocalError(null)
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        setLocalError("CEP não encontrado")
        return
      }
      
      if (onAddressFound) {
        onAddressFound({
          cep: digits,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        })
      }
    } catch (err) {
      setLocalError("Erro ao buscar CEP")
    } finally {
      setIsLoading(false)
    }
  }

  const displayError = error || localError

  return (
    <div className="space-y-2">
      <Label htmlFor="cep">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="cep"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={displayError ? "border-red-500 focus:border-red-500 pr-10" : "pr-10"}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {!isLoading && value.replace(/\D/g, "").length === 8 && !displayError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <MapPin className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {displayError && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}
