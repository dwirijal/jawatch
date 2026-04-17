import { Paper } from '@/components/atoms/Paper';

const unitRows = [
  { unit: 'Watch units', state: 'Streams/downloads', parent: 'Series or movie', moderation: 'Comments summary' },
  { unit: 'Read units', state: 'Pages readiness', parent: 'Comic title', moderation: 'Chapter context' },
];

export function AdminUnitTable() {
  return (
    <Paper tone="muted" shadow="sm" className="overflow-hidden">
      <div className="border-b border-border-subtle p-5">
        <h2 className="text-xl font-black">Units</h2>
        <p className="text-sm text-zinc-400">Inspect readiness, parent title context, unit state, and light moderation signals.</p>
      </div>
      <div className="divide-y divide-border-subtle">
        {unitRows.map((row) => (
          <div key={row.unit} className="grid gap-3 p-5 text-sm md:grid-cols-4">
            <strong>{row.unit}</strong>
            <span>{row.state}</span>
            <span>{row.parent}</span>
            <span>{row.moderation}</span>
          </div>
        ))}
      </div>
    </Paper>
  );
}
