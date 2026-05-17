"use client"

import * as React from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Goal, User } from "@/lib/types"
import { 
  approveGoals, 
  returnGoals,
  getThrustAreas 
} from "@/lib/repository"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  Loader2, 
  Save,
  MessageSquare
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface EmployeeReviewSheetProps {
  member: (User & { goals: Goal[], totalWeightage: number }) | null
  onClose: () => void
  onUpdate: () => void
}

export function EmployeeReviewSheet({ member, onClose, onUpdate }: EmployeeReviewSheetProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [editableGoals, setEditableGoals] = React.useState<Goal[]>([])
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false)
  const [returnComment, setReturnComment] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const [thrustAreas, setThrustAreas] = React.useState<{id: string, name: string}[]>([])

  React.useEffect(() => {
    if (member) {
      setEditableGoals(JSON.parse(JSON.stringify(member.goals)))
      getThrustAreas().then(setThrustAreas)
    }
  }, [member])

  const totalWeightage = editableGoals.reduce((sum, g) => sum + g.weightage, 0)
  const isSubmissionValid = totalWeightage === 100 && editableGoals.length > 0

  const handleGoalChange = (id: string, field: keyof Goal, value: any) => {
    setEditableGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const handleApprove = async () => {
    if (!user || !member) return
    setProcessing(true)
    try {
      await approveGoals(editableGoals, user.id)
      toast({ title: "Goals Approved", description: `Quests for ${member.name} have been locked and synced.` })
      onUpdate()
      onClose()
    } catch (error) {
      toast({ variant: "destructive", title: "Approval Failed" })
    } finally {
      setProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!user || !member || !returnComment.trim()) return
    setProcessing(true)
    try {
      await returnGoals(member.goals, returnComment, user.id)
      toast({ title: "Goal Sheet Returned", description: `Feedback sent to ${member.name}.` })
      onUpdate()
      onClose()
    } catch (error) {
      toast({ variant: "destructive", title: "Operation Failed" })
    } finally {
      setProcessing(false)
      setIsReturnDialogOpen(false)
    }
  }

  if (!member) return null

  return (
    <>
      <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-3xl glass border-white/10 p-0 flex flex-col">
          <SheetHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                {member.name.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-2xl font-black font-headline tracking-tight">{member.name}</SheetTitle>
                <SheetDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
                  Reviewing Goal Sheet • {member.department}
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Weightage</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-2xl font-black", totalWeightage === 100 ? "text-primary" : "text-amber-500")}>
                    {totalWeightage}%
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 text-right">Goal Count</p>
                <p className="text-2xl font-black text-right">{editableGoals.length} <span className="text-xs font-normal text-muted-foreground">/ 8</span></p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-8">
            <div className="space-y-6 pb-8">
              {editableGoals.map((goal, idx) => (
                <div key={goal.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Goal #{idx + 1}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded">
                      {thrustAreas.find(a => a.id === goal.thrustAreaId)?.name || 'Focus Area'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Title</p>
                      <Input 
                        value={goal.title}
                        onChange={(e) => handleGoalChange(goal.id, 'title', e.target.value)}
                        className="bg-white/5 border-white/10 text-sm h-9"
                      />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Description</p>
                      <Textarea 
                        value={goal.description}
                        onChange={(e) => handleGoalChange(goal.id, 'description', e.target.value)}
                        className="bg-white/5 border-white/10 text-xs min-h-[60px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Target</p>
                        <Input 
                          value={goal.target}
                          onChange={(e) => handleGoalChange(goal.id, 'target', e.target.value)}
                          className="bg-white/5 border-white/10 text-sm h-9"
                        />
                      </div>
                      <div className="grid gap-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Weight (%)</p>
                        <Input 
                          type="number"
                          value={goal.weightage}
                          onChange={(e) => handleGoalChange(goal.id, 'weightage', parseInt(e.target.value))}
                          className="bg-white/5 border-white/10 text-sm h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <SheetFooter className="p-8 pt-4 bg-white/5 border-t border-white/10">
            <div className="flex flex-col w-full gap-3">
              {!isSubmissionValid && (
                <div className="flex items-center gap-2 text-destructive text-[10px] font-bold uppercase mb-2">
                  <AlertCircle className="w-3 h-3" />
                  Total weightage must equal 100% to approve
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReturnDialogOpen(true)}
                  disabled={processing}
                  className="border-destructive/20 text-destructive hover:bg-destructive/10 h-12 font-bold uppercase tracking-widest text-xs"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Return for Rework
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={processing || !isSubmissionValid}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approve Sheet
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-destructive" />
              Provide Feedback
            </DialogTitle>
            <DialogDescription>
              Explain why this sheet is being returned. The employee will see this comment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g., Weightage for Innovation goal is too low. Please increase to 20%..."
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReturnDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReturn}
              disabled={processing || !returnComment.trim()}
              className="bg-destructive hover:bg-destructive/90 text-white font-bold"
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}