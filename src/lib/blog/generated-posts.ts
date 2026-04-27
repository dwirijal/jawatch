import type { BlogPost, BlogRelatedLink } from './types.ts';

type FranchiseGuide = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  related: BlogRelatedLink[];
  watchOrder: string;
  note: string;
};

const GENERATED_FRANCHISE_GUIDES: FranchiseGuide[] = [
  {
    slug: 'panduan-overlord',
    title: 'Panduan Nonton Overlord',
    description: 'Panduan cepat mengikuti Overlord dari season pertama sampai season keempat dan movie yang terkait.',
    tags: ['overlord', 'anime isekai', 'urutan nonton'],
    image: 'https://v2.samehadaku.how/wp-content/uploads/2024/07/88019.jpg',
    related: [
      { type: 'series', slug: 'overlord', label: 'Overlord' },
      { type: 'series', slug: 'overlord-ii', label: 'Overlord II' },
      { type: 'series', slug: 'overlord-iii', label: 'Overlord III' },
      { type: 'series', slug: 'overlord-season-4', label: 'Overlord Season 4' },
    ],
    watchOrder: 'Overlord, Overlord II, Overlord III, lalu Overlord Season 4.',
    note: 'Movie bisa ditonton sebagai pelengkap setelah kamu memahami konflik utama Ainz dan kerajaan di season awal.',
  },
  {
    slug: 'panduan-chainsaw-man',
    title: 'Panduan Nonton Chainsaw Man',
    description: 'Panduan mengikuti Chainsaw Man dari season anime utama sampai movie Reze-hen ketika tersedia.',
    tags: ['chainsaw man', 'anime action', 'urutan nonton'],
    image: 'https://v2.samehadaku.how/wp-content/uploads/2022/10/110707.jpg',
    related: [
      { type: 'series', slug: 'chainsaw-man', label: 'Chainsaw Man' },
      { type: 'series', slug: 'chainsaw-man-movie-reze-hen-subtitle-indonesia', label: 'Chainsaw Man Movie: Reze-hen' },
    ],
    watchOrder: 'Mulai dari Chainsaw Man season pertama, lalu lanjut ke movie Reze-hen jika sudah tersedia di katalog.',
    note: 'Movie Reze-hen lebih cocok ditonton setelah episode utama karena konflik dan dinamika karakter dibangun dari season pertama.',
  },
];

export function getGeneratedBlogPosts(): BlogPost[] {
  return GENERATED_FRANCHISE_GUIDES.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    description: guide.description,
    category: 'watch-guide',
    tags: guide.tags,
    publishedAt: '2026-04-27',
    updatedAt: '2026-04-27',
    image: guide.image,
    related: guide.related,
    source: 'generated',
    sections: [
      {
        heading: 'Urutan yang disarankan',
        body: guide.watchOrder,
      },
      {
        heading: 'Catatan tontonan',
        body: guide.note,
      },
      {
        heading: 'Lanjut dari katalog',
        body: 'Gunakan tautan terkait di halaman ini untuk langsung membuka judul yang sudah tersedia di Jawatch.',
      },
    ],
  }));
}
