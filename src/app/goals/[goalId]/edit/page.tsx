"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { GoalForm } from "@/components/goals/goal-form"
import { getThrustAreas, updateGoal, getGoalsByOwner } from "@/lib/repository"
import { Goal, ThrustArea } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Target, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EditGoalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const goalId = params.goalId as string

  const [goal, setGoal] = React.useState<Goal | null>(null)
  const [thrustAreas, setThrustAreas] = React.useState<ThrustArea[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    async function init() {
      if (!user) return
      try {
        const [areas, userGoals] = await Promise.all([
          getThrustAreas(),
          getGoalsByOwner(user.id)
        ])
        const targetGoal = userGoals.find(g => g.id === goalId)
        
        if (!targetGoal) {
          toast({ variant: "destructive", title: "Goal Not Found" })
          router.push("/goals")
          return
        }

        if (targetGoal.status !== 'DRAFT' && targetGoal.status !== 'RETURNED') {
          toast({ variant: "destructive", title: "Goal Locked", description: "You cannot edit goals that have been submitted or approved." })
          router.push("/goals")
          return
        }

        setGoal(targetGoal)
        setThrustAreas(areas)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user, goalId, router, toast])

  const handleSubmit = async (values: any) => {
    if (!user) return
    setSaving(true)
    try {
      await updateGoal(goalId, values, user.id)
      toast({
        title: "Goal Updated",
        description: "Your changes have been saved."
      })
      router.push("/goals")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred."
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  const disabledFields: any[] = goal?.parentGoalId 
    ? ['thrustAreaId', 'title', 'description', 'uomType', 'target'] 
    : []

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="hover:bg-white/5 text-muted-foreground group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Goal Sheet
        </Button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tighter">Modify Quest</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Editing: {goal?.title}</p>
          </div>
        </div>

        <div className="glass border-white/10 p-8 rounded-2xl">
          <GoalForm 
            initialData={goal || undefined}
            thrustAreas={thrustAreas} 
            onSubmit={handleSubmit} 
            isLoading={saving} 
            disabledFields={disabledFields}
          />
        </div>
      </div>
    </AppShell>
  )
}