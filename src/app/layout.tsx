import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/trpc/client"
import { I18nProvider } from "@/i18n/client"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AXION - Gestão de Crédito",
  description: "Plataforma de infraestrutura de crédito e confiança digital",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn(inter.className, "min-h-screen bg-gray-50")}>
        <TRPCProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </TRPCProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
