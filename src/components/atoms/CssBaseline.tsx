export function CssBaseline() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root { color-scheme: dark; }
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-height: 100%; background-color: var(--bg-deep); color: var(--text-editorial); font-family: "Inter", sans-serif; }
          button, input, textarea, select { font: inherit; }
          a { color: inherit; text-decoration: none; }
        `,
      }}
    />
  );
}
