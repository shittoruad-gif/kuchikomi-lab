// ブラウザ側の書き出し補助（SVG → PNG、ダウンロード）
import { mmToPx, POP_FORMATS, type PopFormatId } from "@shared/pop";

/** プレビュー表示用: 固定の mm 幅を外して親要素いっぱいに広げる */
export function svgForDisplay(svg: string): string {
  return svg.replace(/<svg ([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, '<svg $1 width="100%"');
}

/** SVG 文字列を 300dpi 相当の PNG Blob にする */
export async function svgToPngBlob(svg: string, format: PopFormatId): Promise<Blob> {
  const fmt = POP_FORMATS[format];
  const w = mmToPx(fmt.widthMm);
  const h = mmToPx(fmt.heightMm);
  const sized = svg.replace(/<svg ([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, `<svg $1 width="${w}" height="${h}"`);
  const blob = new Blob([sized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("画像の描画に失敗しました"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("この端末では画像を作れません");
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNGへの変換に失敗しました"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
