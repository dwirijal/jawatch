export function InitColorSchemeScript() {
  return (
    <script
      id="dwizzy-init-color-scheme"
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            try {
              var saved = localStorage.getItem('dwizzy_color_scheme');
              document.documentElement.dataset.colorScheme = saved || 'dark';
            } catch (e) {
              document.documentElement.dataset.colorScheme = 'dark';
            }
          })();
        `,
      }}
    />
  );
}
