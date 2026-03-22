import { LucideIcon, AlertCircle, SearchX } from "lucide-react"
import { Button } from "@/components/atoms/Button"
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
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center space-y-4 rounded-3xl bg-zinc-900/20 border border-zinc-800 border-dashed",
      className
    )}>
      <div className={cn(
        "p-4 rounded-full",
        type === "error" ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-500"
      )}>
        <FinalIcon className="w-10 h-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-zinc-200">{title}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant={type === "error" ? "donghua" : "default"} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
