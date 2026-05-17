
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Loader2,
  FileJson
} from "lucide-react"
import { 
  getCycles, 
  getThrustAreas, 
  getAllUsers, 
  getAllGoals, 
  getAllCheckIns 
} from "@/lib/repository"
import { Cycle, ThrustArea, User, Goal, CheckIn, Quarter } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import Papa from "papaparse"
import ExcelJS from "exceljs"

export default function ReportsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    cycles: Cycle[]
    thrustAreas: ThrustArea[]
    users: User[]
    goals: Goal[]
    checkIns: CheckIn[]
  }>({ cycles: [], thrustAreas: [], users: [], goals: [], checkIns: [] })

  const [filters, setFilters] = React.useState({
    cycleId: "",
    quarter: "ALL" as Quarter | "ALL",
    department: "ALL",
    managerId: "ALL"
  })

  React.useEffect(() => {
    async function init() {
      const [cycles, thrustAreas, users, goals, checkIns] = await Promise.all([
        getCycles(),
        getThrustAreas(),
        getAllUsers(),
        getAllGoals(),
        getAllCheckIns()
      ])
      setData({ cycles, thrustAreas, users, goals, checkIns })
      if (cycles.length > 0) setFilters(f => ({ ...f, cycleId: cycles.find(c => c.isActive)?.id || cycles[0].id }))
      setLoading(false)
    }
    init()
  }, [])

  const reportRows = React.useMemo(() => {
    return data.goals
      .filter(g => {
        const owner = data.users.find(u => u.id === g.ownerId)
        const matchCycle = g.cycleId === filters.cycleId
        const matchDept = filters.department === "ALL" || owner?.department === filters.department
        const matchManager = filters.managerId === "ALL" || owner?.managerId === filters.managerId
        return matchCycle && matchDept && matchManager
      })
      .map(g => {
        const owner = data.users.find(u => u.id === g.ownerId)
        const area = data.thrustAreas.find(a => a.id === g.thrustAreaId)
        const qCheckIns = data.checkIns.filter(c => c.goalId === g.id)
        const activeCheckIn = filters.quarter === "ALL" 
          ? qCheckIns.sort((a,b) => b.employeeUpdatedAt.localeCompare(a.employeeUpdatedAt))[0]
          : qCheckIns.find(c => c.quarter === filters.quarter)

        return {
          employee: owner?.name || "Unknown",
          department: owner?.department || "N/A",
          goal: g.title,
          thrustArea: area?.name || "N/A",
          uom: g.uomType,
          target: g.target,
          actual: activeCheckIn?.actual || "-",
          score: activeCheckIn ? Math.round(activeCheckIn.computedScore * 100) : 0,
          status: g.status
        }
      })
  }, [data, filters])

  const exportCSV = () => {
    const csv = Papa.unparse(reportRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `atomquest_achievement_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Achievements')
    
    worksheet.columns = [
      { header: 'Employee', key: 'employee' },
      { header: 'Department', key: 'department' },
      { header: 'Goal', key: 'goal' },
      { header: 'Thrust Area', key: 'thrustArea' },
      { header: 'UoM', key: 'uom' },
      { header: 'Target', key: 'target' },
      { header: 'Actual', key: 'actual' },
      { header: 'Score %', key: 'score' },
      { header: 'Status', key: 'status' }
    ]

    worksheet.addRows(reportRows)
    
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `atomquest_achievement_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  const departments = Array.from(new Set(data.users.map(u => u.department)))
  const managers = data.users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN')

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">Achievement Intelligence</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Cross-fleet performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-white/10" onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={exportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="glass border-white/10 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Cycle</label>
            <Select value={filters.cycleId} onValueChange={(val) => setFilters(f => ({ ...f, cycleId: val }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-white/10">
                {data.cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Quarter</label>
            <Select value={filters.quarter} onValueChange={(val) => setFilters(f => ({ ...f, quarter: val as any }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="ALL">Full Cycle</SelectItem>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4_ANNUAL">Q4 Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Department</label>
            <Select value={filters.department} onValueChange={(val) => setFilters(f => ({ ...f, department: val }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="ALL">All Depts</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Manager</label>
            <Select value={filters.managerId} onValueChange={(val) => setFilters(f => ({ ...f, managerId: val }))}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="ALL">All Leads</SelectItem>
                {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-xs uppercase font-bold py-6">Employee</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6">Goal Title</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6">UoM</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6">Target</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6">Actual</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Score</TableHead>
                <TableHead className="text-xs uppercase font-bold py-6 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">No matching achievements found.</TableCell></TableRow>
              ) : (
                reportRows.map((row, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="font-bold text-sm">{row.employee}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{row.department}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">{row.goal}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.uom.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm">{row.target}</TableCell>
                    <TableCell className="text-sm font-bold text-primary">{row.actual}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={row.score >= 80 ? "bg-primary/20 text-primary" : row.score >= 50 ? "bg-amber-500/20 text-amber-500" : "bg-destructive/20 text-destructive"}>
                        {row.score}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[9px] uppercase font-black border-white/10">{row.status}</Badge>
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
