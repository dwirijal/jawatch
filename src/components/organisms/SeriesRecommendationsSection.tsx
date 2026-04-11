import Image from 'next/image';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { getSeriesRecommendations } from '@/lib/adapters/series';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
} from '@/lib/series-presentation';
import { getMediaPosterAspectClass, type ThemeType } from '@/lib/utils';

interface SeriesRecommendationsSectionProps {
  currentSlug: string;
  genres: string[];
  country: string;
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'drama'>;
}

export async function SeriesRecommendationsSection({
  currentSlug,
  genres,
  country,
  theme,
}: SeriesRecommendationsSectionProps) {
  const recommendations = await getSeriesRecommendations({
    currentSlug,
    genres,
    country,
    includeNsfw: false,
  });

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section id="related" className="space-y-8">
      <DetailSectionHeading
        title="More Like This"
        theme={theme}
        aside={<Badge variant="outline">{recommendations.length} Judul Menantimu</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {recommendations.map((item) => (
          <Link key={item.slug} href={`/series/${item.slug}`} prefetch={false} className="group block h-full">
            <Paper tone="muted" shadow="sm" padded={false} className="h-full overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
              <div className={`relative overflow-hidden bg-surface-2 ${getMediaPosterAspectClass(getSeriesTheme(item.type))}`}>
                <Image
                  src={item.poster || '/favicon.ico'}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1280px) 44vw, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute left-3 top-3">
                  <Badge variant={getSeriesTheme(item.type)}>{getSeriesBadgeText(item.type)}</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
              </div>

              <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-sm font-bold text-white">{item.title}</h3>
                <p className="line-clamp-2 text-xs leading-5 text-zinc-400">{formatSeriesCardSubtitle(item)}</p>
              </div>
            </Paper>
          </Link>
        ))}
      </div>
    </section>
  );
}
