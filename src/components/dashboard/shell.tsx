"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Settings,
  Bell,
  LogOut,
  Menu,
  TrendingUp,
  Percent,
  Shield,
  Search,
  RefreshCw,
  BarChart3,
  Handshake,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSelector } from "@/components/ui/language-selector"
import { motion } from "framer-motion"

function NavigationItems() {
  const { t } = useI18n()
  const { user } = useAuth()
  
  // Define permissions for each role
  const permissions = {
    owner: ["dashboard", "customers", "loans", "collections", "quick-sale", "alerts", "reports", "settings"],
    admin: ["dashboard", "customers", "loans", "collections", "quick-sale", "alerts", "settings"],
    manager: ["dashboard", "customers", "loans", "collections"],
    operator: ["dashboard", "customers", "loans"],
  }
  
  // Starter plan limitations (empty for now - all features visible)
  const starterLimits = {
  }
  
  // Get user permissions based on role
  const userPermissions = user ? permissions[user.role as keyof typeof permissions] || ["dashboard"] : ["dashboard"]
  const hasPermission = (feature: string) => {
    // Check role permission
    if (!userPermissions.includes(feature)) return false
    // Check plan limitations for starter plan
    const limit = starterLimits[feature as keyof typeof starterLimits]
    if (limit === false) return false
    return true
  }
  
  const navigation = [
    { name: t("navigation.dashboard"), href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
    { name: t("navigation.customers"), href: "/customers", icon: Users, permission: "customers" },
    { name: t("navigation.loans"), href: "/loans", icon: CreditCard, permission: "loans" },
    { name: t("navigation.collections"), href: "/collections", icon: Receipt, permission: "collections" },
    { name: "⚡ Venda Rápida", href: "/quick-sale", icon: TrendingUp, permission: "quick-sale" },
    { name: "🔔 Alertas", href: "/alerts", icon: Bell, permission: "alerts" },
    { name: "📊 Relatórios", href: "/reports/financial", icon: BarChart3, permission: "reports" },
    { name: "🔄 Renegociações", href: "/renegotiations", icon: RefreshCw, permission: "reports" },
    { name: "🛡️ Fiadores", href: "/guarantors", icon: Handshake, permission: "loans" },
    { name: t("navigation.settings"), href: "/settings", icon: Settings, permission: "settings" },
    { name: "Regras de Juros", href: "/settings/business-rules", icon: Percent, permission: "settings" },
    { name: "Gestão de Equipe", href: "/settings/staff", icon: Users, permission: "settings" },
    { name: "Funções e Permissões", href: "/settings/roles", icon: Shield, permission: "settings" },
  ]

  const pathname = usePathname()

  // More precise active check - only highlight exact match OR direct children
  const isActiveRoute = (href: string, currentPath: string): boolean => {
    // Exact match
    if (currentPath === href) return true
    // For parent routes like /settings, don't highlight if there's a subpath
    if (href === "/settings" && currentPath.startsWith("/settings/")) return false
    // For other parent routes, check if it's a direct child (one level deep)
    if (currentPath.startsWith(href + "/")) {
      const remainder = currentPath.slice(href.length + 1)
      if (!remainder.includes("/")) return true
    }
    return false
  }

  return (
    <>
      {navigation.filter(item => hasPermission(item.permission)).map((item) => {
        const isActive = isActiveRoute(item.href, pathname)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
              isActive
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "text-blue-200 hover:bg-white/10 hover:text-white"
            )}
          >
            {/* Indicador visual para item ativo */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
            )}
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200",
              !isActive && "group-hover:scale-110"
            )} />
            <span className="relative z-10">{item.name}</span>
          </Link>
        )
      })}
    </>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    // signOut already handles the redirect to /login
    await signOut()
  }

  // Simple logic - use user data if available, fallback to "?"
  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "?")
  const userEmail = user?.email || ""
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Usuário")

  return (
    <div className={cn("flex h-full w-64 flex-col bg-gradient-to-b from-[#1E3A8A] via-[#1E3A8A] to-[#172554]", className)} {...props}>
      {/* Logo com gradiente sutil */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
        <span className="text-2xl font-bold text-white tracking-tight">AXI</span>
        <span className="text-2xl font-bold text-[#22C55E] tracking-tight">ON</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <NavigationItems />
      </nav>
      
      {/* User section com design premium */}
      <div className="border-t border-white/10 p-4 bg-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          {/* Avatar com gradiente */}
          <div className="
            h-10 w-10 rounded-full 
            bg-gradient-to-br from-emerald-400 to-emerald-600
            flex items-center justify-center 
            text-white font-semibold
            shadow-lg shadow-emerald-500/30
            ring-2 ring-white/20
          ">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-blue-200 truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="
            w-full mt-2 
            text-blue-200 hover:text-white 
            hover:bg-white/10 
            rounded-lg
            transition-all duration-200
          "
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("navigation.logout")}
        </Button>
      </div>
    </div>
  )
}

export function Header() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.getElementById("global-search")
        searchInput?.focus()
      }
      if (e.key === "Escape") {
        setSearchFocused(false)
        const searchInput = document.getElementById("global-search") as HTMLInputElement
        if (searchInput) searchInput.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      // Navigate to customers page with search query
      router.push(`/customers?search=${encodeURIComponent(searchQuery.trim())}`)
      setTimeout(() => setIsSearching(false), 500)
    }
  }

  const handleLogout = async () => {
    // signOut already handles the redirect to /login
    await signOut()
  }

  // Simple logic - use user data if available
  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "?")

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-sm px-4 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative overflow-hidden group"
            >
              <motion.div
                animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5" />
              </motion.div>
              <span className="absolute inset-0 bg-[#22C55E]/10 scale-0 group-hover:scale-100 rounded-lg transition-transform duration-200" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            className="w-64 p-0 border-r-0 bg-[#1E3A8A]"
          >
            <Sidebar className="border-r-0 bg-transparent" />
          </SheetContent>
        </Sheet>
        <span className="text-xl font-bold text-[#1E3A8A]">AXI</span>
        <span className="text-xl font-bold text-[#22C55E]">ON</span>
      </div>
      
      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative w-full group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${searchFocused ? "text-[#22C55E]" : "text-gray-400"}`} />
          <input
            id="global-search"
            type="text"
            placeholder="Buscar clientes, empréstimos, parcelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full h-10 pl-10 pr-12 rounded-lg border text-sm placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
              searchFocused 
                ? "bg-white border-[#22C55E] ring-2 ring-[#22C55E]/10 shadow-lg shadow-[#22C55E]/5" 
                : "border-gray-200 bg-gray-50/50 hover:bg-gray-100"
            }`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <span className="text-xs text-gray-500">×</span>
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-400 group-hover:border-gray-300 transition-colors">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSelector />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-[#22C55E]/5 transition-colors"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5" />
              </motion.div>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="font-semibold flex items-center justify-between">
              {t("notifications.title")}
              <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">3</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Notification Items */}
            <div className="max-h-80 overflow-y-auto">
              {/* Payment Received */}
              <div className="px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Pagamento Recebido</p>
                    <p className="text-xs text-gray-500">R$ 1.500 de João Silva</p>
                    <p className="text-xs text-gray-400 mt-1">Há 5 minutos</p>
                  </div>
                </div>
              </div>
              
              {/* Overdue Alert */}
              <div className="px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Parcela Vencida</p>
                    <p className="text-xs text-gray-500">Maria Santos - 3 dias atrasado</p>
                    <p className="text-xs text-gray-400 mt-1">Há 1 hora</p>
                  </div>
                </div>
              </div>
              
              {/* New Loan */}
              <div className="px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Novo Empréstimo</p>
                    <p className="text-xs text-gray-500">Pedro Costa - R$ 5.000</p>
                    <p className="text-xs text-gray-400 mt-1">Há 2 horas</p>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ver todas as notificações
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:bg-[#22C55E/5] transition-colors"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white text-sm font-medium shadow-md"
              >
                {userInitial}
              </motion.div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-semibold">{t("navigation.profile")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              {t("navigation.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("navigation.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
