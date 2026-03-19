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
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  
  // Starter plan limitations
  const starterLimits = {
    "quick-sale": false,
    "alerts": false,
    "reports": false,
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
    { name: "⚡ Venda Rápida", href: "/loans/quick", icon: TrendingUp, permission: "quick-sale" },
    { name: "🔔 Alertas", href: "/alerts", icon: Bell, permission: "alerts" },
    { name: "📄 Relatórios", href: "/reports", icon: Receipt, permission: "reports" },
    { name: t("navigation.settings"), href: "/settings", icon: Settings, permission: "settings" },
    { name: "📊 Regras de Juros", href: "/settings/business-rules", icon: Percent, permission: "settings" },
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#22C55E] text-white"
                : "text-blue-200 hover:bg-[#1E3A8A] hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
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
    await signOut()
    router.push("/login")
  }

  // Simple logic - use user data if available, fallback to "?"
  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "?")
  const userEmail = user?.email || ""
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Usuário")

  return (
    <div className={cn("flex h-full w-64 flex-col bg-[#1E3A8A]", className)} {...props}>
      <div className="flex h-16 items-center gap-2 border-b border-blue-800 px-6">
        <span className="text-2xl font-bold text-white">AXI</span>
        <span className="text-2xl font-bold text-[#22C55E]">ON</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavigationItems />
      </nav>
      
      <div className="border-t border-blue-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-medium">
            {userInitial}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-blue-200">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-blue-200 hover:text-white hover:bg-[#1E3A8A]"
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

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  // Simple logic - use user data if available
  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "?")

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-64 p-0">
            <Sidebar className="border-r" />
          </SheetContent>
        </Sheet>
        <span className="text-xl font-bold text-[#1E3A8A]">AXION</span>
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSelector />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-4 text-center text-sm text-gray-500">
              {t("notifications.noNotifications")}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-sm font-medium">
                {userInitial}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("navigation.profile")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              {t("navigation.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("navigation.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
