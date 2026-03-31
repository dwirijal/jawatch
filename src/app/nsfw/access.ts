import { redirect } from 'next/navigation';
import { buildLoginUrl } from '@/lib/auth-gateway';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export async function requireNsfwAccess(nextPath = '/nsfw') {
  const session = await getServerAuthStatus();
  if (!session.authenticated) {
    redirect(buildLoginUrl(nextPath));
  }

  return session;
}
