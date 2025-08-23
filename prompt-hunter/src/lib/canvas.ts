import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from './constants';

export function setupPixelCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const vw = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
  const vh = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
  const scale = Math.max(1, Math.floor(Math.min(vw / INTERNAL_WIDTH, vh / INTERNAL_HEIGHT)));
  canvas.style.width = `${INTERNAL_WIDTH * scale}px`;
  canvas.style.height = `${INTERNAL_HEIGHT * scale}px`;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = INTERNAL_WIDTH * scale * dpr;
  canvas.height = INTERNAL_HEIGHT * scale * dpr;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

export type FxState = {
  hitFlashMs: number;
  shakeMs: number;
};

export function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
}

export function applyShake(ctx: CanvasRenderingContext2D, t: number, fx: FxState) {
  if (fx.shakeMs > 0) {
    const mag = 2;
    const dx = (Math.sin(t * 0.02) * mag) | 0;
    const dy = (Math.cos(t * 0.025) * mag) | 0;
    ctx.translate(dx, dy);
  }
}

export function drawHitFlash(ctx: CanvasRenderingContext2D, fx: FxState) {
  if (fx.hitFlashMs > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  }
}


