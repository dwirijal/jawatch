import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Paper } from '@/components/atoms/Paper';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Syarat penggunaan jawatch untuk akses katalog, akun, komunitas, iklan, dan dukungan Trakteer.',
  path: '/terms',
  keywords: ['terms jawatch', 'syarat penggunaan jawatch', 'jawatch terms of service'],
});

const TERMS = [
  {
    title: 'Gunakan dengan wajar',
    body: 'Jangan memakai jawatch untuk spam, scraping agresif, penyalahgunaan akun, bypass keamanan, atau aktivitas yang melanggar hukum.',
  },
  {
    title: 'Konten dan hak pihak ketiga',
    body: 'Metadata, gambar, judul, dan tautan dapat berasal dari sumber pihak ketiga. Jika kamu pemilik hak dan melihat masalah, gunakan halaman DMCA atau Contact.',
  },
  {
    title: 'Akun dan fitur personal',
    body: 'Fitur vault, riwayat, bookmark, dan preferensi bergantung pada data akun atau penyimpanan lokal. Kamu bertanggung jawab menjaga akses akunmu.',
  },
  {
    title: 'Iklan dan dukungan',
    body: 'jawatch dapat menampilkan sponsor/iklan dan menyediakan dukungan sukarela via Trakteer. Dukungan tidak menjamin akses khusus ke konten berhak cipta.',
  },
] as const;

export default function TermsPage() {
  return (
    <main className="app-shell" data-theme="default">
      <div className="app-container-wide py-8 md:py-12">
        <section className="surface-panel-elevated p-6 md:p-10">
          <div className="max-w-3xl space-y-4">
            <FileText className="h-7 w-7 text-[var(--accent)]" />
            <p className="type-kicker">Trust center</p>
            <h1 className="font-[var(--font-heading)] text-[clamp(2.4rem,7vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground">
              Terms of Service
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              Syarat ini menjaga jawatch tetap aman untuk pengguna, komunitas, dan monetisasi yang transparan.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {TERMS.map((item) => (
            <Paper key={item.title} tone="muted" shadow="sm" className="p-5 md:p-6">
              <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
            </Paper>
          ))}
        </section>
      </div>
    </main>
  );
}
