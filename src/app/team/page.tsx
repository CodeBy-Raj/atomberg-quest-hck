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
  Loader2
} from "lucide-react"
import { getTeamByManager, getGoalsByOwner, getActiveCycle } from "@/lib/repository"
import { User, Goal, Cycle } from "@/lib/types"
import { EmployeeReviewSheet } from "@/components/team/employee-review-sheet"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TeamMemberSummary extends User {
  goals: Goal[];
  submissionStatus: string;
  totalWeightage: number;
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [team, setTeam] = React.useState<TeamMemberSummary[]>([])
  const [activeCycle, setActiveCycle] = React.useState<Cycle | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [selectedMember, setSelectedMember] = React.useState<TeamMemberSummary | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) return
    
    try {
      const cycle = await getActiveCycle()
      setActiveCycle(cycle)
      
      const members = await getTeamByManager(user.id)
      const memberSummaries = await Promise.all(members.map(async (m) => {
        const goals = await getGoalsByOwner(m.id)
        const cycleGoals = goals.filter(g => g.cycleId === cycle?.id)
        
        const totalWeightage = cycleGoals.reduce((sum, g) => sum + g.weightage, 0)
        
        // Primary status logic: if any submitted, status is submitted. If all approved, approved.
        let status = "DRAFT"
        if (cycleGoals.length > 0) {
          if (cycleGoals.every(g => g.status === 'APPROVED')) status = "APPROVED"
          else if (cycleGoals.some(g => g.status === 'SUBMITTED')) status = "SUBMITTED"
          else if (cycleGoals.some(g => g.status === 'RETURNED')) status = "RETURNED"
        }

        return {
          ...m,
          goals: cycleGoals,
          submissionStatus: status,
          totalWeightage
        }
      }))
      
      setTeam(memberSummaries)
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

  if (loading || authLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  if (user?.role === 'EMPLOYEE') return (
    <div className="flex h-screen flex-col items-center justify-center p-8 text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-destructive" />
      <h1 className="text-3xl font-black font-headline">Access Denied</h1>
      <p className="text-muted-foreground max-w-md">This command center is reserved for management personnel only.</p>
      <Button onClick={() => router.push("/dashboard")}>Return to Base</Button>
    </div>
  )

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = team.filter(m => m.submissionStatus === 'SUBMITTED').length

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Team Management</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Cycle: {activeCycle?.name}</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-white font-black px-4 py-2 text-xs uppercase tracking-widest flex gap-2">
              <Clock className="w-4 h-4" />
              {pendingCount} Pending Approvals
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search direct reports..." 
              className="pl-10 bg-white/5 border-white/10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Member Name</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6">Department</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Goals</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Weightage</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest py-6 text-center">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeam.map((member) => (
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
                    <TableCell className="text-center font-bold">{member.goals.length}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className={cn(
                          "font-black text-sm",
                          member.totalWeightage === 100 ? "text-primary" : 
                          member.totalWeightage > 100 ? "text-destructive" : "text-amber-500"
                        )}>
                          {member.totalWeightage}%
                        </span>
                        {member.totalWeightage === 100 && <CheckCircle2 className="w-3 h-3 text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "uppercase text-[9px] font-black tracking-tighter px-2",
                        member.submissionStatus === 'DRAFT' ? "bg-muted text-muted-foreground" :
                        member.submissionStatus === 'SUBMITTED' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                        member.submissionStatus === 'APPROVED' ? "bg-primary/20 text-primary border border-primary/30" :
                        "bg-destructive/20 text-destructive border border-destructive/30"
                      )}>
                        {member.submissionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EmployeeReviewSheet 
        member={selectedMember} 
        onClose={() => setSelectedMember(null)}
        onUpdate={fetchData}
      />
    </AppShell>
  )
}