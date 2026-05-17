"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Target,
  MessageSquare,
  Save
} from "lucide-react"
import { getTeamByManager, getGoalsByOwner, getActiveCycle, getCheckInsByGoal, updateCheckInManager } from "@/lib/repository"
import { User, Goal, Cycle, Quarter, CheckIn } from "@/lib/types"
import { getCurrentQuarter } from "@/lib/cycle"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface MemberCheckInSummary extends User {
  goals: (Goal & { checkIn: CheckIn | null })[];
  isReviewed: boolean;
}

export default function TeamCheckInPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [team, setTeam] = React.useState<MemberCheckInSummary[]>([])
  const [activeCycle, setActiveCycle] = React.useState<Cycle | null>(null)
  const [currentQuarter, setCurrentQuarter] = React.useState<Quarter | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedMember, setSelectedMember] = React.useState<MemberCheckInSummary | null>(null)
  const [processing, setProcessing] = React.useState<string | null>(null)
  const [comments, setComments] = React.useState<Record<string, string>>({})

  const fetchData = React.useCallback(async () => {
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) return
    
    try {
      const cycle = await getActiveCycle()
      setActiveCycle(cycle)
      const quarter = getCurrentQuarter(cycle)
      setCurrentQuarter(quarter)
      
      if (!quarter || quarter === 'GOAL_SETTING') {
        setTeam([])
        setLoading(false)
        return
      }

      const members = await getTeamByManager(user.id)
      const memberSummaries = await Promise.all(members.map(async (m) => {
        const goals = await getGoalsByOwner(m.id)
        const cycleGoals = goals.filter(g => g.cycleId === cycle?.id && g.status === 'APPROVED')
        
        const goalsWithCheckIn = await Promise.all(cycleGoals.map(async (g) => {
          const checkIns = await getCheckInsByGoal(g.id)
          const currentCheckIn = checkIns.find(c => c.quarter === quarter)
          return { ...g, checkIn: currentCheckIn || null }
        }))

        const isReviewed = goalsWithCheckIn.every(g => !g.checkIn || g.checkIn.managerReviewedAt)

        return {
          ...m,
          goals: goalsWithCheckIn,
          isReviewed
        }
      }))
      
      setTeam(memberSummaries)
      
      // Initialize comments
      const initialComments: Record<string, string> = {}
      memberSummaries.forEach(m => {
        m.goals.forEach(g => {
          if (g.checkIn) initialComments[g.checkIn.id] = g.checkIn.managerComment || ""
        })
      })
      setComments(initialComments)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
    if (user && user.role === 'EMPLOYEE') router.push("/dashboard")
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) fetchData()
  }, [user, authLoading, router, fetchData])

  const handleSaveComment = async (checkInId: string) => {
    if (!user) return
    setProcessing(checkInId)
    try {
      await updateCheckInManager(checkInId, comments[checkInId], null, user.id)
      toast({ title: "Feedback Saved", description: "Comment has been recorded." })
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" })
    } finally {
      setProcessing(null)
    }
  }

  const handleMarkComplete = async (member: MemberCheckInSummary) => {
    if (!user) return
    setProcessing('complete')
    try {
      const now = new Date().toISOString()
      await Promise.all(member.goals.map(async (g) => {
        if (g.checkIn) {
          await updateCheckInManager(g.checkIn.id, comments[g.checkIn.id], now, user.id)
        }
      }))
      toast({ title: "Review Completed", description: `Check-in for ${member.name} has been signed off.` })
      fetchData()
      setSelectedMember(null)
    } catch (error) {
      toast({ variant: "destructive", title: "Review Failed" })
    } finally {
      setProcessing(null)
    }
  }

  if (loading || authLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  if (!currentQuarter || currentQuarter === 'GOAL_SETTING') {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
            <Clock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black font-headline">Review Window Closed</h1>
            <p className="text-muted-foreground">
              Quarterly review is only available during active performance windows (Q1, Q2, Q3, Q4).
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-primary"
    if (score >= 0.5) return "text-amber-500"
    return "text-destructive"
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Quarterly Review</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Active Window: {currentQuarter} • {activeCycle?.name}</p>
            </div>
          </div>
        </div>

        {!selectedMember ? (
          <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Member Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Department</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Pulse Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Review Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No team members with approved goals in this cycle.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.map((member) => {
                    const checkInCount = member.goals.filter(g => !!g.checkIn).length
                    const totalGoals = member.goals.length
                    return (
                      <TableRow 
                        key={member.id} 
                        className="border-white/5 group hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedMember(member)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {member.department}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                             <span className="text-xs font-bold">{checkInCount} / {totalGoals} Logged</span>
                             <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${(checkInCount/totalGoals)*100}%` }}></div>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "uppercase text-[9px] font-black tracking-tighter px-2",
                            member.isReviewed ? "bg-primary/20 text-primary border border-primary/30" : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                          )}>
                            {member.isReviewed ? "Reviewed" : "Pending Review"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-4 h-4 text-primary" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setSelectedMember(null)} className="hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Team List
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-right mr-4">
                   <h3 className="font-bold text-lg">{selectedMember.name}</h3>
                   <p className="text-xs text-muted-foreground uppercase tracking-widest">{selectedMember.department}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                   {selectedMember.name.charAt(0)}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {selectedMember.goals.map((g) => {
                const checkIn = g.checkIn
                const score = checkIn?.computedScore || 0
                return (
                  <Card key={g.id} className="glass border-white/10 overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{g.title}</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          UoM: {g.uomType.replace('_', ' ')} • Weight: {g.weightage}%
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-2xl font-black font-headline", getScoreColor(score))}>
                          {Math.round(score * 100)}%
                        </div>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Achievement</p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 grid md:grid-cols-4 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Planned Target</p>
                        <p className="font-bold">{g.uomType === 'TIMELINE' ? format(new Date(g.target), "PP") : g.target}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Actual Result</p>
                        <p className="font-black text-primary">
                          {checkIn ? (g.uomType === 'TIMELINE' ? format(new Date(checkIn.actual), "PP") : checkIn.actual) : "Not Logged"}
                        </p>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              Manager Feedback
                            </p>
                            {checkIn && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] uppercase font-bold"
                                onClick={() => handleSaveComment(checkIn.id)}
                                disabled={processing === checkIn.id}
                              >
                                {processing === checkIn.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                                Save Note
                              </Button>
                            )}
                         </div>
                         <Textarea 
                            placeholder="Add guidance or praise..." 
                            className="bg-white/5 border-white/10 min-h-[80px] text-sm"
                            value={checkIn ? (comments[checkIn.id] || "") : ""}
                            onChange={(e) => checkIn && setComments(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                            disabled={!checkIn || !!checkIn.managerReviewedAt}
                         />
                         {checkIn?.managerReviewedAt && (
                           <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest">
                             <CheckCircle2 className="w-3 h-3" />
                             Signed off on {format(new Date(checkIn.managerReviewedAt), "PP")}
                           </div>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end pt-8 border-t border-white/5">
              <Button 
                onClick={() => handleMarkComplete(selectedMember)}
                disabled={processing === 'complete' || selectedMember.goals.some(g => !g.checkIn)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 h-12 shadow-xl shadow-primary/20"
              >
                {processing === 'complete' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Mark Q-Review Complete
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
