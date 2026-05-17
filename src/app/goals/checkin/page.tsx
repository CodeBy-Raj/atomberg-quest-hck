"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  Target, 
  Loader2, 
  CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  ArrowLeft
} from "lucide-react"
import { getActiveCycle, getGoalsByOwner, createCheckIn, getCheckInsByGoal } from "@/lib/repository"
import { Goal, Cycle, Quarter, CheckIn, ProgressStatus } from "@/lib/types"
import { getCurrentQuarter } from "@/lib/cycle"
import { computeScore } from "@/lib/score"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [cycle, setCycle] = React.useState<Cycle | null>(null)
  const [currentQuarter, setCurrentQuarter] = React.useState<Quarter | null>(null)
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [checkIns, setCheckIns] = React.useState<Record<string, Partial<CheckIn>>>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!user) return
    try {
      const activeCycle = await getActiveCycle()
      setCycle(activeCycle)
      
      const quarter = getCurrentQuarter(activeCycle)
      setCurrentQuarter(quarter)

      if (activeCycle && quarter) {
        const userGoals = await getGoalsByOwner(user.id)
        const approvedGoals = userGoals.filter(g => g.cycleId === activeCycle.id && g.status === 'APPROVED')
        setGoals(approvedGoals)

        const existingCheckIns: Record<string, Partial<CheckIn>> = {}
        await Promise.all(approvedGoals.map(async (goal) => {
          const goalCheckIns = await getCheckInsByGoal(goal.id)
          const qCheckIn = goalCheckIns.find(c => c.quarter === quarter)
          if (qCheckIn) {
            existingCheckIns[goal.id] = qCheckIn
          } else {
            existingCheckIns[goal.id] = {
              goalId: goal.id,
              quarter: quarter,
              actual: "",
              progressStatus: 'NOT_STARTED',
              computedScore: 0
            }
          }
        }))
        setCheckIns(existingCheckIns)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
    if (user) fetchData()
  }, [user, authLoading, router, fetchData])

  const handleUpdateCheckIn = (goalId: string, field: keyof CheckIn, value: any) => {
    setCheckIns(prev => {
      const updated = { ...prev[goalId], [field]: value }
      
      if (field === 'actual') {
        const goal = goals.find(g => g.id === goalId)
        if (goal) {
          updated.computedScore = computeScore(goal.uomType, goal.target, value as string)
        }
      }
      
      return { ...prev, [goalId]: updated }
    })
  }

  const handleSave = async (goalId: string) => {
    const data = checkIns[goalId]
    if (!data.actual || !data.progressStatus) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please provide achievement data." })
      return
    }

    setSaving(goalId)
    try {
      await createCheckIn(data as Omit<CheckIn, 'id' | 'employeeUpdatedAt'>)
      toast({ title: "Check-in Saved", description: "Your progress has been synchronized." })
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not record check-in." })
    } finally {
      setSaving(null)
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
            <CalendarIcon className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black font-headline">Check-in Window Closed</h1>
            <p className="text-muted-foreground">
              Progress tracking is currently disabled. Check back during the next performance window (Q1, Q2, Q3, or Q4).
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </AppShell>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-primary/20 text-primary border-primary/30"
    if (score >= 0.5) return "bg-amber-500/20 text-amber-500 border-amber-500/30"
    return "bg-destructive/20 text-destructive border-destructive/30"
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Quarterly Pulse</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Active window: {currentQuarter} • {cycle?.name}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.push("/goals")} className="hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quests
          </Button>
        </div>

        <div className="grid gap-6">
          {goals.length === 0 ? (
            <Card className="glass border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-bold">No Approved Quests</p>
                  <p className="text-sm text-muted-foreground max-w-xs">You can only check-in for goals that have been approved by your manager.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const checkInData = checkIns[goal.id] || {}
              const score = checkInData.computedScore || 0
              return (
                <Card key={goal.id} className="glass border-white/10 overflow-hidden group hover:border-accent/30 transition-all">
                  <div className="h-1 w-full bg-white/5">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${score * 100}%` }}
                    ></div>
                  </div>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge className={cn("uppercase text-[9px] font-black tracking-widest", getScoreColor(score))}>
                          {Math.round(score * 100)}% Achievement
                        </Badge>
                      </div>
                      <CardDescription className="uppercase text-[9px] font-black tracking-widest text-muted-foreground mt-1">
                        Target: {goal.uomType === 'TIMELINE' ? format(new Date(goal.target), "PP") : goal.target} • UoM: {goal.uomType.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Actual Result</Label>
                      {goal.uomType === 'TIMELINE' ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white/5 border-white/10 h-11",
                                !checkInData.actual && "text-muted-foreground"
                              )}
                            >
                              {checkInData.actual ? format(new Date(checkInData.actual), "PP") : <span>Pick date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                            <Calendar
                              mode="single"
                              selected={checkInData.actual ? new Date(checkInData.actual) : undefined}
                              onSelect={(date) => handleUpdateCheckIn(goal.id, 'actual', date?.toISOString() || "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : goal.uomType === 'ZERO' ? (
                        <Input value="0" disabled className="bg-white/5 border-white/10 h-11 opacity-50" />
                      ) : (
                        <Input 
                          placeholder="Enter value" 
                          value={checkInData.actual || ""}
                          onChange={(e) => handleUpdateCheckIn(goal.id, 'actual', e.target.value)}
                          className="bg-white/5 border-white/10 h-11"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Status</Label>
                      <Select 
                        value={checkInData.progressStatus} 
                        onValueChange={(val) => handleUpdateCheckIn(goal.id, 'progressStatus', val)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 h-11">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                          <SelectItem value="ON_TRACK">On Track</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={() => handleSave(goal.id)}
                      disabled={saving === goal.id || !checkInData.actual}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-11 shadow-lg shadow-accent/20"
                    >
                      {saving === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Sync Pulse
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </AppShell>
  )
}
