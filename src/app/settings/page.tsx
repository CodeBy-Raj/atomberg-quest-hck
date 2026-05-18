"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, User, Bell, Shield, Key } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <AppShell>
        <div className="space-y-8 max-w-7xl mx-auto">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black font-headline tracking-tighter flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Settings
            </h2>
            <p className="text-muted-foreground text-lg">
              Manage your preferences and configuration.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card className="glass border-white/10 hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-bold">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="font-bold">{user.role}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-white/10">Edit Profile</Button>
            </CardFooter>
          </Card>

          {/* Notifications */}
          <Card className="glass border-white/10 hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Notifications</CardTitle>
                <CardDescription>Configure how you receive alerts.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Email Notifications</p>
                <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                  <div className="w-5 h-5 bg-primary rounded-full absolute right-0"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Push Notifications</p>
                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                  <div className="w-5 h-5 bg-muted-foreground rounded-full absolute left-0"></div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-white/10">Manage Notifications</Button>
            </CardFooter>
          </Card>

          {/* Security */}
          <Card className="glass border-white/10 hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Security</CardTitle>
                <CardDescription>Manage your security preferences.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security.</p>
                </div>
                <Button variant="outline" size="sm" className="border-white/10">Enable</Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="glass border-white/10 hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Preferences</CardTitle>
                <CardDescription>Customize your application experience.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Theme</p>
                <p className="font-bold text-primary">Cyberpunk / Dark Glass (Active)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
