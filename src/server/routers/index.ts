import { router } from "../trpc"
import { customerRouter } from "./customer"
import { loanRouter } from "./loan"
import { businessRulesRouter } from "./businessRules"
import { usersRouter } from "./users"
import { templatesRouter, notificationsRouter } from "./templates"
import { superAdminRouter } from "./superAdmin"

export const appRouter = router({
  customer: customerRouter,
  loan: loanRouter,
  businessRules: businessRulesRouter,
  users: usersRouter,
  templates: templatesRouter,
  notifications: notificationsRouter,
  superAdmin: superAdminRouter,
})

export type AppRouter = typeof appRouter
