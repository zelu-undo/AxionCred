import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { Loan, Customer } from "@/types"

// Dashboard router - provides statistics for dashboard
export const dashboardRouter = router({
  // Get dashboard statistics
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Get total customers count
      const { count: totalCustomers } = await ctx.supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "active")

      // Get active loans count (including late)
      const { count: activeLoans } = await ctx.supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["active", "late"])

      // Get total to receive (sum of remaining_amount for active and late loans)
      const { data: loansData } = await ctx.supabase
        .from("loans")
        .select("remaining_amount, total_amount, paid_amount")
        .eq("tenant_id", tenantId)
        .in("status", ["active", "late"])

      const totalToReceive = loansData?.reduce((sum, loan) => {
        return sum + (loan.remaining_amount || 0)
      }, 0) || 0

      const totalLoansAmount = loansData?.reduce((sum, loan) => {
        return sum + (loan.total_amount || 0)
      }, 0) || 0

      // Get total received this month
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
      const today = now.toISOString().split("T")[0]
      
      // First, update late installments
      await ctx.supabase
        .from("loan_installments")
        .update({ status: "late" })
        .eq("status", "pending")
        .lt("due_date", today)
      
      const { data: paymentsThisMonth } = await ctx.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("tenant_id", tenantId)
        .gte("created_at", firstDayOfMonth)
        .eq("status", "completed")

      const totalReceived = paymentsThisMonth?.reduce((sum, payment) => {
        return sum + (payment.amount || 0)
      }, 0) || 0

      // Get overdue data (late installments or pending past due date)
      // First get all late/pending installments with loan info
      const { data: overdueInstallments } = await ctx.supabase
        .from("loan_installments")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          status,
          loan_id
        `)
        .in("status", ["late", "pending"])
        .lt("due_date", today)

      // Get loan details to filter by tenant
      const loanIds = overdueInstallments?.map(i => i.loan_id).filter(Boolean) || []
      const { data: overdueLoansData } = loanIds.length > 0 
        ? await ctx.supabase
            .from("loans")
            .select("id, tenant_id")
            .in("id", loanIds)
        : { data: [] }

      const validLoanIds = new Set(overdueLoansData?.filter(l => l.tenant_id === ctx.tenantId).map(l => l.id) || [])

      // Filter installments by tenant
      const filteredOverdueInstallments = overdueInstallments?.filter(
        inst => validLoanIds.has(inst.loan_id)
      ) || []

      const overdueAmount = filteredOverdueInstallments.reduce((sum, inst) => {
        return sum + ((inst.amount || 0) - (inst.paid_amount || 0))
      }, 0)

      const overdueCount = filteredOverdueInstallments.length

      // Get recent loans with customer info (all statuses)
      const { data: recentLoans } = await ctx.supabase
        .from("loans")
        .select(`
          id,
          principal_amount,
          total_amount,
          installments_count,
          paid_installments,
          status,
          created_at,
          customer:customers(name)
        `)
        .eq("tenant_id", tenantId)
        .in("status", ["pending", "active", "late", "paid"])
        .order("created_at", { ascending: false })
        .limit(5)

      // Get overdue customers (late or pending past due)
      // First get all late/pending installments
      const { data: overdueCustomersRaw } = await ctx.supabase
        .from("loan_installments")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          status,
          loan_id
        `)
        .in("status", ["late", "pending"])
        .lt("due_date", today)
        .order("due_date", { ascending: true })

      // Get loan and customer details
      const overdueLoanIds = overdueCustomersRaw?.map(i => i.loan_id).filter(Boolean) || []
      const { data: overdueLoansForCustomers } = overdueLoanIds.length > 0
        ? await ctx.supabase
            .from("loans")
            .select("id, customer_id, tenant_id")
            .in("id", overdueLoanIds)
        : { data: [] }

      // Get customer info for valid loans
      const validOverdueLoans = overdueLoansForCustomers?.filter(l => l.tenant_id === ctx.tenantId) || []
      const customerIds = validOverdueLoans.map(l => l.customer_id).filter(Boolean)
      const { data: customerData } = customerIds.length > 0
        ? await ctx.supabase
            .from("customers")
            .select("id, name")
            .in("id", customerIds)
        : { data: [] }

      const customerMap = new Map(customerData?.map(c => [c.id, c.name]) || [])

      // Build overdue customer list
      const customerOverdueObj = {} as Record<string, { name: string; count: number; amount: number }>
      overdueCustomersRaw?.forEach((inst) => {
        const loan = validOverdueLoans.find(l => l.id === inst.loan_id)
        if (loan) {
          const customerId = loan.customer_id
          if (customerId) {
            const existing = customerOverdueObj[customerId]
            const instAmount = (inst.amount || 0) - (inst.paid_amount || 0)
            if (existing) {
              existing.count += 1
              existing.amount += instAmount
            } else {
              customerOverdueObj[customerId] = {
                name: customerMap.get(customerId) || "Cliente",
                count: 1,
                amount: instAmount
              }
            }
          }
        }
      })

      const overdueCustomersList = Object.values(customerOverdueObj).slice(0, 5)

      return {
        stats: {
          total_customers: totalCustomers || 0,
          active_loans: activeLoans || 0,
          total_to_receive: totalToReceive,
          total_received: totalReceived,
          overdue_amount: overdueAmount,
          overdue_count: overdueCount,
        },
        recentLoans: (recentLoans as any[])?.map((loan: any) => ({
          id: loan.id,
          name: loan.customer?.name || "Cliente",
          amount: loan.principal_amount,
          totalAmount: loan.total_amount,
          installments: loan.installments_count,
          paidInstallments: loan.paid_installments,
          status: loan.status,
          createdAt: loan.created_at,
        })) || [],
        overdueCustomers: overdueCustomersList,
      }
    }),
})
