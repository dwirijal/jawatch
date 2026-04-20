import { LucideIcon, AlertCircle, SearchX } from "lucide-react"
import { Button } from "@/components/atoms/Button"
import { Paper } from "@/components/atoms/Paper"
import { cn } from "@/lib/utils"

interface StateInfoProps {
  title: string;
  description: string;
  type?: "empty" | "error";
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function StateInfo({ 
  title, 
  description, 
  type = "empty", 
  icon: Icon, 
  actionLabel, 
  onAction,
  className 
}: StateInfoProps) {
  const DefaultIcon = type === "error" ? AlertCircle : SearchX;
  const FinalIcon = Icon || DefaultIcon;

  return (
    <Paper
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center space-y-4 border-dashed",
        className
      )}
      tone="muted"
      shadow="sm"
    >
      <div className={cn(
        "p-4 rounded-[var(--radius-sm)]",
        type === "error" ? "bg-red-500/10 text-red-300" : "bg-surface-2 text-muted-foreground"
      )}>
        <FinalIcon className="w-10 h-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
