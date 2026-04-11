import { notFound } from 'next/navigation';

export async function requireNsfwAccess() {
  notFound();
}
