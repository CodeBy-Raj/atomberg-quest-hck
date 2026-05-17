
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Search, 
  ShieldAlert, 
  Loader2, 
  Clock, 
  User, 
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History
} from "lucide-react"
import { getAuditLogs, getAllUsers } from "@/lib/repository"
import { AuditLog, User as AppUser } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuditTrailPage() {
  const { user } = useAuth()
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [users, setUsers] = React.useState<AppUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    async function init() {
      const [auditLogs, allUsers] = await Promise.all([
        getAuditLogs(),
        getAllUsers()
      ])
      setLogs(auditLogs)
      setUsers(allUsers)
      setLoading(false)
    }
    init()
  }, [])

  if (!mounted || loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  const getActorName = (id: string) => users.find(u => u.id === id)?.name || id === 'system' ? "System Engine" : "Unknown"

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, HH:mm:ss")
    } catch (e) {
      return dateStr
    }
  }

  const systemEscalations = logs.filter(l => l.action === 'ESCALATE')
  const generalAudit = logs.filter(l => l.action !== 'ESCALATE')

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tighter text-foreground">Governance Intelligence</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">Immutable system event log & escalations</p>
          </div>
        </div>

        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" /> System Audit
            </TabsTrigger>
            <TabsTrigger value="escalations" className="gap-2">
              <AlertTriangle className="w-4 h-4" /> Rule Escalations (Bonus)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit">
            <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="w-[200px] text-xs uppercase font-bold py-6">Timestamp</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Actor</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Action</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Entity</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalAudit.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow 
                        className={cn(
                          "border-white/5 transition-colors cursor-pointer",
                          expandedRow === log.id ? "bg-white/5" : "hover:bg-white/5"
                        )}
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-primary" />
                            <span className="font-bold text-sm">{getActorName(log.actorId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "uppercase text-[9px] font-black",
                            log.action === 'UNLOCK' ? "bg-destructive/20 text-destructive" :
                            log.action === 'APPROVE' ? "bg-primary/20 text-primary" :
                            "bg-white/5 text-muted-foreground"
                          )}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-muted-foreground" />
                            {log.entity} <span className="text-[10px] font-mono opacity-50">#{log.entityId.slice(-6)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {expandedRow === log.id ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow className="border-white/5 bg-black/40">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-6 grid grid-cols-2 gap-8 font-mono text-[11px]">
                              <div className="space-y-2">
                                <p className="text-primary font-bold uppercase tracking-widest text-[9px]">State Before</p>
                                <div className="p-4 rounded bg-white/5 border border-white/5 whitespace-pre-wrap overflow-x-auto max-h-[300px]">
                                  {JSON.stringify(log.before, null, 2) || "NULL"}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-accent font-bold uppercase tracking-widest text-[9px]">State After</p>
                                <div className="p-4 rounded bg-white/5 border border-white/5 whitespace-pre-wrap overflow-x-auto max-h-[300px]">
                                  {JSON.stringify(log.after, null, 2) || "NULL"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="escalations">
            <div className="glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="w-[200px] text-xs uppercase font-bold py-6">Timestamp</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Escalation Type</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Subject</TableHead>
                    <TableHead className="text-xs uppercase font-bold py-6">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemEscalations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                        No active escalations detected. Compliance is 100%.
                      </TableCell>
                    </TableRow>
                  ) : (
                    systemEscalations.map((log) => (
                      <TableRow key={log.id} className="border-white/5 hover:bg-destructive/5 transition-colors">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[9px] font-black uppercase">
                            {log.after.type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          {log.after.employee}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground italic">
                          "{log.after.message}"
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
