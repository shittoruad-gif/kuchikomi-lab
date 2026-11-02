import { describe, it, expect } from "vitest";
import zlib from "node:zlib";
import { renderPopPdf, isPng } from "./pop";

/** 依存なしで最小の PNG（1×1 白）を作る */
function tinyPng(): Buffer {
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  const crc32 = (buf: Buffer) => {
    let c = -1;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const raw = Buffer.from([0, 255, 255, 255]); // filter byte + 1 pixel
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("renderPopPdf", () => {
  it("A5 の PNG から A5 サイズの1ページ PDF を作る", async () => {
    const pdf = await renderPopPdf(tinyPng(), "a5");
    const head = pdf.subarray(0, 5).toString("latin1");
    expect(head).toBe("%PDF-");
    const text = pdf.toString("latin1");
    // 148mm x 210mm = 419.53pt x 595.28pt
    expect(text).toMatch(/MediaBox \[0 0 419\.5\d* 595\.2\d*\]/);
    expect(text).toContain("/Subtype /Image");
    expect(text.match(/\/Type \/Page[^s]/g)?.length).toBe(1);
  });

  it("名刺サイズは 91mm x 55mm", async () => {
    const pdf = await renderPopPdf(tinyPng(), "card");
    expect(pdf.toString("latin1")).toMatch(/MediaBox \[0 0 257\.9\d* 155\.9\d*\]/);
  });

  it("PNG でないデータは拒否する", async () => {
    expect(isPng(Buffer.from("hello world, not a png"))).toBe(false);
    await expect(renderPopPdf(Buffer.from("<svg></svg>"), "a5")).rejects.toThrow(/PNG/);
  });
});
