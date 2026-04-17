function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function getTargetUrl(request: Request): string | null {
  const target = new URL(request.url).searchParams.get('target');
  if (!target) {
    return null;
  }

  try {
    const parsed = new URL(target);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function renderInterstitialHtml(request: Request): string {
  const url = new URL(request.url);
  const title = escapeHtml(url.searchParams.get('title') || 'Jawatch download');
  const summary = escapeHtml(url.searchParams.get('summary') || 'You are leaving Jawatch for an external download destination.');
  const targetUrl = getTargetUrl(request);
  const safeTarget = targetUrl ? escapeHtml(targetUrl) : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0d140d; color: #f4f7f1; font-family: ui-sans-serif, system-ui, sans-serif; }
    main { width: min(920px, calc(100vw - 32px)); padding: 32px; border: 1px solid #4a5d4a; border-radius: 28px; background: #1a241a; box-shadow: 0 30px 90px rgb(0 0 0 / 0.35); }
    h1 { margin: 0; font-size: clamp(32px, 6vw, 64px); line-height: 0.95; }
    p { color: #b9c5b6; line-height: 1.7; }
    .ads { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 24px 0; }
    .ad { min-height: 140px; display: grid; place-items: center; border: 1px dashed #8da38d; border-radius: 20px; color: #8da38d; }
    button, a { border: 0; border-radius: 999px; padding: 14px 20px; font-weight: 800; }
    button { background: #8da38d; color: #0d140d; cursor: pointer; }
    button:disabled { cursor: not-allowed; opacity: 0.45; }
    a { color: #dce8d8; }
  </style>
</head>
<body>
  <main>
    <p>Download Interstitial</p>
    <h1>${title}</h1>
    <p>${summary}</p>
    <div class="ads" aria-label="Sponsored placements">
      <div class="ad">Sponsored placement</div>
      <div class="ad">Support Jawatch</div>
    </div>
    <p>This external destination opens in a new tab. This page will remain open and the button locks again after use.</p>
    <button id="continue" disabled>${safeTarget ? 'Continue in 15' : 'Missing valid download target'}</button>
    <a href="javascript:history.back()">Back to Jawatch</a>
  </main>
  <script>
    const target = ${JSON.stringify(safeTarget)};
    const button = document.getElementById('continue');
    let remaining = 15;
    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);
        if (target) {
          button.disabled = false;
          button.textContent = 'Continue to Download';
        }
        return;
      }
      if (target) button.textContent = 'Continue in ' + remaining;
    }, 1000);
    button.addEventListener('click', () => {
      if (!target || button.disabled) return;
      window.open(target, '_blank', 'noopener,noreferrer');
      button.disabled = true;
      button.textContent = 'Download opened';
    });
  </script>
</body>
</html>`;
}

const downloadInterstitialWorker = {
  async fetch(request: Request): Promise<Response> {
    return new Response(renderInterstitialHtml(request), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  },
};

export default downloadInterstitialWorker;
