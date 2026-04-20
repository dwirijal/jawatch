import { Star, TrendingUp, Users, ExternalLink, Play } from 'lucide-react';
import type { JikanEnrichment } from '@/lib/types';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';

interface MetadataPanelProps {
  data: JikanEnrichment | null;
  loading: boolean;
}

const STAT_ITEMS = [
  {
    key: 'score',
    label: 'MAL Score',
    icon: Star,
    iconClassName: 'fill-yellow-500 text-yellow-500',
    getValue: (data: JikanEnrichment) => data.score || 'N/A',
  },
  {
    key: 'rank',
    label: 'Global Rank',
    icon: TrendingUp,
    iconClassName: 'text-blue-500',
    getValue: (data: JikanEnrichment) => `#${data.rank || 'N/A'}`,
  },
  {
    key: 'popularity',
    label: 'Popularity',
    icon: Users,
    iconClassName: 'text-purple-500',
    getValue: (data: JikanEnrichment) => `#${data.popularity || 'N/A'}`,
  },
] as const;

export function MetadataPanel({ data, loading }: MetadataPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Paper key={i} tone="muted" className="h-20" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Filter out null/undefined tags
  const tags = [
    data.status,
    data.source,
    data.rating,
    data.year ? String(data.year) : null,
    data.season,
  ].filter(Boolean) as string[];

  const allTags = [
    ...tags,
    ...data.genres,
    ...data.themes,
    ...data.studios,
  ].slice(0, 10);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Paper key={item.key} tone="muted" className="flex min-h-[6.5rem] flex-col justify-between gap-3 rounded-[var(--radius-sm)] p-4 md:p-5">
              <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
                <Icon className={`h-3.5 w-3.5 ${item.iconClassName}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
              <p className="text-xl font-black text-foreground md:text-2xl">{item.getValue(data)}</p>
            </Paper>
          );
        })}

        <Paper tone="muted" className="flex min-h-[6.5rem] flex-col justify-between gap-3 rounded-[var(--radius-sm)] p-4 md:p-5">
          <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
            <ExternalLink className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Official Source</span>
          </div>
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            MYANIMELIST.NET
          </a>
        </Paper>
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag, i) => (
          <Badge key={i} variant="outline" className="rounded-[var(--radius-sm)] px-2.5 py-1">
            {tag}
          </Badge>
        ))}
      </div>

      {data.trailer_url && (
        <Paper tone="muted" shadow="sm" className="flex flex-col items-center justify-between gap-5 rounded-[var(--radius-2xl)] p-5 md:flex-row md:p-6">
           <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground md:text-xl">Official Trailer</h3>
              <p className="text-xs font-medium text-muted-foreground">Watch the official promotional video for this series.</p>
           </div>
           <Button variant="outline" size="lg" className="h-12 rounded-[var(--radius-sm)] px-6" asChild>
             <a 
               href={data.trailer_url} 
               target="_blank" 
               rel="noopener noreferrer"
             >
               Watch on YouTube <Play className="ml-2 h-3.5 w-3.5 fill-current" />
             </a>
           </Button>
        </Paper>
      )}
    </div>
  );
}
