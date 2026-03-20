"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"

export interface TimelineItem {
  id: string
  title: string
  description?: string
  date: string
  status: "completed" | "pending" | "current" | "failed"
  amount?: string
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    borderColor: "border-green-500",
    lineColor: "bg-green-200",
  },
  pending: {
    icon: Clock,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-400",
    borderColor: "border-gray-300",
    lineColor: "bg-gray-200",
  },
  current: {
    icon: Clock,
    bgColor: "bg-[#22C55E]/10",
    iconColor: "text-[#22C55E]",
    borderColor: "border-[#22C55E]",
    lineColor: "bg-[#22C55E]/20",
  },
  failed: {
    icon: XCircle,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    borderColor: "border-red-500",
    lineColor: "bg-red-200",
  },
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {items.map((item, index) => {
          const config = statusConfig[item.status]
          const Icon = config.icon
          const isLast = index === items.length - 1

          return (
            <div
              key={item.id}
              className={cn(
                "relative flex gap-4 animate-fade-in-up",
                isLast && "opacity-60"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <Icon className={cn("h-5 w-5", config.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-semibold",
                    item.status === "completed" && "text-gray-900",
                    item.status === "pending" && "text-gray-500",
                    item.status === "current" && "text-[#22C55E]",
                    item.status === "failed" && "text-red-600"
                  )}>
                    {item.title}
                  </h4>
                  {item.amount && (
                    <span className={cn(
                      "font-bold",
                      item.status === "completed" && "text-green-600",
                      item.status === "pending" && "text-gray-500",
                      item.status === "current" && "text-[#22C55E]",
                      item.status === "failed" && "text-red-600"
                    )}>
                      {item.amount}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{item.date}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Compact timeline for tables/cards
export function TimelineCompact({ items, className }: TimelineProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {items.map((item, index) => {
        const config = statusConfig[item.status]
        const Icon = config.icon

        return (
          <div
            key={item.id}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-110",
              config.bgColor,
              config.borderColor,
              "border-2"
            )}
            title={`${item.title} - ${item.status}`}
          >
            <Icon className={cn("h-4 w-4", config.iconColor)} />
          </div>
        )
      })}
    </div>
  )
}
