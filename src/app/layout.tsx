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
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "icon", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", rel: "icon", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", rel: "icon", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", rel: "apple-touch-icon" },
    ],
    other: [
      { url: "/android-chrome-192x192.png", rel: "icon", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", rel: "icon", sizes: "512x512" },
    ],
  },
  manifest: "/site.webmanifest",
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
