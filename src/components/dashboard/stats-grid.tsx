"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Trophy, Flame, Zap, ArrowUpRight } from "lucide-react"

export function StatsGrid() {
  const stats = [
    {
      title: "Active Quests",
      value: "4",
      icon: Target,
      color: "text-primary",
      progress: 65,
      detail: "2 nearing completion"
    },
    {
      title: "Achievements",
      value: "12",
      icon: Trophy,
      color: "text-accent",
      progress: 80,
      detail: "+3 this week"
    },
    {
      title: "Daily Streak",
      value: "7 Days",
      icon: Flame,
      color: "text-orange-500",
      progress: 100,
      detail: "Personal Record!"
    },
    {
      title: "Total XP",
      value: "2,450",
      icon: Zap,
      color: "text-primary",
      progress: 45,
      detail: "Lvl 14 Vanguard"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="glass border-white/10 hover:border-white/20 transition-all group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <Badge variant="outline" className="border-white/10 text-[10px] uppercase font-bold tracking-tighter flex gap-1">
                <ArrowUpRight className="w-3 h-3 text-accent" />
                Live
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              <Progress value={stat.progress} className="h-1 bg-white/5" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.detail}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}