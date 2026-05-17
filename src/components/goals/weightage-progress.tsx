
"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WeightageProgressProps {
  total: number
  count: number
}

export function WeightageProgress({ total, count }: WeightageProgressProps) {
  const isPerfect = total === 100
  const isOver = total > 100
  const isUnder = total < 100

  return (
    <div className="glass border-white/10 p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Weightage</h4>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-black font-headline tracking-tighter",
              isPerfect ? "text-primary" : isOver ? "text-destructive" : "text-amber-500"
            )}>
              {total}%
            </span>
            <span className="text-muted-foreground text-sm">/ 100%</span>
          </div>
        </div>
        <div className="text-right">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Goal Count</h4>
          <div className="flex items-baseline gap-2 justify-end">
            <span className={cn(
              "text-3xl font-black font-headline tracking-tighter",
              count > 8 ? "text-destructive" : "text-foreground"
            )}>
              {count}
            </span>
            <span className="text-muted-foreground text-sm">/ 8 Max</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Progress 
          value={Math.min(total, 100)} 
          className={cn(
            "h-2 bg-white/5",
            isPerfect ? "[&>div]:bg-primary" : isOver ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"
          )} 
        />
        <div className="flex justify-between">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {isPerfect ? "Ready for submission" : isOver ? "Weightage exceeds limit" : "Additional weightage required"}
          </p>
          {isPerfect && count <= 8 && count > 0 && (
            <Badge variant="outline" className="border-primary text-primary text-[10px] uppercase font-bold px-2 py-0">
              Valid Configuration
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
