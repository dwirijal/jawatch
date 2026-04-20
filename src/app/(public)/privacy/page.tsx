import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { Paper } from '@/components/atoms/Paper';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'Kebijakan privasi jawatch untuk data analytics, iklan, preferensi lokal, akun, dan komunikasi support.',
  path: '/privacy',
  keywords: ['privacy policy jawatch', 'kebijakan privasi jawatch', 'adsense privacy jawatch'],
});

const SECTIONS = [
  {
    title: 'Data yang dipakai',
    body: 'jawatch dapat memproses data teknis seperti halaman yang dibuka, perangkat, browser, event analytics, preferensi tema, riwayat lokal, bookmark, dan status akun jika kamu login.',
  },
  {
    title: 'Analytics dan iklan',
    body: 'jawatch menggunakan analytics untuk memahami performa produk dan dapat menggunakan penyedia iklan seperti Google AdSense. Pihak ketiga dapat memakai cookie, web beacon, alamat IP, atau identifier lain sesuai kebijakan mereka.',
  },
  {
    title: 'Akun dan preferensi',
    body: 'Jika kamu login, data profil dan preferensi dipakai untuk fitur vault, lanjut nonton/baca, bookmark, dan personalisasi. Data lokal dapat tetap tersimpan di perangkat untuk pengalaman guest.',
  },
  {
    title: 'Kontrol pengguna',
    body: 'Kamu dapat membersihkan data browser, logout dari akun, atau menghubungi kami melalui halaman Contact untuk permintaan terkait privasi.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="app-shell" data-theme="default">
      <div className="app-container-wide py-8 md:py-12">
        <section className="surface-panel-elevated p-6 md:p-10">
          <div className="max-w-3xl space-y-4">
            <ShieldCheck className="h-7 w-7 text-[var(--accent)]" />
            <p className="type-kicker">Trust center</p>
            <h1 className="font-[var(--font-heading)] text-[clamp(2.4rem,7vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground">
              Privacy Policy
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              Kebijakan ini menjelaskan bagaimana jawatch menangani data untuk menjaga katalog tetap cepat, aman,
              dan bisa dimonetisasi secara transparan.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Paper key={section.title} tone="muted" shadow="sm" className="p-5 md:p-6">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </Paper>
          ))}
        </section>
      </div>
    </main>
  );
}
