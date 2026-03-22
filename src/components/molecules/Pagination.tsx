import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/atoms/Button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  theme?: "manga" | "anime" | "donghua";
  className?: string;
}

export function Pagination({ 
  currentPage, 
  hasMore, 
  onPageChange, 
  className 
}: PaginationProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4 py-8", className)}>
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <span className="text-sm font-black bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
        PAGE {currentPage}
      </span>

      <Button
        variant="outline"
        size="icon"
        disabled={!hasMore}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
