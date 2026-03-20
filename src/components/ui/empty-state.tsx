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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
            <Icon className="h-10 w-10 text-gray-400" />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#22C55E]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">{description}</p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="
            inline-flex items-center justify-center gap-2
            px-5 py-2.5 rounded-lg
            bg-[#22C55E] text-white font-semibold text-sm
            hover:bg-[#16A34A] hover:shadow-xl hover:shadow-emerald-500/25
            transition-all duration-200
            active:scale-[0.98]
          "
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}
