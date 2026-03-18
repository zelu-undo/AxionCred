import { router } from "../trpc"
import { customerRouter } from "./customer"
import { loanRouter } from "./loan"
import { interestRuleRouter } from "./interestRule"

export const appRouter = router({
  customer: customerRouter,
  loan: loanRouter,
  interestRule: interestRuleRouter,
})

export type AppRouter = typeof appRouter
