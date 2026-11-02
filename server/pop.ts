import PDFDocument from "pdfkit";
import { POP_FORMATS, mmToPt, type PopFormatId } from "@shared/pop";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** 300dpi の A5 でも 2MB 程度。余裕を見て上限 8MB */
export const POP_PNG_MAX_BYTES = 8 * 1024 * 1024;

export function isPng(buf: Buffer): boolean {
  return buf.length > 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

/**
 * ブラウザで描いた PNG を、用紙サイズぴったりの1ページ PDF にする。
 * 文字は画像に含まれているので、サーバーに日本語フォントは不要。
 */
export async function renderPopPdf(png: Buffer, format: PopFormatId): Promise<Buffer> {
  if (!isPng(png)) throw new Error("PNG形式の画像ではありません");
  if (png.length > POP_PNG_MAX_BYTES) throw new Error("画像が大きすぎます");
  const fmt = POP_FORMATS[format];
  if (!fmt) throw new Error("サイズが不正です");

  const width = mmToPt(fmt.widthMm);
  const height = mmToPt(fmt.heightMm);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0,
      info: { Title: `${fmt.label} - クチコミラボ` },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.image(png, 0, 0, { width, height });
    doc.end();
  });
}
