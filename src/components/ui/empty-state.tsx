"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gray-100/50 animate-pulse" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="
            inline-flex items-center justify-center
            px-4 py-2 rounded-lg
            bg-[#22C55E] text-white font-medium
            hover:bg-[#16A34A]
            transition-all duration-200
            hover:shadow-lg hover:shadow-emerald-500/25
            active:scale-[0.98]
          "
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
