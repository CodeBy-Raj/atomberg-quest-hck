"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  Bell,
  ShieldCheck,
  Zap,
  ChevronRight,
  Share2,
  CheckCircle2,
  ClipboardCheck,
  BarChart3,
  Calendar,
  History,
  TrendingUp
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { title: "My Quests", icon: Target, href: "/goals", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { title: "Check-in", icon: CheckCircle2, href: "/goals/checkin", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { title: "Analytics", icon: TrendingUp, href: "/analytics", roles: ["MANAGER", "ADMIN"] },
    { title: "Reports", icon: BarChart3, href: "/reports", roles: ["MANAGER", "ADMIN"] },
    { title: "Team Management", icon: Users, href: "/team", roles: ["MANAGER", "ADMIN"] },
    { title: "Team Check-ins", icon: ClipboardCheck, href: "/team/checkin", roles: ["MANAGER", "ADMIN"] },
    { title: "Shared Quests", icon: Share2, href: "/admin/shared-goals", roles: ["ADMIN", "MANAGER"] },
  ];

  const adminItems = [
    { title: "Goal Governance", icon: ShieldCheck, href: "/admin/goals" },
    { title: "Cycle Windows", icon: Calendar, href: "/admin/cycles" },
    { title: "Audit Trail", icon: History, href: "/admin/audit" },
  ]

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-white/5">
          <SidebarHeader className="h-16 flex items-center px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center lime-glow">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-headline font-bold tracking-tight text-foreground">
                Atom<span className="text-primary">Quest</span>
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground/50">
                Main Navigation
              </SidebarGroupLabel>
              <SidebarMenu>
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className="transition-all duration-200 hover:bg-white/5 px-4 py-6"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {user?.role === 'ADMIN' && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground/50">
                  Admin Console
                </SidebarGroupLabel>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className="transition-all duration-200 hover:bg-white/5 px-4 py-6"
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-start gap-3 p-2 h-auto hover:bg-white/5">
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary uppercase">
                      {user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-sm font-bold truncate w-full text-foreground">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{user?.role}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-white/10">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-primary cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 glass sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <h1 className="text-sm font-bold hidden sm:block uppercase tracking-widest text-muted-foreground">
                {pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground relative hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground hidden md:flex font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                <Link href="/goals/new">
                  <Zap className="w-4 h-4 mr-2" />
                  Launch Quest
                </Link>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}