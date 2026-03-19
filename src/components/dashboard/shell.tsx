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
  
  const navigation = [
    { name: t("navigation.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("navigation.customers"), href: "/customers", icon: Users },
    { name: t("navigation.loans"), href: "/loans", icon: CreditCard },
    { name: t("navigation.collections"), href: "/collections", icon: Receipt },
    { name: "⚡ Venda Rápida", href: "/loans/quick", icon: TrendingUp },
    { name: "🔔 Alertas", href: "/alerts", icon: Bell },
    { name: "📄 Relatórios", href: "/reports", icon: Receipt },
    { name: t("navigation.settings"), href: "/settings", icon: Settings },
  ]

  const pathname = usePathname()

  return (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
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

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "D")
  const userEmail = user?.email || "demo@axioncred.com.br"
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Demo User")

  return (
    <div className={cn("flex h-full w-64 flex-col bg-slate-900", className)} {...props}>
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <TrendingUp className="h-8 w-8 text-purple-500" />
        <span className="text-xl font-bold text-white">AXION</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavigationItems />
      </nav>
      
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
            {userInitial}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-slate-400">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-slate-400 hover:text-white hover:bg-slate-800"
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

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "D")

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
        <span className="text-xl font-bold text-slate-900">AXION</span>
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
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
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
