import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function calculateInstallment(
  principal: number,
  rate: number,
  installments: number
): number {
  if (rate === 0) return principal / installments
  const monthlyRate = rate / 100
  const factor = Math.pow(1 + monthlyRate, installments)
  return (principal * monthlyRate * factor) / (factor - 1)
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateCreditScore(paymentHistory: {
  total: number
  paid: number
  late: number
}): number {
  if (paymentHistory.total === 0) return 500
  const paymentRate = paymentHistory.paid / paymentHistory.total
  const lateRate = paymentHistory.late / paymentHistory.total
  const score = 300 + paymentRate * 500 - lateRate * 200
  return Math.max(300, Math.min(1000, Math.round(score)))
}

export function getScoreColor(score: number): string {
  if (score >= 800) return "text-green-600"
  if (score >= 600) return "text-yellow-600"
  if (score >= 400) return "text-orange-600"
  return "text-red-600"
}

export function getScoreLabel(score: number): string {
  if (score >= 800) return "Excelente"
  if (score >= 600) return "Bom"
  if (score >= 400) return "Regular"
  return "Ruim"
}

/**
 * Normaliza um nome removendo acentos e espaços extras
 * Exemplos:
 * - "José" → "jose"
 * - "Vyh " → "vyh"
 * - "  João  Silva  " → "joao silva"
 */
export function normalizeName(name: string): string {
  if (!name) return ""
  
  return name
    .trim() // Remove espaços no início e fim
    .replace(/\s+/g, " ") // Remove múltiplos espaços
    .toLowerCase() // Converte para minúsculas
    .normalize("NFD") // Decomposição de caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove diacríticos (acentos)
}
