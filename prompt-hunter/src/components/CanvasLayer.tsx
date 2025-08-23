import React from 'react';
import { applyShake, drawBackground, drawHitFlash, setupPixelCanvas } from '../lib/canvas';
import type { FxState } from '../lib/canvas';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../lib/constants';

type Props = {
  spriteSrc: string;
  hitTrigger: number; // increment to show flash
  reducedMotion?: boolean;
};

export default function CanvasLayer({ spriteSrc, hitTrigger, reducedMotion }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastRef = React.useRef(0);
  const fxRef = React.useRef<FxState>({ hitFlashMs: 0, shakeMs: 0 });
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    fxRef.current.hitFlashMs = 120;
    fxRef.current.shakeMs = 150;
  }, [hitTrigger]);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = (ctxRef.current = canvas.getContext('2d')!);
    setupPixelCanvas(canvas, ctx);
    const img = new Image();
    imgRef.current = img;
    img.src = spriteSrc;
    img.onload = () => {};

    const onResize = () => setupPixelCanvas(canvas, ctx);
    window.addEventListener('resize', onResize);

    const loop = (t: number) => {
      const ctx2 = ctxRef.current!;
      if (document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(loop);
        lastRef.current = t;
        return;
      }
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;

      const fx = fxRef.current;
      if (fx.hitFlashMs > 0) fx.hitFlashMs -= dt;
      if (fx.shakeMs > 0) fx.shakeMs -= dt;

      ctx2.setTransform(1, 0, 0, 1, 0, 0); // reset then setup
      setupPixelCanvas(canvas, ctx2);
      drawBackground(ctx2);
      ctx2.save();
      if (!reducedMotion) applyShake(ctx2, t, fx);
      // draw sprite centered
      const imgEl = imgRef.current;
      if (imgEl && imgEl.complete) {
        const w = 48;
        const h = 48;
        const x = (INTERNAL_WIDTH - w) / 2;
        const y = (INTERNAL_HEIGHT - h) / 2 - 10;
        ctx2.imageSmoothingEnabled = false;
        ctx2.drawImage(imgEl, x, y, w, h);
      }
      ctx2.restore();
      if (!reducedMotion) drawHitFlash(ctx2, fx);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spriteSrc, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={INTERNAL_WIDTH}
      height={INTERNAL_HEIGHT}
      className="w-full h-auto block border border-white/10" style={{ imageRendering: 'pixelated' }}
    />
  );
}


