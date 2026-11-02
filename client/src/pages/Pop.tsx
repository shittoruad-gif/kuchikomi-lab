import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Loader2, QrCode, Save, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SEOHelmet from "@/components/SEOHelmet";
import {
  POP_MESSAGES,
  POP_THEMES,
  POP_FORMATS,
  POP_NOTE,
  POP_LIMITS,
  buildPopSvg,
  validatePopInput,
  checkFreeText,
  checkReviewUrl,
  checkStoreName,
  type PopFormatId,
  type PopThemeId,
  type PopMessageId,
} from "@shared/pop";
import { svgForDisplay, svgToPngBlob, blobToBase64, base64ToBlob, downloadBlob } from "@/lib/popExport";

const THEME_IDS = Object.keys(POP_THEMES) as PopThemeId[];
const FORMAT_IDS = Object.keys(POP_FORMATS) as PopFormatId[];

export default function Pop() {
  const { data: saved, isLoading: savedLoading } = trpc.store.get.useQuery();
  const saveMutation = trpc.store.save.useMutation();
  const pdfMutation = trpc.pop.renderPdf.useMutation();
  const utils = trpc.useUtils();

  const [storeName, setStoreName] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [messageId, setMessageId] = useState<PopMessageId>("thanks");
  const [theme, setTheme] = useState<PopThemeId>("plain");
  const [format, setFormat] = useState<PopFormatId>("a5");
  const [prefilled, setPrefilled] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);

  // 保存済みの店舗設定を1回だけ流し込む
  useEffect(() => {
    if (prefilled || savedLoading) return;
    if (saved) {
      setStoreName(saved.storeName);
      setReviewUrl(saved.reviewUrl);
      setTagline(saved.tagline ?? "");
    }
    setPrefilled(true);
  }, [saved, savedLoading, prefilled]);

  const nameCheck = checkStoreName(storeName);
  const urlCheck = checkReviewUrl(reviewUrl);
  const taglineCheck = checkFreeText(tagline);

  const input = useMemo(
    () => ({ format, theme, storeName, messageId, tagline, reviewUrl }),
    [format, theme, storeName, messageId, tagline, reviewUrl],
  );
  const validationError = validatePopInput(input);

  const svg = useMemo(() => {
    if (validationError) return null;
    try {
      return buildPopSvg(input);
    } catch {
      return null;
    }
  }, [input, validationError]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ storeName, reviewUrl, tagline: tagline || undefined });
      await utils.store.get.invalidate();
      toast.success("店舗設定を保存しました");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  const baseFilename = () => {
    const safe = storeName.trim().replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 30) || "pop";
    return `${safe}_${format === "a5" ? "A5_POP" : "QRカード"}`;
  };

  const handlePng = async () => {
    if (!svg) return;
    setExporting("png");
    try {
      const blob = await svgToPngBlob(svg, format);
      downloadBlob(blob, `${baseFilename()}.png`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PNGの作成に失敗しました");
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    if (!svg) return;
    setExporting("pdf");
    try {
      const png = await svgToPngBlob(svg, format);
      const pngBase64 = await blobToBase64(png);
      const result = await pdfMutation.mutateAsync({ format, pngBase64 });
      downloadBlob(base64ToBlob(result.pdf, "application/pdf"), `${baseFilename()}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDFの作成に失敗しました");
    } finally {
      setExporting(null);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-purple-500/30 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-purple-400 focus:outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0520] via-[#1a0a30] to-[#0d0018] px-4 py-8">
      <SEOHelmet title="店頭POP・QRカード" description="口コミ投稿ページへ案内する店頭POPとQRカードを作成します" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 text-purple-300 transition hover:bg-purple-900/30"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="gradient-text text-2xl font-bold">店頭POP・QRカード</h1>
            <p className="mt-1 text-xs text-purple-300/70">
              口コミ投稿ページへのQRを載せた卓上POPとカードを作ります。画像(PNG)とPDFでダウンロードできます。
            </p>
          </div>
        </div>

        {/* 配慮の説明 */}
        <div className="glass-card flex gap-3 border-blue-500/30 bg-blue-900/15 p-4 text-sm text-blue-100/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <p>
            文面は「正直な感想をお願いする」定型文のみ選べます。星の数の指定や、特典と引き換える文言は入れられません。
            注記「{POP_NOTE}」は必ず小さく印字されます。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* 入力 */}
          <div className="space-y-6">
            {/* 1. 店舗設定 */}
            <div className="glass-card space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">1</span>
                店舗設定
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-200" htmlFor="pop-store-name">
                  店名（{POP_LIMITS.storeNameMax}文字まで）
                </label>
                <input
                  id="pop-store-name"
                  className={fieldClass}
                  value={storeName}
                  maxLength={POP_LIMITS.storeNameMax}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="例: しっとる整体院"
                />
                {storeName.length > 0 && !nameCheck.ok && <p className="text-xs text-red-300">{nameCheck.reason}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-200" htmlFor="pop-review-url">
                  口コミ投稿URL（QRの行き先）
                </label>
                <input
                  id="pop-review-url"
                  className={fieldClass}
                  value={reviewUrl}
                  inputMode="url"
                  onChange={(e) => setReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/xxxxxxxx/review"
                />
                {reviewUrl.length > 0 && !urlCheck.ok && <p className="text-xs text-red-300">{urlCheck.reason}</p>}
                <p className="text-xs text-purple-300/60">
                  Googleビジネスプロフィールの「クチコミを増やす」で表示されるリンクを貼り付けてください。他の口コミサイトのURLでも使えます。
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-200" htmlFor="pop-tagline">
                  ひとこと（任意・{POP_LIMITS.taglineMax}文字まで）
                </label>
                <input
                  id="pop-tagline"
                  className={fieldClass}
                  value={tagline}
                  maxLength={POP_LIMITS.taglineMax}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="例: スタッフ一同お待ちしております"
                />
                {!taglineCheck.ok && <p className="text-xs text-red-300">{taglineCheck.reason}</p>}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending || !nameCheck.ok || !urlCheck.ok || !taglineCheck.ok}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-900/20 px-4 py-2 text-sm text-purple-200 transition hover:bg-purple-900/40 disabled:opacity-40"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                店舗設定を保存
              </button>
            </div>

            {/* 2. 文面 */}
            <div className="glass-card space-y-3 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">2</span>
                文面（定型から選択）
              </h2>
              <div className="space-y-2">
                {POP_MESSAGES.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                      messageId === m.id
                        ? "border-purple-400 bg-purple-500/20 text-white"
                        : "border-purple-500/20 bg-white/5 text-purple-200 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pop-message"
                      className="mt-1 accent-purple-500"
                      checked={messageId === m.id}
                      onChange={() => setMessageId(m.id)}
                    />
                    <span>{m.text}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. 型・サイズ */}
            <div className="glass-card space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">3</span>
                型とサイズ
              </h2>
              <div className="space-y-1">
                <p className="text-xs font-medium text-purple-200">サイズ</p>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFormat(id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        format === id
                          ? "border-purple-400 bg-purple-500/20 text-white"
                          : "border-purple-500/20 bg-white/5 text-purple-200 hover:bg-white/10"
                      }`}
                    >
                      {POP_FORMATS[id].label}
                      <span className="block text-[11px] text-purple-300/60">
                        {POP_FORMATS[id].widthMm} × {POP_FORMATS[id].heightMm} mm
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-purple-200">型（色）</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs transition ${
                        theme === id
                          ? "border-purple-400 bg-purple-500/20 text-white"
                          : "border-purple-500/20 bg-white/5 text-purple-200 hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="h-6 w-full rounded"
                        style={{ background: `linear-gradient(90deg, ${POP_THEMES[id].band} 50%, ${POP_THEMES[id].bg} 50%)` }}
                      />
                      {POP_THEMES[id].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* プレビュー・ダウンロード */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="glass-card space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <QrCode className="h-5 w-5 text-purple-400" />
                プレビュー
              </h2>
              <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-lg bg-white/5 p-3">
                {svg ? (
                  <div
                    className="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:shadow-lg"
                    data-testid="pop-preview"
                    dangerouslySetInnerHTML={{ __html: svgForDisplay(svg) }}
                  />
                ) : (
                  <div className="flex aspect-[148/210] items-center justify-center rounded border border-dashed border-purple-500/30 p-6 text-center text-sm text-purple-300/60">
                    {validationError ?? "店名と口コミ投稿URLを入力するとプレビューが表示されます"}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePng}
                  disabled={!svg || exporting !== null}
                  className="gradient-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {exporting === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  画像(PNG)
                </button>
                <button
                  type="button"
                  onClick={handlePdf}
                  disabled={!svg || exporting !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-900/20 px-4 py-2.5 text-sm font-medium text-purple-200 transition hover:bg-purple-900/40 disabled:opacity-40"
                >
                  {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  PDF
                </button>
              </div>
              <p className="text-xs text-purple-300/60">
                PNGは300dpi相当（印刷向き）。PDFは用紙サイズぴったりの1ページです。ダウンロードのみで、外部への送信や印刷の発注は行いません。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
