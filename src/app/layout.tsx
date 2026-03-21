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
  metadataBase: new URL('https://axioncredito.com.br'),
  title: {
    default: "AXION - Gestão de Crédito e Cobrança",
    template: "%s | AXION",
  },
  description: "Sistema completo de gestão de crédito e cobrança para pequenas empresas. Controle clientes, emprésgimos, parcelas e recebimentos de forma simples e eficiente.",
  keywords: ["gestão de crédito", "sistema de cobrança", "controle de parcelas", "empréstimo", "crédito para pequenos negócios", "software financeiro"],
  authors: [{ name: "AXION" }],
  creator: "AXION",
  publisher: "AXION",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://axioncredito.com.br",
    siteName: "AXION",
    title: "AXION - Gestão de Crédito e Cobrança",
    description: "Sistema completo de gestão de crédito e cobrança para pequenas empresas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AXION - Gestão de Crédito",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AXION - Gestão de Crédito e Cobrança",
    description: "Sistema completo de gestão de crédito e cobrança para pequenas empresas.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-axion.png",
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
