import { VideoHeroTrailerBackground, VideoHeroTrailerControls } from '@/components/organisms/VideoHeroTrailerControls';
import { VideoDetailHeroFrame, VideoDetailHeroFrameProps } from '@/components/organisms/VideoDetailHeroFrame';

interface VideoDetailHeroWithTrailerProps extends Omit<VideoDetailHeroFrameProps, 'backgroundLayer' | 'headerAside'> {
  trailerUrl?: string | null;
}

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return null;
  }
}

export function VideoDetailHeroWithTrailer({
  trailerUrl,
  theme,
  title,
  ...props
}: VideoDetailHeroWithTrailerProps) {
  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  return (
    <VideoDetailHeroFrame
      {...props}
      theme={theme}
      title={title}
      backgroundLayer={embedUrl ? <VideoHeroTrailerBackground embedUrl={embedUrl} title={title} /> : null}
      headerAside={embedUrl ? <VideoHeroTrailerControls theme={theme} /> : null}
    />
  );
}
