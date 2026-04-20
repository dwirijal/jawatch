export type VideoPlayerMediaMode = 'empty' | 'native' | 'hls' | 'embed';

export function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);
}

export function isHlsUrl(url: string): boolean {
  return /(?:\.m3u8)(?:[?#]|$)|\/api\/lk21\/(?:manifest|stream)(?:[/?]|$)/i.test(url);
}

export function resolveVideoPlayerMediaMode(url: string): VideoPlayerMediaMode {
  if (!url) {
    return 'empty';
  }

  if (isHlsUrl(url)) {
    return 'hls';
  }

  if (isDirectMediaUrl(url)) {
    return 'native';
  }

  return 'embed';
}
