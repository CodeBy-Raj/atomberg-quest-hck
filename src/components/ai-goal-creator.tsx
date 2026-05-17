"use client"

import * as React from "react"
import { suggestMilestones } from "@/ai/flows/ai-milestone-suggestion"
import type { SuggestMilestoneOutput } from "@/ai/flows/ai-milestone-suggestion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Zap, Loader2, Sparkles, CheckCircle2, ChevronRight, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"

export function AIGoalCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goal, setGoal] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<SuggestMilestoneOutput | null>(null)
  const [saving, setSaving] = React.useState(false)

  const handleSuggest = async () => {
    if (!goal.trim()) return
    setLoading(true)
    try {
      const result = await suggestMilestones({ goal })
      setSuggestions(result)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      toast({
        title: "AI Analysis Failed",
        description: "We couldn't generate milestones for that goal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveQuest = async () => {
    if (!suggestions || !user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "quests"), {
        userId: user.id,
        title: goal,
        status: "active",
        progress: 0,
        milestones: suggestions.milestones.map(m => ({
          ...m,
          completed: false,
          tasks: m.subTasks.map(t => ({ title: t, completed: false }))
        })),
        createdAt: new Date().toISOString()
      });
      toast({
        title: "Quest Launched!",
        description: "Your new goal has been synced and is ready for tracking.",
      });
      setSuggestions(null);
      setGoal("");
    } catch (error) {
      toast({
        title: "Launch Failed",
        description: "An error occurred while saving your quest.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="w-6 h-6 text-primary" />
            Launch New Quest
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Tell our AI what you want to achieve, and we'll break it down into high-performance milestones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g., Master Advanced Next.js Architecture"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="bg-white/5 border-white/10 focus:ring-primary h-12 text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            />
            <Button 
              onClick={handleSuggest} 
              disabled={loading || !goal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold flex items-center gap-2">
              <CheckCircle2 className="text-accent w-6 h-6" />
              Proposed Roadmap
            </h3>
            <Badge variant="outline" className="border-accent text-accent">AI Generated</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.milestones.map((milestone, idx) => (
              <Card key={idx} className="glass border-white/10 hover:border-white/20 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Phase {idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold border border-white/10">
                      {idx + 1}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{milestone.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {milestone.subTasks.map((task, sidx) => (
                    <div key={sidx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="mt-1">
                        <ChevronRight className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm text-muted-foreground leading-snug">{task}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setSuggestions(null)} className="hover:bg-white/5">
              Reset
            </Button>
            <Button onClick={saveQuest} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 shadow-lg shadow-accent/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Begin Quest
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
