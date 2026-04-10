"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { trpc } from "@/trpc/client"
import { hasModuleAccess, plans, type Plan } from "@/lib/plans"
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
  ChevronDown,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Crown,
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

// Categorias do menu
type NavCategory = {
  title: string
  onlyAdmin?: boolean
  items: { name: string; href: string; icon: React.ElementType; permission: string; roles?: string[] }[]
}

function NavigationItems() {
  const { t } = useI18n()
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Estado para controlar quais categorias estão abertas (fechadas por padrão)
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({})
  
  // Alternar categoria
  const toggleCategory = (title: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }
  
  // Verificar se uma categoria tem item ativo e deve estar aberta
  const isCategoryActive = (items: NavCategory["items"]) => {
    return items.some(item => isActiveRoute(item.href, pathname))
  }

  // Define permissions for each role
  const permissions = {
    owner: ["dashboard", "customers", "loans", "collections", "quick-sale", "alerts", "reports", "settings"],
    admin: ["dashboard", "customers", "loans", "collections", "quick-sale", "alerts", "settings"],
    manager: ["dashboard", "customers", "loans", "collections"],
    operator: ["dashboard", "customers", "loans"],
  }
  
  // Get user plan
  const userPlan = (user?.plan || 'free') as Plan
  
  // Check if user has access to a module (plan is the main factor, role is secondary)
  const hasPermission = (feature: string, itemRoles?: string[]) => {
    // Super admin tem acesso a tudo
    if (user?.role === 'super_admin') {
      // Se o item tem roles específicas, verificar se o usuário está em uma delas
      if (itemRoles && itemRoles.length > 0) {
        return itemRoles.includes(user.role)
      }
      return true
    }
    
    // First check plan permission - this is the main filter
    const planPermitted = hasModuleAccess(userPlan, feature, 'read')
    
    // If plan doesn't allow, deny access
    if (!planPermitted) return false
    
    // If plan allows, also check role permission for additional filtering
    const rolePermitted = user ? permissions[user.role as keyof typeof permissions]?.includes(feature) || false : false
    
    // For free plan, be more restrictive - require both
    if (userPlan === 'free') {
      return rolePermitted
    }
    
    // For paid plans, plan permission is enough
    return true
  }

  // Menu organizado em categorias
  const navigationCategories: NavCategory[] = [
    {
      title: "Principal",
      items: [
        { name: t("navigation.dashboard"), href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
      ],
    },
    {
      title: "Gestão",
      items: [
        { name: t("navigation.customers"), href: "/customers", icon: Users, permission: "customers" },
        { name: t("navigation.loans"), href: "/loans", icon: CreditCard, permission: "loans" },
        { name: "Pagamentos", href: "/payments", icon: DollarSign, permission: "loans" },
      ],
    },
    {
      title: "Cobrança",
      items: [
        { name: t("navigation.collections"), href: "/collections", icon: Receipt, permission: "collections" },
        { name: t("navigation.alerts"), href: "/alerts", icon: Bell, permission: "alerts" },
      ],
    },
    {
      title: "Operações",
      items: [
        { name: t("navigation.quickSale"), href: "/quick-sale", icon: TrendingUp, permission: "quick-sale" },
      ],
    },
    {
      title: "Financeiro",
      items: [
        { name: t("navigation.cash"), href: "/cash", icon: Wallet, permission: "dashboard" },
        { name: t("navigation.reports"), href: "/reports/financial", icon: BarChart3, permission: "reports" },
        { name: t("navigation.renegotiations"), href: "/renegotiations", icon: RefreshCw, permission: "reports" },
        { name: t("navigation.guarantors"), href: "/guarantors", icon: Handshake, permission: "loans" },
      ],
    },
    {
      title: "Administrador",
      onlyAdmin: true,
      items: [
        // Super Admin only
        { name: "Super Admin", href: "/super-admin", icon: Crown, permission: "super_admin", roles: ["super_admin"] },
        { name: "Gerenciar Usuários", href: "/super-admin/users", icon: Users, permission: "super_admin", roles: ["super_admin"] },
      ],
    },
    {
      title: "Configurações",
      items: [
        { name: t("navigation.settings"), href: "/settings", icon: Settings, permission: "settings" },
        { name: "Regras de Negócio", href: "/settings/business-rules", icon: Percent, permission: "settings" },
        { name: "Crédito", href: "/settings/credit", icon: CreditCard, permission: "settings" },
        { name: "Gestão de Equipe", href: "/settings/staff", icon: Users, permission: "settings" },
        { name: "Funções e Permissões", href: "/settings/roles", icon: Shield, permission: "settings" },
      ],
    },
  ]

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

  // Filtrar itens por permissão
  const filterItems = (items: NavCategory["items"], onlyAdmin?: boolean) => {
    // If category is only for admin, only show if user is super_admin
    if (onlyAdmin && user?.role !== 'super_admin') {
      return []
    }
    // If user is not super_admin, filter by permissions
    if (user?.role !== 'super_admin') {
      return items.filter(item => hasPermission(item.permission, item.roles))
    }
    // Super admin sees all
    return items
  }

  return (
    <div className="space-y-1">
      {navigationCategories.map((category) => {
        const filteredItems = filterItems(category.items, category.onlyAdmin)
        if (filteredItems.length === 0) return null
        
        const isOpen = openCategories[category.title] || false
        const hasActiveItem = isCategoryActive(filteredItems)
        
        return (
          <div key={category.title}>
            {/* Título da categoria - clicável */}
            <button
              onClick={() => toggleCategory(category.title)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
                hasActiveItem 
                  ? "text-emerald-400" 
                  : "text-blue-400 hover:text-blue-200"
              )}
            >
              <span>{category.title}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            </button>
            
            {/* Itens da categoria - com animação */}
            <motion.div
              initial={false}
              animate={{ 
                height: isOpen ? "auto" : 0,
                opacity: isOpen ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 py-1">
                {filteredItems.map((item) => {
                  const isActive = isActiveRoute(item.href, pathname)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative ml-2",
                        isActive
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                          : "text-blue-200 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {/* Indicador visual para item ativo */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        !isActive && "group-hover:scale-110"
                      )} />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
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
      
      {/* User Info - Only show for super_admin */}
      {mounted && user && user.role === 'super_admin' && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Super Admin</span>
          </div>
          <p className="text-xs text-blue-200 mt-1 truncate">{user.email}</p>
        </div>
      )}
      
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <NavigationItems />
      </nav>
      
      {/* Logout button */}
      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-blue-200 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
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
      // The global search API is available via the search endpoint
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
        
        {/* Fetch notifications */}
        {(() => {
          const { data: notificationsData } = trpc.credit.getNotifications.useQuery({ limit: 10 })
          const notifications = notificationsData?.notifications || []
          const unreadCount = notificationsData?.unreadCount || 0
          
          // Helper to format time
          const formatTime = (dateStr: string) => {
            const date = new Date(dateStr)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMins / 60)
            const diffDays = Math.floor(diffHours / 24)
            
            if (diffMins < 1) return 'Agora mesmo'
            if (diffMins < 60) return `Há ${diffMins} minutos`
            if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
            if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
            return date.toLocaleDateString('pt-BR')
          }
          
          // Helper to get icon and color based on type
          const getNotificationStyle = (type: string) => {
            switch (type) {
              case 'payment_received':
                return { icon: DollarSign, bg: 'bg-green-100', text: 'text-green-600' }
              case 'payment_overdue':
              case 'overdue':
                return { icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-600' }
              case 'loan_created':
              case 'new_loan':
                return { icon: CreditCard, bg: 'bg-blue-100', text: 'text-blue-600' }
              case 'loan_approved':
                return { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600' }
              case 'loan_rejected':
              case 'loan_cancelled':
                return { icon: XCircle, bg: 'bg-red-100', text: 'text-red-600' }
              case 'loan_paid_off':
                return { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-600' }
              case 'customer_created':
                return { icon: UserPlus, bg: 'bg-purple-100', text: 'text-purple-600' }
              case 'reminder':
              case 'reminder_sent':
                return { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-600' }
              case 'new_user':
                return { icon: UserPlus, bg: 'bg-indigo-100', text: 'text-indigo-600' }
              case 'renegotiation_created':
                return { icon: RefreshCw, bg: 'bg-orange-100', text: 'text-orange-600' }
              case 'renegotiation_approved':
                return { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600' }
              case 'renegotiation_rejected':
                return { icon: XCircle, bg: 'bg-red-100', text: 'text-red-600' }
              default:
                return { icon: Bell, bg: 'bg-gray-100', text: 'text-gray-600' }
            }
          }
          
          return (
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
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-semibold flex items-center justify-between">
                  {t("notifications.title")}
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Notification Items */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((notification: any) => {
                      const style = getNotificationStyle(notification.type)
                      const Icon = style.icon
                      return (
                        <div 
                          key={notification.id} 
                          className={`px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`h-4 w-4 ${style.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              {notification.message && (
                                <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => router.push("/alerts")}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })()}
        
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
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
