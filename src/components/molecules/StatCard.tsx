import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn(
      "p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all shadow-sm",
      className
    )}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-black uppercase text-zinc-200">{value}</span>
    </div>
  );
}
