
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
import { 
  Calendar, 
  Plus, 
  Settings2, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ToggleLeft
} from "lucide-react"
import { getCycles, updateCycle, createCycle } from "@/lib/repository"
import { Cycle, Quarter } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AdminCyclesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cycles, setCycles] = React.useState<Cycle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)

  const [newCycle, setNewCycle] = React.useState({
    name: "",
    isActive: false,
    startDate: new Date().toISOString()
  })

  const fetchData = React.useCallback(async () => {
    const all = await getCycles()
    setCycles(all.sort((a,b) => b.startDate.localeCompare(a.startDate)))
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleActive = async (cycle: Cycle) => {
    setLoading(true)
    try {
      // Deactivate others first if activating this one
      if (!cycle.isActive) {
        await Promise.all(cycles.filter(c => c.isActive).map(c => updateCycle(c.id, { isActive: false })))
      }
      await updateCycle(cycle.id, { isActive: !cycle.isActive })
      toast({ title: "Cycle Status Updated" })
      fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Operation Failed" })
    }
  }

  const handleCreate = async () => {
    if (!newCycle.name.trim()) return
    setProcessing(true)
    try {
      const quarters: Quarter[] = ["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4_ANNUAL"]
      const windows = quarters.map((q, i) => ({
        quarter: q,
        opensAt: new Date(2025, i * 3, 1).toISOString(),
        closesAt: new Date(2025, i * 3 + 1, 1).toISOString(),
      }))

      await createCycle({
        ...newCycle,
        windows
      })
      toast({ title: "Cycle Initialized" })
      fetchData()
      setIsOpen(false)
    } catch (error) {
      toast({ variant: "destructive", title: "Creation Failed" })
    } finally {
      setProcessing(false)
    }
  }

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
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Performance Chronology</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Manage cycle windows and active periods</p>
            </div>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Initialize New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Define Quest Cycle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cycle Name</Label>
                  <Input 
                    placeholder="e.g., FY 2026-27" 
                    className="bg-white/5 border-white/10"
                    value={newCycle.name}
                    onChange={(e) => setNewCycle(n => ({ ...n, name: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label>Set as Active Cycle</Label>
                  <Switch 
                    checked={newCycle.isActive} 
                    onCheckedChange={(val) => setNewCycle(n => ({ ...n, isActive: val }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-primary text-primary-foreground font-bold"
                  onClick={handleCreate}
                  disabled={processing || !newCycle.name}
                >
                  {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirm Cycle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-xs uppercase font-bold py-6">Cycle Name</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Status</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Start Date</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-bold text-lg">{c.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={c.isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}>
                      {c.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {new Date(c.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={c.isActive ? "text-destructive" : "text-primary"}
                      onClick={() => toggleActive(c)}
                    >
                      <ToggleLeft className="w-4 h-4 mr-2" />
                      {c.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}
