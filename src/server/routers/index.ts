import { router } from "../trpc"
import { customerRouter } from "./customer"
import { loanRouter } from "./loan"
import { interestRuleRouter } from "./interestRule"
import { businessRulesRouter } from "./businessRules"
import { usersRouter } from "./users"
import { templatesRouter, notificationsRouter } from "./templates"
import { superAdminRouter } from "./superAdmin"
import { paymentRouter } from "./payment"

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
})

export type AppRouter = typeof appRouter
