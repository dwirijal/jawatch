export type BlogRelatedLink = {
  type: 'series' | 'movies' | 'comics';
  slug: string;
  label: string;
};

export type BlogSection = {
  heading: string;
  body: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: 'watch-guide' | 'recommendation' | 'release-guide';
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  image?: string;
  related: BlogRelatedLink[];
  sections: BlogSection[];
  source: 'manual' | 'generated';
};
