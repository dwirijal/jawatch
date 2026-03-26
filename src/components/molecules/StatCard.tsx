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
      "group flex min-h-[4.25rem] items-center justify-between rounded-[var(--radius-sm)] bg-surface-1/80 p-3.5 shadow-none transition-colors hover:bg-surface-elevated md:p-4",
      className
    )}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
        <Typography size="xs" uppercase className="tracking-[0.16em] text-zinc-500">{label}</Typography>
      </div>
      <Typography size="sm" className="text-zinc-200">{value}</Typography>
    </Paper>
  );
}
