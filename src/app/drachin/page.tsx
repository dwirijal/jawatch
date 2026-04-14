import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {};

export default function DrachinPage() {
  redirect('/series/short');
}
