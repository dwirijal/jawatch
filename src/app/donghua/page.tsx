import DonghuaPageClient from './DonghuaPageClient';
import { getDonghuaHome } from '@/lib/api';

export default async function DonghuaPage() {
  const initialData = await getDonghuaHome().catch(() => ({
    latest_updates: [],
    ongoing_series: [],
  }));
  return <DonghuaPageClient initialData={initialData} />;
}
