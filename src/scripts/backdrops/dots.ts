/**
 * Home hero background (design.md → Motion → Hero background, chosen 2026-11-02): «matriz de puntos».
 * Every crossing of the blueprint grid is a dot. Around the pointer the dots move apart like a lens
 * and light up in the primary colour; a click or tap sends a wave (accent). With no pointer, a soft
 * diagonal band of light keeps crossing the grid, so phones see it alive too.
 * Colors: --bd-1 resting dot · --bd-2 lens (primary) · --bd-3 wave (accent). Light and dark come from the tokens.
 */
import type { Scene } from '../backdrop';

export const dots = (): Scene => {
  const G = 24;           // dot spacing
  const LENS = 95;        // lens radius (σ, px)
  const WAVE_MS = 1600;
  let taps: { x: number; y: number; t: number }[] = [];
  let lastTap = 0;

  return {
    setup() {},
    draw({ ctx, w, h, t, still, pointer: p, colors: [rest, lens, wave] }) {
      ctx.clearRect(0, 0, w, h);
      if (p.tap && p.tap !== lastTap) { lastTap = p.tap; taps.push({ x: p.x, y: p.y, t: p.tap }); }
      const now = performance.now();
      taps = taps.filter((q) => now - q.t < WAVE_MS);

      for (let x = G / 2; x < w; x += G) {
        for (let y = G / 2; y < h; y += G) {
          let dx = 0, dy = 0, hot = 0, hit = 0;
          if (p.strength > 0.01) {
            const ox = x - p.x, oy = y - p.y, d = Math.hypot(ox, oy) || 1;
            const f = Math.exp(-(d * d) / (2 * LENS * LENS)) * p.strength;
            dx += (ox / d) * 16 * f; dy += (oy / d) * 16 * f; hot = f;
          }
          for (const q of taps) {
            const age = now - q.t, d = Math.hypot(x - q.x, y - q.y) || 1, front = age * 0.55;
            const f = Math.exp(-((d - front) ** 2) / (2 * 22 * 22)) * (1 - age / WAVE_MS);
            dx += ((x - q.x) / d) * 9 * f; dy += ((y - q.y) / d) * 9 * f; hit = Math.max(hit, f);
          }
          const band = still ? 0 : Math.max(0, Math.sin((x + y) / 140 - t / 1400)) ** 6 * 0.25;
          const s = 1.6 + hot * 2.4 + hit * 2;
          ctx.globalAlpha = Math.min(1, 0.2 + band + hot * 0.8 + hit * 0.8);
          ctx.fillStyle = hit > hot ? wave : hot > 0.08 ? lens : rest;
          ctx.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },
  };
};
