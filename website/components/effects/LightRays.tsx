import type { CSSProperties } from 'react';
import { cn } from '../../lib/utils';

interface LightRaysProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS color of the light. Reads best as a soft, cool, semi-transparent tone. */
  color?: string;
  /** Blur radius of each ray, in px. */
  blur?: number;
}

// "God rays" beaming from the top: blurred vertical gradients, fanned out, gently
// swinging. mix-blend-screen makes the light add up over a dark backdrop, so this
// effect only reads on dark surfaces. Pure CSS — animation lives in globals.css.
const RAYS = [
  { left: 30, rot: -22, width: 200, swing: 1.4, delay: 0, dur: 13, intensity: 0.55 },
  { left: 44, rot: -9, width: 160, swing: 1.0, delay: 2.5, dur: 15, intensity: 0.5 },
  { left: 52, rot: 4, width: 250, swing: 1.6, delay: 1.2, dur: 12, intensity: 0.62 },
  { left: 61, rot: 16, width: 180, swing: 1.2, delay: 3.5, dur: 16, intensity: 0.45 },
  { left: 70, rot: 26, width: 150, swing: 1.8, delay: 0.8, dur: 14, intensity: 0.5 },
  { left: 38, rot: -14, width: 130, swing: 0.9, delay: 4.2, dur: 17, intensity: 0.42 },
  { left: 56, rot: 10, width: 290, swing: 1.3, delay: 5, dur: 13, intensity: 0.55 },
];

export function LightRays({
  className,
  style,
  color = 'rgba(192, 206, 255, 0.55)',
  blur = 42,
  ...props
}: LightRaysProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 isolate overflow-hidden', className)}
      style={{ '--lr-color': color, '--lr-blur': `${blur}px`, ...style } as CSSProperties}
      {...props}
    >
      {RAYS.map((r, i) => (
        <div
          key={i}
          className="light-ray absolute -top-[14%] h-[82%] origin-top -translate-x-1/2 rounded-full mix-blend-screen"
          style={
            {
              left: `${r.left}%`,
              width: `${r.width}px`,
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--lr-color) 78%, transparent), transparent)',
              filter: 'blur(var(--lr-blur))',
              '--ray-rot': `${r.rot}deg`,
              '--ray-swing': `${r.swing}deg`,
              '--ray-intensity': r.intensity,
              animation: `light-ray ${r.dur}s ease-in-out ${r.delay}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
