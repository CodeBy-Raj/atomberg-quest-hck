
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { AIGoalCreator } from "@/components/ai-goal-creator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Zap, 
  Target, 
  Users, 
  Loader2, 
  ChevronRight,
  TrendingUp,
  Award,
  Database,
  ShieldCheck
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getAllUsers, getActiveCycle, getAllGoals, getAllCheckIns } from "@/lib/repository"
import { Goal, User, Cycle, CheckIn } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { seedDatabase } from "@/scripts/seed"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [stats, setStats] = React.useState({
    totalEmployees: 0,
    submissionRate: 0,
    approvalRate: 0,
    checkInCompletion: 0,
    personalGoals: [] as Goal[],
    recentCheckIns: [] as CheckIn[]
  })
  const [hasCycle, setHasCycle] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  const init = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [users, goals, checkIns, activeCycle] = await Promise.all([
        getAllUsers(),
        getAllGoals(),
        getAllCheckIns(),
        getActiveCycle()
      ])

      setHasCycle(!!activeCycle);

      const cycleGoals = goals.filter(g => g.cycleId === activeCycle?.id)
      const submitted = cycleGoals.filter(g => g.status === 'SUBMITTED' || g.status === 'APPROVED').length
      const approved = cycleGoals.filter(g => g.status === 'APPROVED').length
      
      const personalGoals = goals.filter(g => g.ownerId === user?.id && g.cycleId === activeCycle?.id);
      const recentCheckIns = checkIns.filter(c => personalGoals.some(pg => pg.id === c.goalId)).slice(0, 5);

      setStats({
        totalEmployees: users.length,
        submissionRate: cycleGoals.length ? Math.round((submitted / cycleGoals.length) * 100) : 0,
        approvalRate: submitted ? Math.round((approved / submitted) * 100) : 0,
        checkInCompletion: users.length ? Math.round((checkIns.length / (users.length * 4)) * 100) : 0,
        personalGoals,
        recentCheckIns
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user]);

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    if (user) {
      init();
    }
  }, [user, authLoading, router, init])

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      toast({ title: "Environment Initialized", description: "Demo data and user roles have been successfully seeded." });
      await init();
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed", description: "An error occurred during initialization." });
    } finally {
      setSeeding(false);
    }
  };

  if (!mounted || authLoading || loading) {
    return (
      <AppShell>
        <div className="space-y-8 max-w-7xl mx-auto">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) return null;
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN'

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {!hasCycle && (
          <div className="p-8 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Submission Readiness
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                To fulfill Section 8 of the BRD, click initialize to seed the multi-role environment. This creates the **FY 2025-26** cycle and pre-configures Admin, Manager, and Employee credentials.
              </p>
            </div>
            <Button 
              onClick={handleSeed} 
              disabled={seeding}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-8 shadow-xl shadow-primary/30 shrink-0"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Initialize Demo Data
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black font-headline tracking-tighter">
              Greetings, <span className="text-primary italic">{user.name}</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {isManager ? "Fleet overview and strategic performance tracking." : "Your personal quest progress and upcoming milestones."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <Button variant="outline" className="border-white/10" onClick={() => router.push("/reports")}>
                View Reports
              </Button>
            )}
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
              <Zap className="w-4 h-4 mr-2" />
              Sync Pulse
            </Button>
          </div>
        </div>

        {isManager && (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Fleet Size", value: stats.totalEmployees, icon: Users, color: "text-primary" },
              { label: "Submission", value: `${stats.submissionRate}%`, icon: TrendingUp, color: "text-accent" },
              { label: "Approval", value: `${stats.approvalRate}%`, icon: Award, color: "text-primary" },
              { label: "Check-in Done", value: `${stats.checkInCompletion}%`, icon: Zap, color: "text-amber-500" }
            ].map((s, i) => (
              <Card key={i} className="glass border-white/10 hover:border-primary/20 transition-all overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
                  <s.icon className={cn("w-4 h-4", s.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black font-headline">{s.value}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", s.color.replace('text', 'bg'))} style={{ width: typeof s.value === 'string' ? s.value : '100%' }}></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-white/10">
              <CardHeader className="flex items-center justify-between flex-row">
                <div>
                  <CardTitle className="text-xl font-bold">Active Quests</CardTitle>
                  <CardDescription>Your objectives for the current cycle</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/goals")}>
                  Manage All <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.personalGoals.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="font-bold text-muted-foreground">No active quests detected.</p>
                    <Button variant="outline" size="sm" onClick={() => router.push("/goals/new")}>Define New Goal</Button>
                  </div>
                ) : (
                  stats.personalGoals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{g.title}</p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-black",
                            g.status === 'APPROVED' ? "text-primary border-primary/20" : "text-muted-foreground"
                          )}>
                            {g.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{g.weightage}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Weight</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <AIGoalCreator />
          </div>

          <div className="space-y-6">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.recentCheckIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent achievement logs.</p>
                ) : (
                  stats.recentCheckIns.map((c, i) => (
                    <div key={i} className="flex gap-3 items-center p-3 rounded-lg bg-white/5 border border-white/5 group">
                      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {Math.round(c.computedScore * 100)}%
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{c.quarter} Sync</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{new Date(c.employeeUpdatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
