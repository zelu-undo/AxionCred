import { router } from "../trpc"
import { customerRouter } from "./customer"
import { loanRouter } from "./loan"
import { interestRuleRouter } from "./interestRule"
import { businessRulesRouter } from "./businessRules"
import { usersRouter } from "./users"
import { templatesRouter, notificationsRouter } from "./templates"
import { superAdminRouter } from "./superAdmin"
import { paymentRouter } from "./payment"
import { dashboardRouter } from "./dashboard"
import { guarantorsRouter } from "./guarantors"
import { renegotiationsRouter } from "./renegotiations"
import { creditRouter } from "./credit"
import { cashRouter } from "./cash"
import { globalSearchRouter } from "./globalSearch"
import { notificationsApiRouter } from "./notificationsApi"
import { financialReportsRouter } from "./financialReports"
import { auditLogsRouter } from "./auditLogs"
import { rateLimitRouter } from "./rateLimit"
import { cacheRouter } from "./cache"
import { teamRouter } from "./team"
import { invitesRouter } from "./invites"

export const appRouter = router({
  customer: customerRouter,
  loan: loanRouter,
  interestRule: interestRuleRouter,
  businessRules: businessRulesRouter,
  users: usersRouter,
  templates: templatesRouter,
  notifications: notificationsRouter,
  superAdmin: superAdminRouter,
  payment: paymentRouter,
  dashboard: dashboardRouter,
  guarantors: guarantorsRouter,
  renegotiations: renegotiationsRouter,
  credit: creditRouter,
  cash: cashRouter,
  globalSearch: globalSearchRouter,
  notificationsApi: notificationsApiRouter,
  financialReports: financialReportsRouter,
  auditLogs: auditLogsRouter,
  rateLimit: rateLimitRouter,
  cache: cacheRouter,
  team: teamRouter,
  invites: invitesRouter,
})

export type AppRouter = typeof appRouter
