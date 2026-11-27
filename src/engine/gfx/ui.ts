import type { TimeOfDay } from '@engine/types';

export const SCREEN_W = 320;
export const SCREEN_H = 240;

/**
 * Draws an iconic Breath of Fire SNES bevelled royal-blue window box
 * with crisp pixel borders and inner gold accent.
 */
export function drawBofBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { accent?: string; bgTop?: string; bgBottom?: string },
): void {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, options?.bgTop ?? '#23408a');
  grad.addColorStop(1, options?.bgBottom ?? '#101d48');

  ctx.fillStyle = '#070b1a';
  ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);

  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, rw, rh);

  // Outer crisp white bevel
  ctx.strokeStyle = '#e8f0ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

  // Inner subtle blue/gold highlight
  ctx.strokeStyle = options?.accent ?? '#6c95e8';
  ctx.strokeRect(rx + 2.5, ry + 2.5, rw - 5, rh - 5);

  // Corner gold studs (classic SNES RPG detail)
  ctx.fillStyle = '#f5cb5c';
  ctx.fillRect(rx + 1, ry + 1, 2, 2);
  ctx.fillRect(rx + rw - 3, ry + 1, 2, 2);
  ctx.fillRect(rx + 1, ry + rh - 3, 2, 2);
  ctx.fillRect(rx + rw - 3, ry + rh - 3, 2, 2);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    color?: string;
    size?: number;
    align?: CanvasTextAlign;
    bold?: boolean;
    shadow?: boolean;
  },
): void {
  const size = options?.size ?? 8;
  const bold = options?.bold ? 'bold ' : '';
  ctx.font = `${bold}${size}px monospace`;
  ctx.textAlign = options?.align ?? 'left';
  ctx.textBaseline = 'top';
  const rx = Math.round(x);
  const ry = Math.round(y);

  if (options?.shadow !== false) {
    ctx.fillStyle = '#080c18';
    ctx.fillText(text, rx + 1, ry + 1);
  }
  ctx.fillStyle = options?.color ?? '#f5f8ff';
  ctx.fillText(text, rx, ry);
}

export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= maxChars) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fillColor: string,
  bgColor = '#14192b',
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = '#05070e';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  const fillW = Math.round(w * clamped);
  if (fillW > 0) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, fillW, h);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x, y, fillW, Math.max(1, Math.floor(h / 2)));
  }
}

export function drawDayNightOverlay(
  ctx: CanvasRenderingContext2D,
  timeOfDay: TimeOfDay,
  indoor: boolean,
  lights: Array<{ x: number; y: number; radius: number; color: string }>,
): void {
  if (indoor) {
    // Subtle warm torchlight glow indoors if lights exist
    for (const l of lights) {
      const grad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.radius);
      grad.addColorStop(0, 'rgba(255, 210, 120, 0.22)');
      grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
    }
    return;
  }

  let tint: string | null = null;
  if (timeOfDay === 'dawn') tint = 'rgba(255, 165, 100, 0.16)';
  if (timeOfDay === 'dusk') tint = 'rgba(180, 85, 120, 0.24)';
  if (timeOfDay === 'night') tint = 'rgba(14, 22, 62, 0.44)';

  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  if (timeOfDay === 'dusk' || timeOfDay === 'night') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const grad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.radius);
      grad.addColorStop(0, l.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(l.x - l.radius, l.y - l.radius, l.radius * 2, l.radius * 2);
    }
    ctx.restore();
  }
}

export function drawCursorArrow(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void {
  const bob = Math.sin(tick * 0.18) > 0 ? 1 : 0;
  const rx = Math.round(x + bob);
  const ry = Math.round(y);
  ctx.fillStyle = '#080c18';
  ctx.fillRect(rx, ry, 6, 7);
  ctx.fillStyle = '#ffd65c';
  ctx.fillRect(rx, ry + 1, 2, 5);
  ctx.fillRect(rx + 2, ry + 2, 2, 3);
  ctx.fillRect(rx + 4, ry + 3, 2, 1);
}
