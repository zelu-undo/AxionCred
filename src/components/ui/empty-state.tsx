"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Search, Filter, X } from "lucide-react"

interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Additional class names */
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        {icon || <Search className="h-10 w-10 text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#22C55E] hover:bg-[#4ADE80] text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Filter components
interface FilterBarProps {
  /** Search placeholder */
  searchPlaceholder?: string
  /** Search value */
  searchValue?: string
  /** Search onChange handler */
  onSearchChange?: (value: string) => void
  /** Filter options */
  filters?: Array<{
    label: string
    value: string
    options: Array<{ label: string; value: string }>
  }>
  /** Active filter values */
  activeFilters?: Record<string, string>
  /** Filter change handler */
  onFilterChange?: (key: string, value: string) => void
  /** Clear all filters */
  onClearFilters?: () => void
  /** Additional class names */
  className?: string
}

export function FilterBar({
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  className
}: FilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== "")

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange?.("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter) => (
        <div key={filter.label} className="relative">
          <select
            value={activeFilters[filter.label] || ""}
            onChange={(e) => onFilterChange?.(filter.label, e.target.value)}
            className="h-10 pl-4 pr-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="h-10 px-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </button>
      )}
    </div>
  )
}

// Loading skeleton for tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/4 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}
