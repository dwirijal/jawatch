import type { Metadata } from 'next';
import { Mail, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { TrackedMarketingLink } from '@/components/molecules/TrackedMarketingLink';
import { buildSupportCta, JAWATCH_MARKETING } from '@/lib/marketing';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact jawatch',
  description: 'Hubungi jawatch untuk laporan konten, DMCA, koreksi metadata, kerja sama, iklan, atau support.',
  path: '/contact',
  keywords: ['contact jawatch', 'hubungi jawatch', 'kerja sama jawatch', 'iklan jawatch'],
});

const CONTACT_TOPICS = [
  'Laporan hak cipta atau DMCA',
  'Koreksi metadata, poster, episode, atau chapter',
  'Kerja sama sponsor dan iklan',
  'Feedback fitur watch, read, vault, atau komunitas',
] as const;

export default function ContactPage() {
  const supportCta = buildSupportCta();

  return (
    <main className="app-shell" data-theme="default">
      <div className="app-container-wide py-8 md:py-12">
        <section className="surface-panel-elevated p-6 md:p-10">
          <div className="max-w-3xl space-y-4">
            <MessageSquareText className="h-7 w-7 text-[var(--accent)]" />
            <p className="type-kicker">Trust center</p>
            <h1 className="font-[var(--font-heading)] text-[clamp(2.4rem,7vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground">
              Contact jawatch
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              Pakai halaman ini untuk laporan konten, koreksi katalog, kerja sama, atau masukan produk. Untuk dukungan
              operasional sukarela, gunakan Trakteer.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <Mail className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-4 text-lg font-bold text-foreground">Email</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Kirim detail laporan atau kerja sama ke email kontak. Sertakan URL halaman, konteks masalah, dan bukti
              pendukung jika ada.
            </p>
            <Button variant="secondary" className="mt-5" asChild>
              <a href={`mailto:${JAWATCH_MARKETING.contact.email}`}>{JAWATCH_MARKETING.contact.email}</a>
            </Button>
          </Paper>

          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <h2 className="text-lg font-bold text-foreground">Topik yang bisa dikirim</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CONTACT_TOPICS.map((topic) => (
                <div key={topic} className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
                  {topic}
                </div>
              ))}
            </div>
            <TrackedMarketingLink
              href={supportCta.href}
              eventName="support_click"
              eventProperties={{ placement: 'contact-page', title: supportCta.title }}
              className="mt-5 inline-flex rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-[var(--accent-strong)]"
            >
              {supportCta.label}
            </TrackedMarketingLink>
          </Paper>
        </section>
      </div>
    </main>
  );
}
