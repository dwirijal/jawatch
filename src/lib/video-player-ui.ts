export function deriveMirrorSourceLabel(url: string): string | null {
  try {
    const parsed = new URL(url, 'https://jawatch.local');
    const hostname = parsed.hostname.replace(/^www\./i, '');
    const path = parsed.pathname.toLowerCase();

    if (path.includes('/api/lk21/')) {
      return 'SERVER';
    }

    if (!hostname || hostname === 'jawatch.local' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    const [firstSegment] = hostname.split('.');
    return firstSegment ? firstSegment.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function presentMirrorLabel(label: string, url: string, index: number, allMirrors: Array<{ label: string; url: string }> = []): string {
  const trimmed = label.trim();
  const qualityMatch = trimmed.match(/\b(\d{3,4}p)\b/i);
  const genericMatch = trimmed.match(/\b(4k|uhd|fhd|hd|sd|hls|mp4)\b/i);
  
  let baseLabel = '';
  if (qualityMatch) {
    baseLabel = qualityMatch[1].toUpperCase();
  } else if (genericMatch) {
    baseLabel = genericMatch[1].toUpperCase();
  }

  const sourceLabel = deriveMirrorSourceLabel(url);

  // If we have a base label (quality), check if it's duplicated across other mirrors
  if (baseLabel && allMirrors.length > 0) {
    const isDuplicated = allMirrors.some((m, i) => {
      if (i === index) return false;
      const otherTrimmed = m.label.trim();
      const otherQualityMatch = otherTrimmed.match(/\b(\d{3,4}p)\b/i);
      const otherGenericMatch = otherTrimmed.match(/\b(4k|uhd|fhd|hd|sd|hls|mp4)\b/i);
      const otherBase = otherQualityMatch ? otherQualityMatch[1].toUpperCase() : (otherGenericMatch ? otherGenericMatch[1].toUpperCase() : '');
      return otherBase === baseLabel;
    });

    if (isDuplicated && sourceLabel) {
      return `${baseLabel} - ${sourceLabel}`;
    }
    return baseLabel;
  }

  if (baseLabel) {
    return baseLabel;
  }

  if (sourceLabel) {
    return sourceLabel;
  }

  return `Mirror ${index + 1}`;
}
