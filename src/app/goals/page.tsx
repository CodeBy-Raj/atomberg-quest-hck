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
  Plus, 
  Target, 
  AlertCircle, 
  Send, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Lock,
  MessageSquare,
  Link as LinkIcon,
  Loader2
} from "lucide-react"
import { 
  getActiveCycle, 
  getGoalsByOwner, 
  getThrustAreas, 
  deleteGoal,
  submitGoals 
} from "@/lib/repository"
import { Goal, Cycle, ThrustArea } from "@/lib/types"
import { WeightageProgress } from "@/components/goals/weightage-progress"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [cycle, setCycle] = React.useState<Cycle | null>(null)
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [thrustAreas, setThrustAreas] = React.useState<ThrustArea[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [goalToDelete, setGoalToDelete] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!user) return
    try {
      const [activeCycle, areas, userGoals] = await Promise.all([
        getActiveCycle(),
        getThrustAreas(),
        getGoalsByOwner(user.id)
      ])
      
      setCycle(activeCycle)
      setThrustAreas(areas)
      const currentGoals = userGoals.filter(g => g.cycleId === activeCycle?.id)
      setGoals(currentGoals)
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
    if (user) fetchData()
  }, [user, authLoading, router, fetchData])

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0)
  const isSubmissionValid = totalWeightage === 100 && goals.length > 0 && goals.length <= 8

  const handleDelete = async () => {
    if (!goalToDelete || !user) return
    try {
      await deleteGoal(goalToDelete, user.id)
      setGoals(goals.filter(g => g.id !== goalToDelete))
      toast({ title: "Goal Removed", description: "The goal has been deleted from your sheet." })
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not remove the goal." })
    } finally {
      setGoalToDelete(null)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      await submitGoals(goals, user.id)
      toast({ title: "Goals Submitted", description: "Your goal sheet has been sent to your manager." })
      await fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message || "An error occurred during submission." })
    } finally {
      setSubmitting(false)
    }
  }

  const getThrustAreaName = (id: string) => thrustAreas.find(a => a.id === id)?.name || "Unknown"

  if (loading || authLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  const goalSettingWindow = cycle?.windows.find(w => w.quarter === "GOAL_SETTING")

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {goalSettingWindow && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Goal Setting Active</h3>
                <p className="text-xs text-muted-foreground">
                  Window open until {format(new Date(goalSettingWindow.closesAt), "PPP")}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/goals/new")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black font-headline tracking-tighter">My Goal Sheet <span className="text-muted-foreground font-light text-xl ml-2">{cycle?.name}</span></h2>
              <Badge variant="outline" className="border-white/10 uppercase font-bold text-[10px] tracking-widest">{goals.length} Goals</Badge>
            </div>

            <div className="glass border-white/10 rounded-xl overflow-hidden shadow-xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Thrust Area</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Goal Title</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-center">Weight</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-center">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No goals created for this cycle yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    goals.map((goal) => (
                      <TableRow key={goal.id} className="border-white/5 group hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium text-xs">
                          <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-primary border-none">
                            {getThrustAreaName(goal.thrustAreaId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-bold text-sm flex items-center gap-2">
                              {goal.title}
                              {goal.parentGoalId && (
                                <Badge variant="outline" className="text-[9px] h-4 bg-accent/10 border-accent/20 text-accent gap-1 px-1">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  Shared
                                </Badge>
                              )}
                              {goal.status === 'RETURNED' && goal.returnComment && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <MessageSquare className="w-3 h-3 text-destructive cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-destructive text-white border-none max-w-xs">
                                      <p className="font-bold mb-1">Feedback:</p>
                                      <p className="text-xs">{goal.returnComment}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                              {goal.uomType.replace('_', ' ')} • Target: {goal.uomType === 'TIMELINE' ? format(new Date(goal.target), "MMM d, yyyy") : goal.target}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black text-primary">{goal.weightage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "uppercase text-[9px] font-black tracking-tighter px-2",
                            goal.status === 'DRAFT' ? "bg-muted text-muted-foreground" :
                            goal.status === 'SUBMITTED' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                            goal.status === 'APPROVED' ? "bg-primary/20 text-primary border border-primary/30" :
                            "bg-destructive/20 text-destructive border border-destructive/30"
                          )}>
                            {goal.status === 'APPROVED' && <Lock className="w-2.5 h-2.5 mr-1" />}
                            {goal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(goal.status === 'DRAFT' || goal.status === 'RETURNED') ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass border-white/10">
                                <DropdownMenuItem onClick={() => router.push(`/goals/${goal.id}/edit`)} className="focus:bg-white/10 cursor-pointer">
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setGoalToDelete(goal.id)} 
                                  className="text-destructive focus:bg-destructive/10 cursor-pointer"
                                  disabled={!!goal.parentGoalId}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex justify-center">
                              <Lock className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {goals.some(g => g.status === 'DRAFT' || g.status === 'RETURNED') && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={!isSubmissionValid || submitting}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-10 h-12 shadow-xl shadow-accent/20"
                >
                  {submitting ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Goal Sheet
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <WeightageProgress total={totalWeightage} count={goals.length} />
            
            <div className="glass border-white/10 p-6 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Submission Checklist
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", goals.length > 0 && goals.length <= 8 ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
                    {goals.length > 0 && goals.length <= 8 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  </div>
                  <span className={goals.length > 8 ? "text-destructive font-bold" : ""}>1 to 8 goals total</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", totalWeightage === 100 ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
                    {totalWeightage === 100 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  </div>
                  <span>Total weightage equals 100%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the goal from your current cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white font-bold">
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}