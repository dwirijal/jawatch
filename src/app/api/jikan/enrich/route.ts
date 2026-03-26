import { NextResponse } from 'next/server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

type JikanMediaType = 'anime' | 'manga';

interface JikanListResponse {
  data: JikanItem[];
}

interface JikanItem {
  mal_id: number;
  url: string;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  synopsis?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  status?: string | null;
  source?: string | null;
  rating?: string | null;
  year?: number | null;
  season?: string | null;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getCandidateTitles(item: JikanItem) {
  return [
    item.title,
    item.title_english,
    item.title_japanese,
    ...(item.title_synonyms ?? []),
  ].filter((value): value is string => Boolean(value));
}

function scoreCandidate(query: string, item: JikanItem) {
  const normalizedQuery = normalizeTitle(query);
  const titles = getCandidateTitles(item);
  let score = 0;

  for (const title of titles) {
    const normalizedTitle = normalizeTitle(title);

    if (normalizedTitle === normalizedQuery) {
      score = Math.max(score, 100);
      continue;
    }

    if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
      score = Math.max(score, 85);
      continue;
    }

    const queryWords = new Set(normalizedQuery.split(' ').filter(Boolean));
    const titleWords = normalizedTitle.split(' ').filter(Boolean);
    const overlap = titleWords.filter((word) => queryWords.has(word)).length;

    if (overlap > 0) {
      score = Math.max(score, overlap * 10);
    }
  }

  return score;
}

function toEnrichment(mediaType: JikanMediaType, query: string, item: JikanItem) {
  return {
    malId: item.mal_id,
    mediaType,
    title: item.title,
    matchedTitle: query,
    synopsis: item.synopsis ?? null,
    imageUrl:
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      item.images?.webp?.image_url ||
      item.images?.jpg?.image_url ||
      null,
    score: item.score ?? null,
    scoredBy: item.scored_by ?? null,
    rank: item.rank ?? null,
    popularity: item.popularity ?? null,
    status: item.status ?? null,
    source: item.source ?? null,
    rating: item.rating ?? null,
    year: item.year ?? null,
    season: item.season ?? null,
    episodes: item.episodes ?? null,
    chapters: item.chapters ?? null,
    volumes: item.volumes ?? null,
    genres: (item.genres ?? []).map((genre) => genre.name),
    themes: (item.themes ?? []).map((theme) => theme.name),
    studios: (item.studios ?? []).map((studio) => studio.name),
    url: item.url,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('type');
  const title = searchParams.get('title');

  if ((mediaType !== 'anime' && mediaType !== 'manga') || !title) {
    return NextResponse.json({ error: 'Invalid enrichment query' }, { status: 400 });
  }

  try {
    const url = new URL(`https://api.jikan.moe/v4/${mediaType}`);
    url.searchParams.set('q', title);
    url.searchParams.set('limit', '5');

    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 12 },
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jikan request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as JikanListResponse;
    const bestMatch = (payload.data ?? [])
      .map((item) => ({ item, score: scoreCandidate(title, item) }))
      .sort((left, right) => right.score - left.score)[0];

    if (!bestMatch || bestMatch.score < 20) {
      return NextResponse.json({ data: null }, {
        headers: {
          'Cache-Control': buildEdgeCacheControl(600, 3600),
        },
      });
    }

    return NextResponse.json({
      data: toEnrichment(mediaType, title, bestMatch.item),
    }, {
      headers: {
        'Cache-Control': buildEdgeCacheControl(60 * 60 * 12, 60 * 60 * 24),
      },
    });
  } catch (error) {
    console.error('Failed to fetch Jikan enrichment:', error);
    return NextResponse.json({ data: null }, {
      headers: {
        'Cache-Control': buildEdgeCacheControl(600, 3600),
      },
    });
  }
}
