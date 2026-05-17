"use client"

import * as React from "react"
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
  Share2, 
  Plus, 
  Users, 
  Target, 
  Loader2,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react"
import { 
  getSharedGoals, 
  getThrustAreas, 
  getAllUsers,
  getChildGoalsCount 
} from "@/lib/repository"
import { Goal, ThrustArea, User } from "@/lib/types"
import { SharedGoalForm } from "@/components/admin/shared-goal-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SharedGoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = React.useState<(Goal & { recipients: number })[]>([])
  const [thrustAreas, setThrustAreas] = React.useState<ThrustArea[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const [shared, areas, allUsers] = await Promise.all([
        getSharedGoals(),
        getThrustAreas(),
        getAllUsers()
      ])
      
      const goalsWithCount = await Promise.all(shared.map(async (g) => {
        const count = await getChildGoalsCount(g.id)
        return { ...g, recipients: count }
      }))

      setGoals(goalsWithCount)
      setThrustAreas(areas)
      setUsers(allUsers)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Share2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Shared Quests</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Broadcast goals to the fleet</p>
            </div>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 h-12 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Broadcast New Quest
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
                  <Share2 className="w-6 h-6 text-accent" />
                  Define Shared Goal
                </DialogTitle>
              </DialogHeader>
              <SharedGoalForm 
                thrustAreas={thrustAreas} 
                users={users} 
                onSuccess={() => {
                  setIsFormOpen(false)
                  fetchData()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Thrust Area</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Goal Title</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Recipients</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    No shared goals broadcasting.
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => (
                  <TableRow key={goal.id} className="border-white/5 group hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-primary border-none text-[10px] font-bold">
                        {thrustAreas.find(a => a.id === goal.thrustAreaId)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm">{goal.title}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                        {goal.uomType.replace('_', ' ')} • Target: {goal.target}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="font-bold text-sm">{goal.recipients}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/20 text-primary border border-primary/30 uppercase text-[9px] font-black tracking-widest">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="hover:bg-white/10">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}