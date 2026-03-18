"use client"

import { useI18n } from "@/i18n/client"
import Link from "next/link"
import { 
  TrendingUp, 
  Shield, 
  Users, 
  CreditCard, 
  Smartphone, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Menu,
  X,
  Globe
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const languages = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
] as const

function LanguageSelector() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLang.flag}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-md border bg-white py-1 shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code as "pt" | "en" | "es"); setIsOpen(false) }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${locale === lang.code ? "bg-purple-50 text-purple-700" : "text-gray-700"}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function LandingPage() {
  const { t } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Users,
      title: t("landing.features.customers.title"),
      description: t("landing.features.customers.description"),
    },
    {
      icon: CreditCard,
      title: t("landing.features.loans.title"),
      description: t("landing.features.loans.description"),
    },
    {
      icon: Smartphone,
      title: t("landing.features.mobile.title"),
      description: t("landing.features.mobile.description"),
    },
    {
      icon: BarChart3,
      title: t("landing.features.analytics.title"),
      description: t("landing.features.analytics.description"),
    },
    {
      icon: Shield,
      title: t("landing.features.security.title"),
      description: t("landing.features.security.description"),
    },
    {
      icon: TrendingUp,
      title: t("landing.features.growth.title"),
      description: t("landing.features.growth.description"),
    },
  ]

  const benefits = [
    t("landing.benefits.1"),
    t("landing.benefits.2"),
    t("landing.benefits.3"),
    t("landing.benefits.4"),
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AXION</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-purple-600">{t("landing.nav.features")}</a>
              <a href="#benefits" className="text-sm font-medium text-gray-600 hover:text-purple-600">{t("landing.nav.benefits")}</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-purple-600">{t("landing.nav.pricing")}</a>
              <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-purple-600">{t("landing.nav.contact")}</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSelector />
              <Button asChild variant="outline">
                <Link href="/dashboard">{t("landing.nav.dashboard")}</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">{t("landing.nav.getStarted")}</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>{t("landing.nav.features")}</a>
              <a href="#benefits" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>{t("landing.nav.benefits")}</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>{t("landing.nav.pricing")}</a>
              <div className="flex gap-2 pt-2">
                <LanguageSelector />
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>{t("landing.nav.getStarted")}</Link>
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-purple-600"></span>
                {t("landing.hero.badge")}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                {t("landing.hero.description")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/dashboard">
                    {t("landing.hero.cta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">{t("landing.hero.learnMore")}</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">500+</span> {t("landing.hero.trustedBy")}
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative">
              <div className="relative mx-auto max-w-lg">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-20"></div>
                <div className="relative rounded-2xl bg-gray-900 p-2 shadow-2xl">
                  <div className="rounded-xl bg-gray-800 p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">AXION Cred</p>
                        <p className="text-gray-400 text-sm">Dashboard</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: t("landing.hero.stats.customers"), value: "248" },
                        { label: t("landing.hero.stats.loans"), value: "156" },
                        { label: t("landing.hero.stats.revenue"), value: "R$ 45K" },
                        { label: t("landing.hero.stats.rate"), value: "98%" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-gray-700/50 rounded-lg p-4">
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t("landing.features.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6">
                {t("landing.benefits.title")}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t("landing.benefits.description")}
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-20"></div>
                <div className="relative rounded-2xl bg-white p-8 shadow-xl border">
                  <div className="space-y-6">
                    {[
                      { label: t("landing.benefits.card.customers.title"), value: "248", change: "+12%" },
                      { label: t("landing.benefits.card.loans.title"), value: "156", change: "+8%" },
                      { label: t("landing.benefits.card.recovery.title"), value: "94%", change: "+5%" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm text-gray-600">{item.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                        </div>
                        <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          {item.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            {t("landing.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard">
                {t("landing.cta.button")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AXION</span>
              </div>
              <p className="text-gray-400 text-sm">
                {t("landing.footer.description")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t("landing.footer.features")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.pricing")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.integrations")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.footer.company")}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t("landing.footer.about")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.blog")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.careers")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t("landing.footer.privacy")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.terms")}</a></li>
                <li><a href="#" className="hover:text-white">{t("landing.footer.security")}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            © 2024 AXION Cred. {t("landing.footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  )
}
