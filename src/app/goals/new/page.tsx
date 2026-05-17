
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { GoalForm } from "@/components/goals/goal-form"
import { getActiveCycle, getThrustAreas, createGoal, getGoalsByOwner } from "@/lib/repository"
import { Cycle, ThrustArea } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewGoalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [cycle, setCycle] = React.useState<Cycle | null>(null)
  const [thrustAreas, setThrustAreas] = React.useState<ThrustArea[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    async function init() {
      const [activeCycle, areas] = await Promise.all([
        getActiveCycle(),
        getThrustAreas()
      ])
      setCycle(activeCycle)
      setThrustAreas(areas)
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async (values: any) => {
    if (!user || !cycle) return

    setSaving(true)
    try {
      // Check goal count limit
      const existingGoals = await getGoalsByOwner(user.id)
      const currentCycleGoals = existingGoals.filter(g => g.cycleId === cycle.id)
      
      if (currentCycleGoals.length >= 8) {
        toast({
          variant: "destructive",
          title: "Limit Reached",
          description: "You cannot have more than 8 goals per cycle."
        })
        return
      }

      await createGoal({
        ownerId: user.id,
        cycleId: cycle.id,
        thrustAreaId: values.thrustAreaId,
        title: values.title,
        description: values.description || "",
        uomType: values.uomType,
        target: values.target,
        weightage: values.weightage,
        status: "DRAFT",
        isShared: false,
        parentGoalId: null,
        lockedAt: null,
        returnComment: null
      })

      toast({
        title: "Goal Created",
        description: "Your new goal has been saved to your sheet."
      })
      router.push("/goals")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving."
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

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
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tighter">Define New Quest</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">{cycle?.name} Cycle</p>
          </div>
        </div>

        <div className="glass border-white/10 p-8 rounded-2xl">
          <GoalForm 
            thrustAreas={thrustAreas} 
            onSubmit={handleSubmit} 
            isLoading={saving} 
          />
        </div>
      </div>
    </AppShell>
  )
}
