import { VideoDetailHeroFrame, VideoDetailHeroFrameProps } from '@/components/organisms/VideoDetailHeroFrame';

export type VideoDetailHeroProps = Omit<VideoDetailHeroFrameProps, 'backgroundLayer' | 'headerAside'>;

export function VideoDetailHero(props: VideoDetailHeroProps) {
  return <VideoDetailHeroFrame {...props} />;
}
