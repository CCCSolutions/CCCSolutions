import { cn } from '../../lib/utils';

interface NoiseTextureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–1, overall visibility. Default 0.04. */
  opacity?: number;
  /** Higher = finer grain, lower = larger blobby texture. Default 0.85. */
  baseFrequency?: number;
  /** More octaves = more detail layered in. Default 3. */
  numOctaves?: number;
  /** Optional CSS color to tint the noise (e.g. "hsl(239 84% 67%)"). */
  color?: string;
}

// Adapted from magicui.design/docs/components/noise-texture.
// SVG feTurbulence filter rendered as a tiled bg image.
// When `color` is provided, the SVG is used as a CSS mask and filled with
// that color so the noise pattern itself is tinted.
export function NoiseTexture({
  opacity = 0.04,
  baseFrequency = 0.85,
  numOctaves = 3,
  color,
  className,
  style,
  ...props
}: NoiseTextureProps) {
  const svg = `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;
  const url = `url("data:image/svg+xml,${svg}")`;

  // Tile at a fixed pixel size (not stretched to the element) so the grain stays
  // the same resolution regardless of the element's size.
  const tile = '200px 200px';
  const tintedStyle: React.CSSProperties = color
    ? {
        backgroundColor: color,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: tile,
        WebkitMaskSize: tile,
        maskRepeat: 'repeat',
        WebkitMaskRepeat: 'repeat',
      }
    : { backgroundImage: url, backgroundSize: tile, backgroundRepeat: 'repeat' };

  return (
    <div
      aria-hidden
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        ...tintedStyle,
        opacity,
        ...style,
      }}
      {...props}
    />
  );
}
