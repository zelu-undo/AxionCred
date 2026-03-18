import createMiddleware from "next-intl/middleware"
import { locales } from "./request"

export default createMiddleware({
  locales,
  defaultLocale: "pt",
  localePrefix: "always",
})

export const config = {
  matcher: ["/", "/(pt|en|es)/:path*"],
}
