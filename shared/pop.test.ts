import { describe, it, expect } from "vitest";
import {
  POP_MESSAGES,
  POP_NOTE,
  POP_NG_PATTERNS,
  POP_QR_CAPTION,
  POP_QR_CAPTION_SHORT,
  checkFreeText,
  checkStoreName,
  checkReviewUrl,
  buildQrMatrix,
  qrMatrixToPathD,
  buildPopSvg,
  validatePopInput,
  splitMessage,
  fitFontSize,
  mmToPx,
  mmToPt,
  type PopInput,
} from "./pop";

const GOOGLE_URL = "https://g.page/r/CaAbCdEfGhIjKlMn/review";

const base: PopInput = {
  format: "a5",
  theme: "plain",
  storeName: "テスト整体院 玉島店",
  messageId: "thanks",
  tagline: "スタッフ一同お待ちしております",
  reviewUrl: GOOGLE_URL,
};

describe("定型文（ステマ規制への配慮）", () => {
  it("どの定型文も星・特典・条件付けの語を含まない", () => {
    for (const m of POP_MESSAGES) {
      for (const ng of POP_NG_PATTERNS) {
        expect(ng.pattern.test(m.text), `${m.id} が「${ng.label}」に該当`).toBe(false);
      }
      expect(m.text).not.toMatch(/星|★|☆|特典|割引|クーポン/);
    }
  });

  it("注記は『任意』と『特典が変わらない』を含む", () => {
    expect(POP_NOTE).toContain("任意");
    expect(POP_NOTE).toContain("特典が変わることはありません");
  });
});

describe("checkFreeText（ひとこと）", () => {
  it("空文字と普通の一言は通る", () => {
    expect(checkFreeText("")).toEqual({ ok: true });
    expect(checkFreeText("スタッフ一同お待ちしております")).toEqual({ ok: true });
    expect(checkFreeText("ご来店ありがとうございます")).toEqual({ ok: true });
  });

  it("星の数の指定を弾く", () => {
    for (const t of ["星5をお願いします", "★★★★★", "５つ星で", "高評価をお願いします"]) {
      const r = checkFreeText(t);
      expect(r.ok, t).toBe(false);
    }
  });

  it("特典との引き換えを弾く", () => {
    for (const t of ["口コミ投稿で特典", "ドリンク無料", "次回10%割引", "クーポン進呈", "お礼にプレゼント"]) {
      const r = checkFreeText(t);
      expect(r.ok, t).toBe(false);
    }
  });

  it("投稿を条件にする表現を弾く", () => {
    for (const t of ["書いていただいた方に", "投稿したらお得", "レビューしてくださった方へ"]) {
      const r = checkFreeText(t);
      expect(r.ok, t).toBe(false);
    }
  });

  it("良い評価の依頼を弾く", () => {
    expect(checkFreeText("良い口コミをお願いします").ok).toBe(false);
  });

  it("文字数と改行を弾く", () => {
    expect(checkFreeText("あ".repeat(41)).ok).toBe(false);
    expect(checkFreeText("あ".repeat(40)).ok).toBe(true);
    expect(checkFreeText("一行目\n二行目").ok).toBe(false);
  });
});

describe("checkStoreName / checkReviewUrl", () => {
  it("店名は必須・30文字以内", () => {
    expect(checkStoreName("").ok).toBe(false);
    expect(checkStoreName("  ").ok).toBe(false);
    expect(checkStoreName("あ".repeat(31)).ok).toBe(false);
    expect(checkStoreName("しっとる整体院").ok).toBe(true);
  });

  it("https のURLだけ通す", () => {
    expect(checkReviewUrl(GOOGLE_URL).ok).toBe(true);
    expect(checkReviewUrl("https://search.google.com/local/writereview?placeid=ChIJ123").ok).toBe(true);
    expect(checkReviewUrl("http://example.com/review").ok).toBe(false);
    expect(checkReviewUrl("example.com").ok).toBe(false);
    expect(checkReviewUrl("javascript:alert(1)").ok).toBe(false);
    expect(checkReviewUrl("https://localhost/x").ok).toBe(false);
    expect(checkReviewUrl("").ok).toBe(false);
  });
});

describe("QRコード", () => {
  it("URLから正方行列ができ、位置検出パターン（左上7×7の外枠）が黒", () => {
    const m = buildQrMatrix(GOOGLE_URL);
    expect(m.size).toBeGreaterThanOrEqual(21);
    expect(m.modules.length).toBe(m.size);
    for (const row of m.modules) expect(row.length).toBe(m.size);
    for (let i = 0; i < 7; i++) {
      expect(m.modules[0][i]).toBe(true);
      expect(m.modules[6][i]).toBe(true);
      expect(m.modules[i][0]).toBe(true);
      expect(m.modules[i][6]).toBe(true);
    }
  });

  it("行列の path は黒モジュールだけを塗る", () => {
    const m = { size: 3, modules: [[true, true, false], [false, false, false], [true, false, true]] };
    expect(qrMatrixToPathD(m)).toBe("M0 0h2v1h-2zM0 2h1v1h-1zM2 2h1v1h-1z");
  });

  it("同じURLなら同じ行列（決定的）", () => {
    expect(qrMatrixToPathD(buildQrMatrix(GOOGLE_URL))).toBe(qrMatrixToPathD(buildQrMatrix(GOOGLE_URL)));
  });
});

describe("buildPopSvg", () => {
  it("A5 と名刺サイズの両方で、店名・定型文・注記・QRが入る", () => {
    for (const format of ["a5", "card"] as const) {
      for (const theme of ["plain", "warm", "dark"] as const) {
        const svg = buildPopSvg({ ...base, format, theme });
        expect(svg.startsWith("<svg ")).toBe(true);
        expect(svg).toContain(base.storeName);
        expect(svg).toContain(POP_MESSAGES[0].text.split("。")[0]);
        expect(svg).toContain(POP_NOTE);
        expect(svg).toContain(base.tagline);
        expect(svg).toContain('shape-rendering="crispEdges"');
        expect(svg).not.toMatch(/星|★|特典と引き換え/);
      }
    }
    const a5 = buildPopSvg({ ...base, format: "a5" });
    const card = buildPopSvg({ ...base, format: "card" });
    expect(a5).toContain('viewBox="0 0 148 210"');
    expect(a5).toContain(POP_QR_CAPTION);
    expect(card).toContain('viewBox="0 0 91 55"');
    // 名刺サイズは幅が狭いので短い説明文を使う（長文だと右端からはみ出す）
    expect(card).toContain(POP_QR_CAPTION_SHORT);
    expect(card).not.toContain(POP_QR_CAPTION);
  });

  it("ひとことが無くても生成できる", () => {
    const svg = buildPopSvg({ ...base, tagline: undefined });
    expect(svg).toContain(POP_NOTE);
  });

  it("店名の記号は XML エスケープされる", () => {
    const svg = buildPopSvg({ ...base, storeName: "A&B <salon>" });
    expect(svg).toContain("A&amp;B &lt;salon&gt;");
    expect(svg).not.toContain("<salon>");
  });

  it("NGなひとことは validatePopInput で止まり、buildPopSvg は例外", () => {
    const bad = { ...base, tagline: "星5をお願いします" };
    expect(validatePopInput(bad)).toMatch(/星の数/);
    expect(() => buildPopSvg(bad)).toThrow();
    expect(validatePopInput(base)).toBeNull();
  });

  it("不正なURLでは生成しない", () => {
    expect(() => buildPopSvg({ ...base, reviewUrl: "http://x.com" })).toThrow();
  });
});

describe("レイアウト補助", () => {
  it("splitMessage は最初の『。』で2行に分ける", () => {
    expect(splitMessage("あいう。えお。")).toEqual(["あいう。", "えお。"]);
    expect(splitMessage("あいう")).toEqual(["あいう"]);
  });

  it("fitFontSize は長い文字列ほど小さく、下限と上限を守る", () => {
    expect(fitFontSize("あ", 100, 10, 3)).toBe(10);
    expect(fitFontSize("あ".repeat(100), 100, 10, 3)).toBe(3);
    const mid = fitFontSize("あ".repeat(20), 100, 10, 3);
    expect(mid).toBeGreaterThan(3);
    expect(mid).toBeLessThan(10);
  });

  it("単位変換", () => {
    expect(mmToPx(148)).toBe(1748);
    expect(mmToPx(210)).toBe(2480);
    expect(mmToPt(148)).toBeCloseTo(419.53, 1);
  });
});
