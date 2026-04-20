import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { Paper } from '@/components/atoms/Paper';
import { Link } from '@/components/atoms/Link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'DMCA dan Takedown',
  description: 'Kirim laporan hak cipta, koreksi metadata, atau permintaan takedown untuk konten yang tampil di jawatch.',
  path: '/dmca',
  keywords: ['dmca jawatch', 'takedown jawatch', 'copyright jawatch', 'lapor hak cipta jawatch'],
});

const REQUIREMENTS = [
  'Identitas pemilik hak atau pihak yang diberi kuasa.',
  'URL jawatch yang dipermasalahkan.',
  'Deskripsi karya yang diklaim dan bukti kepemilikan atau kuasa.',
  'Pernyataan bahwa laporan dibuat dengan itikad baik.',
  'Kontak balasan yang aktif.',
] as const;

export default function DmcaPage() {
  return (
    <main className="app-shell" data-theme="default">
      <div className="app-container-wide py-8 md:py-12">
        <section className="surface-panel-elevated p-6 md:p-10">
          <div className="max-w-3xl space-y-4">
            <Scale className="h-7 w-7 text-[var(--accent)]" />
            <p className="type-kicker">Trust center</p>
            <h1 className="font-[var(--font-heading)] text-[clamp(2.4rem,7vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground">
              DMCA dan Takedown
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              Jika kamu pemilik hak atau perwakilan resmi dan menemukan konten, metadata, gambar, atau tautan yang
              bermasalah, kirim laporan lengkap supaya bisa diproses dengan jelas.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <h2 className="text-lg font-bold text-foreground">Yang perlu disertakan</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              {REQUIREMENTS.map((item) => (
                <li key={item} className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Paper>

          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <h2 className="text-lg font-bold text-foreground">Kirim laporan</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Gunakan halaman contact dan pilih subjek yang paling jelas. Laporan yang lengkap lebih cepat diproses.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface-1"
            >
              Buka Contact
            </Link>
          </Paper>
        </section>
      </div>
    </main>
  );
}
