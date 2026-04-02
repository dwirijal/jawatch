export type BookCoverPalette = {
  background: string;
  glow: string;
  frameBorder: string;
  frameFill: string;
  spine: string;
  rule: string;
  text: string;
  eyebrow: string;
  subtitle: string;
  overlay: string;
};

const BOOK_COVER_PALETTES: BookCoverPalette[] = [
  {
    background: 'linear-gradient(160deg,#6f5438 0%,#4f3624 28%,#241814 100%)',
    glow: 'radial-gradient(circle_at_top,rgba(255,244,221,0.18),transparent 48%)',
    frameBorder: 'rgba(248,237,217,0.18)',
    frameFill: 'linear-gradient(180deg,rgba(247,234,210,0.08),rgba(255,255,255,0.02))',
    spine: 'rgba(244,234,210,0.16)',
    rule: 'rgba(244,234,210,0.18)',
    text: '#fff4df',
    eyebrow: 'rgba(244,216,168,0.72)',
    subtitle: 'rgba(248,237,217,0.76)',
    overlay: 'linear-gradient(to_top,rgba(8,5,4,0.54) 0%,rgba(8,5,4,0.14) 34%,rgba(8,5,4,0.02) 100%)',
  },
  {
    background: 'linear-gradient(165deg,#294454 0%,#1d2f3c 34%,#111a24 100%)',
    glow: 'radial-gradient(circle_at_top,rgba(212,238,247,0.2),transparent 50%)',
    frameBorder: 'rgba(215,238,245,0.16)',
    frameFill: 'linear-gradient(180deg,rgba(214,237,245,0.08),rgba(255,255,255,0.02))',
    spine: 'rgba(214,237,245,0.14)',
    rule: 'rgba(214,237,245,0.16)',
    text: '#eef8fb',
    eyebrow: 'rgba(173,220,232,0.74)',
    subtitle: 'rgba(220,240,245,0.74)',
    overlay: 'linear-gradient(to_top,rgba(8,15,20,0.48) 0%,rgba(8,15,20,0.12) 36%,rgba(8,15,20,0.02) 100%)',
  },
  {
    background: 'linear-gradient(160deg,#5a3144 0%,#3b2030 30%,#1c1017 100%)',
    glow: 'radial-gradient(circle_at_top,rgba(248,224,232,0.18),transparent 48%)',
    frameBorder: 'rgba(247,224,232,0.16)',
    frameFill: 'linear-gradient(180deg,rgba(247,224,232,0.08),rgba(255,255,255,0.02))',
    spine: 'rgba(247,224,232,0.14)',
    rule: 'rgba(247,224,232,0.16)',
    text: '#fff0f6',
    eyebrow: 'rgba(244,188,208,0.76)',
    subtitle: 'rgba(249,225,234,0.74)',
    overlay: 'linear-gradient(to_top,rgba(18,8,12,0.5) 0%,rgba(18,8,12,0.12) 36%,rgba(18,8,12,0.02) 100%)',
  },
  {
    background: 'linear-gradient(160deg,#344b2e 0%,#243520 32%,#121b10 100%)',
    glow: 'radial-gradient(circle_at_top,rgba(230,241,219,0.18),transparent 50%)',
    frameBorder: 'rgba(228,241,219,0.16)',
    frameFill: 'linear-gradient(180deg,rgba(228,241,219,0.08),rgba(255,255,255,0.02))',
    spine: 'rgba(228,241,219,0.14)',
    rule: 'rgba(228,241,219,0.16)',
    text: '#f1f8ea',
    eyebrow: 'rgba(202,229,176,0.74)',
    subtitle: 'rgba(228,241,219,0.74)',
    overlay: 'linear-gradient(to_top,rgba(10,16,8,0.52) 0%,rgba(10,16,8,0.12) 34%,rgba(10,16,8,0.02) 100%)',
  },
  {
    background: 'linear-gradient(160deg,#4f3c63 0%,#352745 32%,#17111f 100%)',
    glow: 'radial-gradient(circle_at_top,rgba(233,226,247,0.18),transparent 48%)',
    frameBorder: 'rgba(232,225,247,0.16)',
    frameFill: 'linear-gradient(180deg,rgba(232,225,247,0.08),rgba(255,255,255,0.02))',
    spine: 'rgba(232,225,247,0.14)',
    rule: 'rgba(232,225,247,0.16)',
    text: '#f5f1ff',
    eyebrow: 'rgba(212,197,244,0.74)',
    subtitle: 'rgba(233,226,247,0.74)',
    overlay: 'linear-gradient(to_top,rgba(12,8,18,0.52) 0%,rgba(12,8,18,0.12) 34%,rgba(12,8,18,0.02) 100%)',
  },
];

export function splitBookTitle(title: string): { title: string; subtitle?: string } {
  const normalized = title.trim();
  const separatorIndex = normalized.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return { title: normalized };
  }

  const primary = normalized.slice(0, separatorIndex).trim();
  const secondary = normalized.slice(separatorIndex + 1).trim();

  if (!primary || !secondary || secondary.length > 64) {
    return { title: normalized };
  }

  return {
    title: primary,
    subtitle: secondary,
  };
}

export function getBookCoverPalette(title: string): BookCoverPalette {
  const seed = title
    .trim()
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return BOOK_COVER_PALETTES[seed % BOOK_COVER_PALETTES.length] ?? BOOK_COVER_PALETTES[0];
}
