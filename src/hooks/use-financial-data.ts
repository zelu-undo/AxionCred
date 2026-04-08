"use client"

import { trpc } from "@/trpc/client"
import { useMemo } from "react"

// Hook para usar dados dos relatórios financeiros reais
export function useRealFinancialData(dateRangeMonths: number = 6) {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - dateRangeMonths + 1, 1)
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  // Dados do resumo financeiro
  const { data: financialSummary, isLoading: loadingSummary } = trpc.financialReports.financialSummary.useQuery(
    undefined,
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Dados de projeção de fluxo de caixa
  const { data: cashProjection, isLoading: loadingProjection } = trpc.financialReports.cashFlowProjection.useQuery(
    undefined,
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Dados de inadimplência
  const { data: defaultRate, isLoading: loadingDefaultRate } = trpc.financialReports.defaultRateReport.useQuery(
    {
      startDate: startDateStr,
      endDate: endDateStr,
      groupBy: "month"
    },
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Dados de evolução (gráfico)
  const { data: evolutionChart, isLoading: loadingEvolution } = trpc.financialReports.evolutionChart.useQuery(
    { months: dateRangeMonths },
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Dashboard de fluxo de caixa
  const { data: cashFlowDashboard, isLoading: loadingCashFlow } = trpc.financialReports.cashFlowDashboard.useQuery(
    {
      startDate: startDateStr,
      endDate: endDateStr
    },
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Performance da equipe
  const { data: collectionPerformance, isLoading: loadingPerformance } = trpc.financialReports.collectionPerformance.useQuery(
    {
      startDate: startDateStr,
      endDate: endDateStr
    },
    { 
      refetchInterval: 60000,
      retry: 2 
    }
  )

  // Estado de carregamento geral
  const isLoading = loadingSummary || loadingProjection || loadingDefaultRate || 
                    loadingEvolution || loadingCashFlow || loadingPerformance

  // Processar dados do gráfico de evolução
  const chartData = useMemo(() => {
    if (!evolutionChart?.chartData) return null
    return evolutionChart.chartData.map((item: any) => ({
      month: item.month,
      revenue: item.revenue || 0,
      disbursed: item.disbursed || 0,
      profit: item.profit || 0
    }))
  }, [evolutionChart])

  // Processar dados de projeção
  const projectionData = useMemo(() => {
    if (!cashProjection?.projection) return null
    return {
      next30: cashProjection.projection["30_days"] || 0,
      next60: cashProjection.projection["60_days"] || 0,
      next90: cashProjection.projection["90_days"] || 0,
      installments: {
        next30: cashProjection.installments?.next30 || 0,
        next60: cashProjection.installments?.next60 || 0,
        next90: cashProjection.installments?.next90 || 0
      }
    }
  }, [cashProjection])

  // Processar dados de inadimplência
  const defaultRateData = useMemo(() => {
    if (!defaultRate) return null
    return {
      rate: defaultRate.defaultRate || 0,
      totalInstallments: defaultRate.totalInstallments || 0,
      lateInstallments: defaultRate.lateInstallments || 0,
      lateAmount: defaultRate.lateAmount || 0,
      percentageLate: defaultRate.percentageLate || 0
    }
  }, [defaultRate])

  // Processar dados de performance
  const performanceData = useMemo(() => {
    if (!collectionPerformance) return null
    return {
      byUser: collectionPerformance.performance || [],
      summary: collectionPerformance.summary || {
        totalCollected: 0,
        totalCollections: 0,
        averageCollection: 0
      }
    }
  }, [collectionPerformance])

  return {
    // Data
    financialSummary,
    chartData,
    projectionData,
    defaultRateData,
    performanceData,
    cashFlowDashboard,
    
    // Loading state
    isLoading,
  }
}

// Helper para formatar valores
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value || 0)
}

// Helper para formatar percentual
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format((value || 0) / 100)
}

// Helper para formatar data
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}