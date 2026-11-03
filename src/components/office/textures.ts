import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

function canvasTexture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function useFontRevision() {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    let live = true;
    const fonts = document.fonts;
    if (!fonts) return;
    fonts.ready.then(() => {
      if (live) setRev(1);
    });
    return () => {
      live = false;
    };
  }, []);
  return rev;
}

export function useStoryTexture() {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        g.fillStyle = '#d7e0e8';
        g.fillRect(0, 0, w, h);
        const cols = 8;
        const rows = 2;
        const cw = (w - 36) / cols;
        const rh = (h - 32) / rows;
        for (let y = 0; y < rows; y += 1) {
          for (let x = 0; x < cols; x += 1) {
            const px = 18 + x * cw;
            const py = 16 + y * rh;
            g.fillStyle = '#24303a';
            g.fillRect(px + 6, py + 8, cw - 16, rh - 20);
            const lit = (x * 3 + y * 5) % 7 !== 0;
            g.fillStyle = lit ? '#e7f1f8' : '#b7c9d6';
            g.fillRect(px + 10, py + 12, cw - 24, rh - 28);
            g.fillStyle = 'rgba(28, 38, 46, 0.45)';
            g.fillRect(px + cw / 2, py + 12, 3, rh - 28);
            g.fillRect(px + 10, py + rh / 2, cw - 24, 3);
            if ((x + y) % 4 === 0) {
              g.fillStyle = 'rgba(255, 236, 210, 0.45)';
              g.fillRect(px + 14, py + 16, (cw - 24) * 0.42, (rh - 28) * 0.45);
            }
          }
        }
      }, 1024, 512),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export function useSignTexture(rev: number) {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#1b242c';
        g.font = '700 112px "Noto Sans SC", "Space Grotesk", sans-serif';
        g.fillText('不可思议', w / 2, h * 0.4);
        g.font = '500 34px "Space Grotesk", sans-serif';
        g.fillStyle = '#5c6b78';
        g.fillText('INCREDIBLE SPACE', w / 2, h * 0.74);
      }, 1024, 280),
    [rev],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export function usePosterTexture(rev: number) {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        g.fillStyle = '#f4efe4';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#1b242c';
        g.fillRect(0, 0, 18, h);
        g.font = '700 72px "Noto Sans SC", sans-serif';
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillText('七道门', 48, h * 0.38);
        g.font = '500 28px "Space Grotesk", sans-serif';
        g.fillStyle = '#5c6b78';
        g.fillText('时间  因果  重力  知觉', 48, h * 0.62);
        g.fillText('尺度  形体  路径', 48, h * 0.74);
      }, 640, 400),
    [rev],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export function useBoardTexture() {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        g.fillStyle = '#f7f8f6';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#d7ddd8';
        g.lineWidth = 8;
        g.strokeRect(16, 16, w - 32, h - 32);
        g.strokeStyle = '#e15a4a';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(80, h - 70);
        g.lineTo(w * 0.48, 80);
        g.lineTo(w - 70, h * 0.62);
        g.stroke();
        g.fillStyle = '#7eb8c9';
        for (let i = 0; i < 5; i += 1) {
          g.beginPath();
          g.arc(120 + i * 70, h * 0.72 - (i % 3) * 28, 10, 0, Math.PI * 2);
          g.fill();
        }
      }, 512, 320),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export function useSoftShadow() {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        const grd = g.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.48);
        grd.addColorStop(0, 'rgba(48, 60, 72, 0.28)');
        grd.addColorStop(1, 'rgba(48, 60, 72, 0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, w, h);
      }, 256, 256),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export function useMarkTexture(label: string) {
  const tex = useMemo(
    () =>
      canvasTexture((g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.font = '700 220px "Space Grotesk", sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = 'rgba(255, 70, 84, 0.28)';
        g.fillText(label, w / 2, h / 2);
      }, 512, 256),
    [label],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}
