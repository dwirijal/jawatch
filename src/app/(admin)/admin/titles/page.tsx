import { AdminShell } from '@/components/admin/AdminShell';
import { AdminTitleTable } from '@/components/admin/AdminTitleTable';

export default function AdminTitlesPage() {
  return (
    <AdminShell
      title="Titles"
      description="Custom Jawatch operations surface for canonical title metadata, availability state, release date overrides, and search visibility."
    >
      <AdminTitleTable />
    </AdminShell>
  );
}
