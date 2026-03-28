import DonghuaPageClient from './DonghuaPageClient';
import { getDonghuaHome, getDonghuaSchedule } from '@/lib/adapters/donghua';

export default async function DonghuaPage() {
  const [initialData, initialSchedule] = await Promise.all([
    getDonghuaHome().catch(() => ({
      latest_updates: [],
      ongoing_series: [],
      completed_series: [],
    })),
    getDonghuaSchedule().catch(() => []),
  ]);

  return <DonghuaPageClient initialData={initialData} initialSchedule={initialSchedule} />;
}
