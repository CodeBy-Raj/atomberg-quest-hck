"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ThrustArea, User, UOMType } from "@/lib/types"
import { createSharedGoal, getActiveCycle } from "@/lib/repository"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Share2, Search } from "lucide-react"

const sharedGoalSchema = z.object({
  thrustAreaId: z.string().min(1, "Thrust Area is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "PERCENT_MIN", "PERCENT_MAX", "TIMELINE", "ZERO"]),
  target: z.string().min(1, "Target is required"),
  recipientIds: z.array(z.string()).min(1, "Select at least one recipient"),
})

type SharedGoalFormValues = z.infer<typeof sharedGoalSchema>

interface SharedGoalFormProps {
  thrustAreas: ThrustArea[]
  users: User[]
  onSuccess: () => void
}

export function SharedGoalForm({ thrustAreas, users, onSuccess }: SharedGoalFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const form = useForm<SharedGoalFormValues>({
    resolver: zodResolver(sharedGoalSchema),
    defaultValues: {
      thrustAreaId: "",
      title: "",
      description: "",
      uomType: "NUMERIC_MIN",
      target: "",
      recipientIds: [],
    },
  })

  const filteredUsers = users.filter(u => 
    u.id !== user?.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const onSubmit = async (values: SharedGoalFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      const activeCycle = await getActiveCycle()
      if (!activeCycle) throw new Error("No active performance cycle found.")

      await createSharedGoal(
        {
          cycleId: activeCycle.id,
          thrustAreaId: values.thrustAreaId,
          title: values.title,
          description: values.description || "",
          uomType: values.uomType,
          target: values.target,
          weightage: 0, // Parent weightage not used in sheet
          status: 'APPROVED',
          isShared: true,
          parentGoalId: null,
          lockedAt: new Date().toISOString(),
          returnComment: null,
        },
        values.recipientIds,
        user.id
      )

      toast({
        title: "Broadcast Successful",
        description: `Quest shared with ${values.recipientIds.length} team members.`,
      })
      onSuccess()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Broadcast Failed",
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="thrustAreaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thrust Area</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass border-white/10">
                    {thrustAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Achieve Departmental KPI" className="bg-white/5 border-white/10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Details for the team..." 
                  className="bg-white/5 border-white/10 min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="uomType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UoM</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="NUMERIC_MIN">Numeric (Min)</SelectItem>
                    <SelectItem value="PERCENT_MIN">Percentage (Min)</SelectItem>
                    <SelectItem value="TIMELINE">Timeline</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 95" className="bg-white/5 border-white/10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Recipients</FormLabel>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search people..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 h-9 text-xs"
            />
          </div>
          <ScrollArea className="h-[200px] border border-white/10 rounded-lg p-4 bg-white/5">
            <div className="grid gap-4">
              {filteredUsers.map((u) => (
                <FormField
                  key={u.id}
                  control={form.control}
                  name="recipientIds"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(u.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, u.id])
                              : field.onChange(field.value?.filter((val) => val !== u.id))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground">{u.email} • {u.department}</div>
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </ScrollArea>
          <FormMessage />
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-10 h-12 shadow-xl shadow-accent/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
            Confirm Broadcast
          </Button>
        </div>
      </form>
    </Form>
  )
}