import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/trpc/client"
import { I18nProvider } from "@/i18n/client"
import { cn } from "@/lib/utils"

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
          <I18nProvider>{children}</I18nProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
