import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  JAWATCH_MARKETING,
  buildShareText,
  buildSupportCta,
} from '../../src/lib/marketing.ts';
import {
  buildMarketingEvent,
  normalizeMarketingEventProperties,
} from '../../src/lib/marketing-events.ts';

test('marketing config exposes Trakteer support and share image defaults', () => {
  assert.equal(JAWATCH_MARKETING.support.trakteerUrl, 'https://trakteer.id/jawatch/tip');
  assert.equal(JAWATCH_MARKETING.share.defaultImage, '/logo.png');
  assert.match(JAWATCH_MARKETING.support.reason, /katalog/i);
});

test('share copy is Indonesian-first and content aware', () => {
  assert.equal(
    buildShareText({ title: 'Demon Slayer', mediaType: 'movie' }),
    'Nonton Demon Slayer subtitle Indonesia di jawatch. Katalog cepat buat film, series, anime, donghua, dan komik.',
  );

  assert.equal(
    buildShareText({ title: 'Lookism', mediaType: 'manga' }),
    'Baca Lookism bahasa Indonesia di jawatch. Katalog cepat buat film, series, anime, donghua, dan komik.',
  );
});

test('support CTA copy stays transparent about Trakteer use', () => {
  assert.deepEqual(buildSupportCta(), {
    label: 'Dukung via Trakteer',
    href: 'https://trakteer.id/jawatch/tip',
    title: 'Bantu jawatch tetap cepat dan rapi',
    description: 'Kalau jawatch membantu sesi nonton atau baca kamu, dukungan kecil via Trakteer membantu biaya server, indexing, dan maintenance katalog.',
  });
});

test('metadata helper uses the branded share image instead of favicon', () => {
  const seo = fs.readFileSync(new URL('../../src/lib/seo.ts', import.meta.url), 'utf8');

  assert.match(seo, /JAWATCH_MARKETING\.share\.defaultImage/);
  assert.match(seo, /width: 1200/);
  assert.match(seo, /height: 630/);
  assert.doesNotMatch(seo, /image \|\| '\/favicon\.ico'/);
});

test('metadata helper expands short indexable descriptions', async () => {
  const { buildMetadata } = await import('../../src/lib/seo.ts');
  const metadata = buildMetadata({
    title: 'Baca Lookism Bahasa Indonesia',
    description: 'Temukan chapter terbaru Lookism dan baca online di jawatch.',
    path: '/comics/lookism',
  });

  assert.equal(typeof metadata.description, 'string');
  assert.ok(metadata.description.length >= 100);
  assert.match(metadata.description, /jawatch/);
  assert.match(metadata.openGraph.description, /katalog/i);
  assert.match(metadata.twitter.description, /subtitle Indonesia/i);
});

test('footer exposes a direct Trakteer support CTA', () => {
  const footer = fs.readFileSync(new URL('../../src/components/organisms/FooterContent.tsx', import.meta.url), 'utf8');

  assert.match(footer, /supportCta\.label/);
  assert.match(footer, /buildSupportCta/);
});

test('footer links trust and compliance pages instead of inert legal labels', () => {
  const footer = fs.readFileSync(new URL('../../src/components/organisms/FooterContent.tsx', import.meta.url), 'utf8');

  assert.match(footer, /href: '\/terms'/);
  assert.match(footer, /href: '\/privacy'/);
  assert.match(footer, /href: '\/dmca'/);
  assert.match(footer, /href: '\/contact'/);
  assert.doesNotMatch(footer, /aria-disabled="true"/);
});

test('trust pages exist with indexable marketing metadata', () => {
  for (const route of ['privacy', 'terms', 'dmca', 'contact']) {
    const page = fs.readFileSync(new URL(`../../src/app/(public)/${route}/page.tsx`, import.meta.url), 'utf8');
    assert.match(page, /buildMetadata/);
    assert.match(page, new RegExp(`path: '/${route}'`));
  }
});

test('marketing event helper normalizes analytics-safe payloads', () => {
  assert.deepEqual(
    buildMarketingEvent('support_click', {
      placement: 'footer-support-card',
      title: 'Bantu jawatch tetap cepat dan rapi',
      ignored: undefined,
      count: 2,
    }),
    {
      name: 'marketing_support_click',
      properties: {
        placement: 'footer-support-card',
        title: 'Bantu jawatch tetap cepat dan rapi',
        count: '2',
      },
    },
  );

  assert.deepEqual(normalizeMarketingEventProperties({ blank: ' ', ok: 'share', bool: true }), {
    ok: 'share',
    bool: 'true',
  });
});
