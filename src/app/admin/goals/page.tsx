
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  Target, 
  Search, 
  Lock, 
  Unlock, 
  Loader2, 
  MessageSquare
} from "lucide-react"
import { getAllGoals, getAllUsers, unlockGoal } from "@/lib/repository"
import { Goal, User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function AdminGoalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [unlockingId, setUnlockingId] = React.useState<string | null>(null)
  const [unlockReason, setUnlockReason] = React.useState("")
  const [processing, setProcessing] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    const [allGoals, allUsers] = await Promise.all([
      getAllGoals(),
      getAllUsers()
    ])
    setGoals(allGoals)
    setUsers(allUsers)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUnlock = async () => {
    if (!unlockingId || !unlockReason.trim() || !user) return
    setProcessing(true)
    try {
      await unlockGoal(unlockingId, unlockReason, user.id)
      toast({ title: "Goal Unlocked", description: "The goal is now editable by the employee." })
      await fetchData()
      setUnlockingId(null)
      setUnlockReason("")
    } catch (error) {
      toast({ variant: "destructive", title: "Unlock Failed" })
    } finally {
      setProcessing(false)
    }
  }

  const filteredGoals = goals.filter(g => {
    const owner = users.find(u => u.id === g.ownerId)
    const term = search.toLowerCase()
    return owner?.name.toLowerCase().includes(term) || g.title.toLowerCase().includes(term)
  })

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
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Goal Governance</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Manage locked quest sheets</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search employee or quest..." 
              className="pl-10 bg-white/5 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass border-white/10 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-xs uppercase font-bold py-6">Owner</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6">Quest Title</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Status</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Locked At</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGoals.map((g) => (
                <TableRow key={g.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="font-bold text-sm">{users.find(u => u.id === g.ownerId)?.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{users.find(u => u.id === g.ownerId)?.department}</div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{g.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={g.status === 'APPROVED' ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}>
                      {g.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-[10px] text-muted-foreground">
                    {g.lockedAt ? new Date(g.lockedAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {g.lockedAt && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-accent hover:bg-accent/10"
                        onClick={() => setUnlockingId(g.id)}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!unlockingId} onOpenChange={() => setUnlockingId(null)}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-accent" />
              Administrative Unlock
            </DialogTitle>
            <DialogDescription>
              This will allow the employee to edit this goal again. This action will be logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Mandatory Reason</label>
            <Textarea 
              placeholder="e.g., Correction required for departmental alignment..."
              className="bg-white/5 border-white/10"
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnlockingId(null)}>Cancel</Button>
            <Button 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              disabled={!unlockReason.trim() || processing}
              onClick={handleUnlock}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
