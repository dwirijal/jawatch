import { redirect } from 'next/navigation';
import { requireCompletedOnboarding } from '@/lib/auth/session';

export default async function CollectionPage() {
  await requireCompletedOnboarding('/vault/saved');
  redirect('/vault/saved');
}
