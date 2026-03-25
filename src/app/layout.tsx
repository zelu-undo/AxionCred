import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/trpc/client"
import { I18nProvider } from "@/i18n/client"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: "AXION - Gestão de Crédito",
  description: "Plataforma de infraestrutura de crédito e confiança digital",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    images: ["/logo-axion.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn(poppins.className, "min-h-screen bg-gray-50")}>
        <TRPCProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </I18nProvider>
        </TRPCProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
