export function CssBaseline() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root { color-scheme: light dark; }
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-height: 100%; background: var(--background); color: var(--foreground); }
          button, input, textarea, select { font: inherit; }
          a { color: inherit; text-decoration: none; }
        `,
      }}
    />
  );
}
