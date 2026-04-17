import { AdminShell } from '@/components/admin/AdminShell';
import { AdminUnitTable } from '@/components/admin/AdminUnitTable';

export default function AdminUnitsPage() {
  return (
    <AdminShell
      title="Units"
      description="Split-but-connected unit operations surface for stream readiness, pages readiness, unit state, and parent title context."
    >
      <AdminUnitTable />
    </AdminShell>
  );
}
