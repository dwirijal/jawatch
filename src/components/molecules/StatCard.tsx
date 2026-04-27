import { LucideIcon } from "lucide-react"
import { Paper } from "@/components/atoms/Paper"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/atoms/Typography"

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <Paper className={cn(
      "group flex min-h-[4.25rem] items-center justify-between rounded-[var(--radius-sm)] bg-surface-1/80 p-[calc(var(--space-sm)+var(--space-2xs))] shadow-none transition-colors hover:bg-surface-elevated md:p-4",
      className
    )}>
      <div className="flex items-center gap-[var(--space-sm)]">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground/80 transition-colors" />}
        <Typography size="xs" uppercase className="tracking-[var(--type-tracking-kicker)] text-muted-foreground">{label}</Typography>
      </div>
      <Typography size="sm" className="text-foreground/90">{value}</Typography>
    </Paper>
  );
}
