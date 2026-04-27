import { Paper } from '@/components/atoms/Paper';

const titleRows = [
  { title: 'Canonical titles', availability: 'Mixed', units: 'Aggregated units', visibility: 'Title-first SEO' },
  { title: 'Manual overrides', availability: 'Controlled', units: 'Release dates', visibility: 'Audit required' },
];

export function AdminTitleTable() {
  return (
    <Paper tone="muted" shadow="sm" className="overflow-hidden">
      <div className="border-b border-border-subtle p-[var(--space-lg)]">
        <h2 className="text-xl font-black">Titles</h2>
        <p className="text-sm text-muted-foreground">Search, metadata, availability, release date overrides, and visibility summaries.</p>
      </div>
      <div className="divide-y divide-border-subtle">
        {titleRows.map((row) => (
          <div key={row.title} className="grid gap-[var(--space-sm)] p-[var(--space-lg)] text-sm md:grid-cols-4">
            <strong>{row.title}</strong>
            <span>{row.availability}</span>
            <span>{row.units}</span>
            <span>{row.visibility}</span>
          </div>
        ))}
      </div>
    </Paper>
  );
}
