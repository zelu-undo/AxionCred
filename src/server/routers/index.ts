import { router } from "../trpc"
import { customerRouter } from "./customer"
import { loanRouter } from "./loan"

export const appRouter = router({
  customer: customerRouter,
  loan: loanRouter,
})

export type AppRouter = typeof appRouter
