import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {};

export default function DramaboxPage() {
  redirect('/series/short');
}
