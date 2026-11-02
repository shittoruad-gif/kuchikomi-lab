// 店頭POP・QRカード生成の共有ロジック（ブラウザ・サーバー共通、純関数のみ）
//
// 方針（2026年のステマ規制・口コミ特典問題を踏まえる）:
//  - 星の数を頼まない
//  - 特典と口コミ内容を連動させない（特典・割引・プレゼント等の語を載せない）
//  - 正直な感想を依頼する
//  - 「口コミは任意です。内容によって特典が変わることはありません」を必ず小さく載せる
import QRCode from "qrcode";

// ============ 定型文（この中からしか選べない） ============
export const POP_MESSAGES = [
  {
    id: "thanks",
    label: "率直なご感想を",
    text: "ご来店ありがとうございました。率直なご感想をお聞かせください。",
  },
  {
    id: "today",
    label: "よろしければご感想を",
    text: "本日はありがとうございました。よろしければ、ご感想をお寄せください。",
  },
  {
    id: "improve",
    label: "お気づきの点を",
    text: "お気づきの点があれば、ぜひ教えてください。今後の参考にさせていただきます。",
  },
] as const;
export type PopMessageId = (typeof POP_MESSAGES)[number]["id"];

export const POP_NOTE = "口コミは任意です。内容によって特典が変わることはありません。";
export const POP_QR_CAPTION = "スマートフォンのカメラで読み取ると、口コミ投稿ページが開きます。";
/** 名刺サイズ用の短い説明文（幅が狭いため） */
export const POP_QR_CAPTION_SHORT = "スマホのカメラで読み取ってください";

// ============ 型（テーマ）とサイズ ============
export const POP_THEMES = {
  plain: { label: "シンプル（白）", bg: "#ffffff", band: "#1f2937", bandText: "#ffffff", fg: "#1f2937", sub: "#6b7280", accent: "#2563eb" },
  warm: { label: "ウォーム（生成り）", bg: "#fdf6ec", band: "#b45309", bandText: "#ffffff", fg: "#3f2a14", sub: "#8a6d4a", accent: "#b45309" },
  dark: { label: "ダーク（紺）", bg: "#111827", band: "#0b1220", bandText: "#ffffff", fg: "#f9fafb", sub: "#9ca3af", accent: "#60a5fa" },
} as const;
export type PopThemeId = keyof typeof POP_THEMES;

export const POP_FORMATS = {
  a5: { label: "卓上POP（A5縦）", widthMm: 148, heightMm: 210 },
  card: { label: "QRカード（名刺サイズ）", widthMm: 91, heightMm: 55 },
} as const;
export type PopFormatId = keyof typeof POP_FORMATS;

export const POP_LIMITS = {
  storeNameMax: 30,
  taglineMax: 40,
  reviewUrlMax: 500,
} as const;

// ============ 自由文（ひとこと）のNG検査 ============
// 星の指定・特典との連動・投稿の見返りを示す表現は載せない
export const POP_NG_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "星の数の指定", pattern: /(星|☆|★)\s*[1-5１-５五]|[★☆]{3,}|[1-5１-５五]\s*つ星|満点|最高評価|高評価/ },
  { label: "特典・見返り", pattern: /特典|プレゼント|割引|値引|クーポン|無料|サービス(し|いた|させ)|謝礼|お礼に|ポイント(進呈|付与|還元)|キャンペーン|抽選|引き換え|差し上げ|もらえ|プチギフト|景品/ },
  { label: "投稿を条件にする表現", pattern: /(書い|投稿し|評価し|レビューし)(ていただ|て頂|てくれ|たら|た方|た人|てくださ)|(すれば|すると|したら)/ },
  { label: "良い評価の依頼", pattern: /良い(口コミ|評価|レビュー)|好意的|ポジティブ|べた褒め|絶賛/ },
];

export type TextCheck = { ok: true } | { ok: false; reason: string };

export function checkFreeText(text: string): TextCheck {
  const t = text.trim();
  if (t.length === 0) return { ok: true };
  if ([...t].length > POP_LIMITS.taglineMax) {
    return { ok: false, reason: `ひとことは${POP_LIMITS.taglineMax}文字以内にしてください` };
  }
  if (/[\r\n]/.test(t)) return { ok: false, reason: "改行は使えません" };
  for (const ng of POP_NG_PATTERNS) {
    if (ng.pattern.test(t)) {
      return { ok: false, reason: `${ng.label}にあたる表現は載せられません（ステマ規制への配慮）` };
    }
  }
  return { ok: true };
}

export function checkStoreName(name: string): TextCheck {
  const t = name.trim();
  if (t.length === 0) return { ok: false, reason: "店名を入力してください" };
  if ([...t].length > POP_LIMITS.storeNameMax) {
    return { ok: false, reason: `店名は${POP_LIMITS.storeNameMax}文字以内にしてください` };
  }
  if (/[\r\n]/.test(t)) return { ok: false, reason: "改行は使えません" };
  return { ok: true };
}

// ============ 口コミ導線URLの検査 ============
export function checkReviewUrl(url: string): TextCheck {
  const t = url.trim();
  if (t.length === 0) return { ok: false, reason: "口コミ投稿URLを入力してください" };
  if (t.length > POP_LIMITS.reviewUrlMax) {
    return { ok: false, reason: `URLは${POP_LIMITS.reviewUrlMax}文字以内にしてください` };
  }
  let parsed: URL;
  try {
    parsed = new URL(t);
  } catch {
    return { ok: false, reason: "URLの形式が正しくありません（https:// から始めてください）" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "https:// のURLのみ使えます" };
  }
  if (!parsed.hostname.includes(".")) {
    return { ok: false, reason: "URLのドメインが正しくありません" };
  }
  return { ok: true };
}

// ============ QRコード ============
export interface QrMatrix {
  size: number;
  /** modules[y][x] が true なら黒 */
  modules: boolean[][];
}

export function buildQrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const modules: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(data[y * size + x] === 1);
    modules.push(row);
  }
  return { size, modules };
}

/** QR行列を <path d="..."> の d 属性にする。1モジュール = 1ユニット。 */
export function qrMatrixToPathD(matrix: QrMatrix): string {
  const parts: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    let x = 0;
    while (x < matrix.size) {
      if (!matrix.modules[y][x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < matrix.size && matrix.modules[y][x + run]) run++;
      parts.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return parts.join("");
}

// ============ SVG 組み立て ============
export interface PopInput {
  format: PopFormatId;
  theme: PopThemeId;
  storeName: string;
  messageId: PopMessageId;
  tagline?: string;
  reviewUrl: string;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FONT_FAMILY =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',sans-serif";

/** 文字数から、幅に収まるフォントサイズ(mm)を決める（和文は約1em幅とみなす） */
export function fitFontSize(text: string, maxWidthMm: number, baseMm: number, minMm: number): number {
  const chars = Math.max(1, [...text].length);
  const fitted = (maxWidthMm / chars) * 0.98;
  return Math.max(minMm, Math.min(baseMm, fitted));
}

/** 「。」で2行に分ける（定型文は2文構成） */
export function splitMessage(text: string): string[] {
  const idx = text.indexOf("。");
  if (idx < 0 || idx === text.length - 1) return [text];
  return [text.slice(0, idx + 1), text.slice(idx + 1)];
}

function textEl(
  x: number,
  y: number,
  size: number,
  fill: string,
  content: string,
  opts: { weight?: number; anchor?: "middle" | "start" } = {},
): string {
  const anchor = opts.anchor ?? "middle";
  const weight = opts.weight ?? 400;
  return `<text x="${x}" y="${y}" font-size="${size.toFixed(2)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${FONT_FAMILY}">${escapeXml(content)}</text>`;
}

function qrEl(matrix: QrMatrix, x: number, y: number, sizeMm: number, fg: string, bg: string): string {
  // 周囲に 2モジュール分の余白(クワイエットゾーン)を白で確保
  const quiet = 2;
  const total = matrix.size + quiet * 2;
  const scale = sizeMm / total;
  return (
    `<g transform="translate(${x} ${y}) scale(${scale.toFixed(5)})">` +
    `<rect width="${total}" height="${total}" fill="${bg}"/>` +
    `<path transform="translate(${quiet} ${quiet})" d="${qrMatrixToPathD(matrix)}" fill="${fg}" shape-rendering="crispEdges"/>` +
    `</g>`
  );
}

export function getMessageText(id: PopMessageId): string {
  const m = POP_MESSAGES.find((x) => x.id === id);
  return m ? m.text : POP_MESSAGES[0].text;
}

/** 入力を検査して問題があればエラー文を返す。null なら生成できる。 */
export function validatePopInput(input: PopInput): string | null {
  const n = checkStoreName(input.storeName);
  if (!n.ok) return n.reason;
  const u = checkReviewUrl(input.reviewUrl);
  if (!u.ok) return u.reason;
  const t = checkFreeText(input.tagline ?? "");
  if (!t.ok) return t.reason;
  if (!POP_MESSAGES.some((m) => m.id === input.messageId)) return "定型文を選んでください";
  if (!(input.theme in POP_THEMES)) return "型を選んでください";
  if (!(input.format in POP_FORMATS)) return "サイズを選んでください";
  return null;
}

/**
 * POP/カードの SVG 文字列を作る。viewBox の単位は mm。
 * 検査に通らない入力は例外を投げる（画面側で validatePopInput を先に呼ぶこと）。
 */
export function buildPopSvg(input: PopInput): string {
  const err = validatePopInput(input);
  if (err) throw new Error(err);

  const fmt = POP_FORMATS[input.format];
  const th = POP_THEMES[input.theme];
  const storeName = input.storeName.trim();
  const tagline = (input.tagline ?? "").trim();
  const message = getMessageText(input.messageId);
  const matrix = buildQrMatrix(input.reviewUrl.trim());
  const W = fmt.widthMm;
  const H = fmt.heightMm;
  // QR は常に白地・黒で描く（読み取り安定のため、ダークでも反転しない）
  const qrFg = "#111111";
  const qrBg = "#ffffff";

  const body: string[] = [];
  body.push(`<rect width="${W}" height="${H}" fill="${th.bg}"/>`);

  if (input.format === "a5") {
    // 上部の帯 + 店名
    const bandH = 30;
    body.push(`<rect width="${W}" height="${bandH}" fill="${th.band}"/>`);
    body.push(textEl(W / 2, 19.5, fitFontSize(storeName, W - 20, 11, 5), th.bandText, storeName, { weight: 700 }));

    // 定型文（2行）
    const lines = splitMessage(message);
    const msgSize = Math.min(...lines.map((l) => fitFontSize(l, W - 16, 7.2, 4)));
    let y = 48;
    for (const line of lines) {
      body.push(textEl(W / 2, y, msgSize, th.fg, line, { weight: 600 }));
      y += msgSize * 1.5;
    }

    // QR
    const qrSize = 78;
    const qrX = (W - qrSize) / 2;
    const qrY = 68;
    body.push(`<rect x="${qrX - 2}" y="${qrY - 2}" width="${qrSize + 4}" height="${qrSize + 4}" rx="2" fill="${qrBg}" stroke="${th.accent}" stroke-width="0.6"/>`);
    body.push(qrEl(matrix, qrX, qrY, qrSize, qrFg, qrBg));

    // QR の説明
    body.push(textEl(W / 2, qrY + qrSize + 9, fitFontSize(POP_QR_CAPTION, W - 16, 3.8, 3), th.sub, POP_QR_CAPTION));

    // ひとこと
    if (tagline) {
      body.push(textEl(W / 2, 172, fitFontSize(tagline, W - 20, 5.2, 3.2), th.fg, tagline));
    }

    // 注記（必ず載せる）
    body.push(`<line x1="14" y1="${H - 17}" x2="${W - 14}" y2="${H - 17}" stroke="${th.sub}" stroke-width="0.25"/>`);
    body.push(textEl(W / 2, H - 10, fitFontSize(POP_NOTE, W - 16, 3.1, 2.4), th.sub, POP_NOTE));
  } else {
    // 名刺サイズ（横）: 左にQR、右に文字
    const qrSize = 40;
    const qrX = 6;
    const qrY = (H - qrSize) / 2 - 2;
    body.push(`<rect x="${qrX - 1.5}" y="${qrY - 1.5}" width="${qrSize + 3}" height="${qrSize + 3}" rx="1.5" fill="${qrBg}" stroke="${th.accent}" stroke-width="0.4"/>`);
    body.push(qrEl(matrix, qrX, qrY, qrSize, qrFg, qrBg));

    const textX = qrX + qrSize + 5;
    const textW = W - textX - 5;
    const cx = textX + textW / 2;

    body.push(textEl(cx, 14, fitFontSize(storeName, textW, 5.2, 2.8), th.fg, storeName, { weight: 700 }));
    body.push(`<line x1="${textX}" y1="17.5" x2="${W - 5}" y2="17.5" stroke="${th.accent}" stroke-width="0.4"/>`);

    const lines = splitMessage(message);
    const msgSize = Math.min(...lines.map((l) => fitFontSize(l, textW, 3.2, 2.2)));
    let y = 24;
    for (const line of lines) {
      body.push(textEl(cx, y, msgSize, th.fg, line, { weight: 600 }));
      y += msgSize * 1.55;
    }

    if (tagline) {
      body.push(textEl(cx, 38.5, fitFontSize(tagline, textW, 2.8, 2), th.sub, tagline));
    }

    body.push(textEl(cx, 45, fitFontSize(POP_QR_CAPTION_SHORT, textW, 2.2, 1.6), th.sub, POP_QR_CAPTION_SHORT));
    body.push(textEl(W / 2, H - 2.8, fitFontSize(POP_NOTE, W - 8, 2.1, 1.6), th.sub, POP_NOTE));
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">` +
    body.join("") +
    `</svg>`
  );
}

/** 300dpi 相当の出力ピクセル数 */
export function mmToPx(mm: number, dpi = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

/** PDF の用紙サイズ（pt）。1mm = 72/25.4 pt */
export function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}
