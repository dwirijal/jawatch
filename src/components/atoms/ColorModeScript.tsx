import { getColorModeBootstrapScript } from '@/lib/color-mode';

export function ColorModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: getColorModeBootstrapScript(),
      }}
    />
  );
}
