"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  className 
}: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  )
}

// Stat Card for dashboard sections
interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  trend,
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-100 p-4",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-50">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}

// Section title with optional action
interface SectionTitleProps {
  title: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function SectionTitle({ title, action, className }: SectionTitleProps) {
  return (
    <div className={cn(
      "flex items-center justify-between mb-4",
      className
    )}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {action && (
        <a 
          href={action.href}
          className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  )
}
