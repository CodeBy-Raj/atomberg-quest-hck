"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save, Lock } from "lucide-react"
import { ThrustArea, Goal, UOMType } from "@/lib/types"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const goalSchema = z.object({
  thrustAreaId: z.string().min(1, "Thrust Area is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "PERCENT_MIN", "PERCENT_MAX", "TIMELINE", "ZERO"]),
  target: z.string().min(1, "Target is required"),
  weightage: z.coerce.number().min(10, "Minimum weightage is 10%").max(100, "Maximum weightage is 100%"),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalFormProps {
  initialData?: Partial<Goal>
  thrustAreas: ThrustArea[]
  onSubmit: (data: GoalFormValues) => Promise<void>
  isLoading?: boolean
  disabledFields?: (keyof GoalFormValues)[]
}

const UOM_HELPERS: Record<UOMType, string> = {
  NUMERIC_MIN: "Numeric (Min) – Higher is better",
  NUMERIC_MAX: "Numeric (Max) – Lower is better",
  PERCENT_MIN: "Percentage (Min) – Reach at least X%",
  PERCENT_MAX: "Percentage (Max) – Stay below X%",
  TIMELINE: "Timeline – Completion by date",
  ZERO: "Zero – Absolute zero target",
}

export function GoalForm({ initialData, thrustAreas, onSubmit, isLoading, disabledFields = [] }: GoalFormProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrustAreaId: initialData?.thrustAreaId || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      uomType: (initialData?.uomType as UOMType) || "NUMERIC_MIN",
      target: initialData?.target || "",
      weightage: initialData?.weightage || 10,
    },
  })

  const watchUom = form.watch("uomType")

  React.useEffect(() => {
    if (watchUom === "ZERO") {
      form.setValue("target", "0")
    }
  }, [watchUom, form])

  const isFieldDisabled = (fieldName: keyof GoalFormValues) => disabledFields.includes(fieldName)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="thrustAreaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Thrust Area {isFieldDisabled('thrustAreaId') && <Lock className="w-3 h-3 text-muted-foreground" />}
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isFieldDisabled('thrustAreaId')}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select a focus area" />
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
                <FormLabel className="flex items-center gap-2">
                  Goal Title {isFieldDisabled('title') && <Lock className="w-3 h-3 text-muted-foreground" />}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Increase platform uptime" 
                    className="bg-white/5 border-white/10" 
                    disabled={isFieldDisabled('title')}
                    {...field} 
                  />
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
              <FormLabel className="flex items-center gap-2">
                Description {isFieldDisabled('description') && <Lock className="w-3 h-3 text-muted-foreground" />}
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide context and success criteria..." 
                  className="bg-white/5 border-white/10 min-h-[100px]" 
                  disabled={isFieldDisabled('description')}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="uomType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Unit of Measure (UoM) {isFieldDisabled('uomType') && <Lock className="w-3 h-3 text-muted-foreground" />}
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isFieldDisabled('uomType')}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass border-white/10">
                    {Object.entries(UOM_HELPERS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label.split(' – ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-[10px] leading-tight mt-1">
                  {UOM_HELPERS[field.value as UOMType]}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Target Value {isFieldDisabled('target') && <Lock className="w-3 h-3 text-muted-foreground" />}
                </FormLabel>
                <FormControl>
                  {watchUom === "TIMELINE" ? (
                    <Popover>
                      <PopoverTrigger asChild disabled={isFieldDisabled('target')}>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-white/5 border-white/10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : watchUom === "ZERO" ? (
                    <Input value="0" disabled className="bg-white/5 border-white/10 opacity-50" />
                  ) : (
                    <Input 
                      placeholder="e.g., 99.9" 
                      className="bg-white/5 border-white/10" 
                      disabled={isFieldDisabled('target')}
                      {...field} 
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Weightage (%) {isFieldDisabled('weightage') && <Lock className="w-3 h-3 text-muted-foreground" />}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="10" 
                    max="100" 
                    className="bg-white/5 border-white/10" 
                    disabled={isFieldDisabled('weightage')}
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-[10px]">Min 10% per goal</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {initialData?.id ? "Update Goal" : "Save Goal"}
          </Button>
        </div>
      </form>
    </Form>
  )
}