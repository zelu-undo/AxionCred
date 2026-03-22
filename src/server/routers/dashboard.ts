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
      const { data: overdueInstallments } = await ctx.supabase
        .from("loan_installments")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          status,
          loan:loans(customer_id, tenant_id)
        `)
        .eq("loan.tenant_id", ctx.tenantId!)
        .in("status", ["late", "pending"])
        .lt("due_date", today)

      const overdueAmount = overdueInstallments?.reduce((sum, inst) => {
        return sum + ((inst.amount || 0) - (inst.paid_amount || 0))
      }, 0) || 0

      const overdueCount = overdueInstallments?.length || 0

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
      const { data: overdueCustomers } = await ctx.supabase
        .from("loan_installments")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          status,
          loan:loans(
            id,
            customer_id,
            tenant_id,
            customer:customers(name)
          )
        `)
        .eq("loan.tenant_id", ctx.tenantId!)
        .in("status", ["late", "pending"])
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5)

      // Group overdue by customer using a plain object instead of Map
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customerOverdueObj = {} as Record<string, { name: string; count: number; amount: number }>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (overdueCustomers as any[])?.forEach((inst: any) => {
        const customerId = inst.loan?.customer_id
        if (customerId) {
          const existing = customerOverdueObj[customerId]
          const instAmount = (inst.amount || 0) - (inst.paid_amount || 0)
          if (existing) {
            existing.count += 1
            existing.amount += instAmount
          } else {
            customerOverdueObj[customerId] = {
              name: inst.loan?.customer?.name || "Cliente",
              count: 1,
              amount: instAmount
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
