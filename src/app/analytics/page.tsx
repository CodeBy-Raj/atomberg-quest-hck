"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts"
import { 
  BarChart3, 
  Filter, 
  Loader2, 
  TrendingUp, 
  Users, 
  Target, 
  LayoutGrid 
} from "lucide-react"
import { 
  getCycles, 
  getThrustAreas, 
  getAllUsers, 
  getAllGoals, 
  getAllCheckIns 
} from "@/lib/repository"
import { Cycle, ThrustArea, User, Goal, CheckIn, Quarter } from "@/lib/types"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const COLORS = ['#22c55e', '#84cc16', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    cycles: Cycle[]
    thrustAreas: ThrustArea[]
    users: User[]
    goals: Goal[]
    checkIns: CheckIn[]
  }>({ cycles: [], thrustAreas: [], users: [], goals: [], checkIns: [] })

  const [filters, setFilters] = React.useState({
    cycleId: "",
    department: "ALL"
  })

  React.useEffect(() => {
    async function init() {
      const [cycles, thrustAreas, users, goals, checkIns] = await Promise.all([
        getCycles(),
        getThrustAreas(),
        getAllUsers(),
        getAllGoals(),
        getAllCheckIns()
      ])
      setData({ cycles, thrustAreas, users, goals, checkIns })
      if (cycles.length > 0) setFilters(f => ({ ...f, cycleId: cycles.find(c => c.isActive)?.id || cycles[0].id }))
      setLoading(false)
    }
    init()
  }, [])

  // Process data for charts
  const trendData = React.useMemo(() => {
    const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4_ANNUAL"];
    return quarters.map(q => {
      const qCheckIns = data.checkIns.filter(c => {
        const goal = data.goals.find(g => g.id === c.goalId);
        const owner = data.users.find(u => u.id === goal?.ownerId);
        return c.quarter === q && 
               goal?.cycleId === filters.cycleId && 
               (filters.department === "ALL" || owner?.department === filters.department);
      });
      const avg = qCheckIns.length ? qCheckIns.reduce((acc, curr) => acc + curr.computedScore, 0) / qCheckIns.length : 0;
      return { name: q, score: Math.round(avg * 100) };
    });
  }, [data, filters]);

  const thrustData = React.useMemo(() => {
    return data.thrustAreas.map(area => {
      const count = data.goals.filter(g => 
        g.thrustAreaId === area.id && 
        g.cycleId === filters.cycleId
      ).length;
      return { name: area.name, value: count };
    }).filter(d => d.value > 0);
  }, [data, filters]);

  const managerEffectiveness = React.useMemo(() => {
    const managers = data.users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
    return managers.map(m => {
      const team = data.users.filter(u => u.managerId === m.id);
      const teamGoals = data.goals.filter(g => team.some(tm => tm.id === g.ownerId) && g.cycleId === filters.cycleId);
      const teamCheckIns = data.checkIns.filter(c => teamGoals.some(tg => tg.id === c.goalId));
      
      const completionRate = teamGoals.length ? (teamCheckIns.length / (teamGoals.length)) * 100 : 0;
      return { name: m.name, rate: Math.round(completionRate) };
    }).sort((a, b) => b.rate - a.rate);
  }, [data, filters]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  const departments = Array.from(new Set(data.users.map(u => u.department)))

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Analytics Intelligence</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Fleet-wide performance trends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
              <Select value={filters.cycleId} onValueChange={(val) => setFilters(f => ({ ...f, cycleId: val }))}>
                <SelectTrigger className="bg-transparent border-none h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {data.cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-white/10" />
              <Select value={filters.department} onValueChange={(val) => setFilters(f => ({ ...f, department: val }))}>
                <SelectTrigger className="bg-transparent border-none h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Performance Trends
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2">
              <LayoutGrid className="w-4 h-4" /> Goal Distribution
            </TabsTrigger>
            <TabsTrigger value="leadership" className="gap-2">
              <Users className="w-4 h-4" /> Leadership Pulse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Average Achievement Score (%)</CardTitle>
                <CardDescription>Quarter-over-Quarter trajectory for the selected cycle</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#22c55e' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={4} dot={{ r: 6, fill: '#22c55e' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Quests by Thrust Area</CardTitle>
                  <CardDescription>Strategic alignment distribution</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={thrustData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {thrustData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Measurement Types</CardTitle>
                  <CardDescription>Unit of Measure (UoM) spread</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thrustData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" hide />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="value" fill="#84cc16" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leadership">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Manager Pulse Ranking</CardTitle>
                <CardDescription>Ranked by team check-in completion rate (%)</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={managerEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#888" fontSize={12} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="rate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
