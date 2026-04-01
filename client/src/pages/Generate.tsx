import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { INDUSTRIES } from "@shared/const";
import {
  Sparkles,
  Copy,
  Check,
  Lock,
  Star,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import SEOHelmet from "@/components/SEOHelmet";

const PURPOSES = ["初回来店", "リピート", "接客評価"] as const;
const TONES = ["丁寧", "親しみやすい", "専門性"] as const;

export default function Generate() {
  const { user } = useAuth();
  const { data: subscription } = trpc.subscription.current.useQuery();

  const planKey = (subscription?.plan ?? "light") as
    | "light"
    | "standard"
    | "premium";
  const isStandardPlus = planKey === "standard" || planKey === "premium";
  const isPremium = planKey === "premium";

  const [industry, setIndustry] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: defaultQuestions } = trpc.review.getDefaultQuestions.useQuery(
    { industry },
    { enabled: !!industry }
  );

  const { data: customQuestions } = trpc.customQuestions.list.useQuery(
    undefined,
    { enabled: isPremium }
  );

  const generateMutation = trpc.review.generate.useMutation();

  // Reset answers when questions change
  useEffect(() => {
    setAnswers({});
  }, [industry]);

  const defaultQList = defaultQuestions ?? [];
  const customQList = isPremium && customQuestions ? customQuestions.map((q: any) => q.questionText) : [];
  const allQuestions = [...defaultQList, ...customQList];

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleGenerate = () => {
    const questionTexts = allQuestions;
    const answerTexts = allQuestions.map((q) => answers[q] ?? "");
    generateMutation.mutate({
      industry,
      purpose: isStandardPlus ? purpose : undefined,
      tone: isStandardPlus ? tone : undefined,
      questions: questionTexts,
      answers: answerTexts,
    });
  };

  const handleCopy = async () => {
    if (generateMutation.data?.review) {
      await navigator.clipboard.writeText(generateMutation.data.review);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canGenerate = !!industry && allQuestions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0520] via-[#1a0a30] to-[#0d0018] px-4 py-8">
      <SEOHelmet
        title="口コミを生成"
        description="AIが自然な口コミ文章を自動生成します"
      />

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/30 text-purple-300 transition hover:bg-purple-900/30"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="gradient-text text-2xl font-bold">
                口コミを生成
              </h1>
            </div>
          </div>
          {subscription && (
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
              {planKey.toUpperCase()}
            </span>
          )}
        </div>

        {/* Step 1 - Industry Selection */}
        <div className="glass-card space-y-3 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">
              1
            </span>
            業種を選択
          </h2>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-lg border border-purple-500/30 bg-purple-900/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400/60"
          >
            <option value="">業種を選択してください</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2 - Purpose Selection */}
        <div className="glass-card space-y-3 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">
              2
            </span>
            目的を選択
            {!isStandardPlus && (
              <Lock className="h-4 w-4 text-purple-500/60" />
            )}
          </h2>
          {!isStandardPlus && (
            <p className="text-xs text-purple-400/60">
              STANDARD以上のプランで利用可能です
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p}
                disabled={!isStandardPlus}
                onClick={() => setPurpose(purpose === p ? "" : p)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  purpose === p
                    ? "border-purple-400 bg-purple-500/30 text-white"
                    : isStandardPlus
                      ? "border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
                      : "cursor-not-allowed border-purple-800/30 text-purple-600/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 - Tone Selection */}
        <div className="glass-card space-y-3 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">
              3
            </span>
            トーンを選択
            {!isStandardPlus && (
              <Lock className="h-4 w-4 text-purple-500/60" />
            )}
          </h2>
          {!isStandardPlus && (
            <p className="text-xs text-purple-400/60">
              STANDARD以上のプランで利用可能です
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                disabled={!isStandardPlus}
                onClick={() => setTone(tone === t ? "" : t)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  tone === t
                    ? "border-purple-400 bg-purple-500/30 text-white"
                    : isStandardPlus
                      ? "border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
                      : "cursor-not-allowed border-purple-800/30 text-purple-600/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4 - Questions & Answers */}
        <div className="glass-card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-200">
              4
            </span>
            質問に回答
          </h2>

          {!industry && (
            <p className="text-sm text-purple-400/60">
              業種を選択すると質問が表示されます
            </p>
          )}

          {allQuestions.map((q: any) => (
            <div key={q.id} className="space-y-1">
              <label className="text-sm font-medium text-purple-200">
                {q.text}
              </label>
              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="回答を入力..."
                className="w-full rounded-lg border border-purple-500/30 bg-purple-900/30 px-4 py-2.5 text-sm text-white placeholder-purple-500/50 outline-none transition focus:border-purple-400/60"
              />
            </div>
          ))}

          {isPremium && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-purple-200">
                フリーテキスト（自由記述）
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="口コミに含めたい内容を自由に記述..."
                rows={3}
                className="w-full resize-none rounded-lg border border-purple-500/30 bg-purple-900/30 px-4 py-2.5 text-sm text-white placeholder-purple-500/50 outline-none transition focus:border-purple-400/60"
              />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generateMutation.isPending}
          className="gradient-btn flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              口コミを生成する
            </>
          )}
        </button>

        {/* Result */}
        {generateMutation.data?.review && (
          <div className="glass-card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">生成結果</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300 transition hover:bg-purple-900/30"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    コピー
                  </>
                )}
              </button>
            </div>

            {/* Decorative star rating */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-purple-100/90">
              {generateMutation.data.review}
            </p>
          </div>
        )}

        {/* Error */}
        {generateMutation.isError && (
          <div className="glass-card border-red-500/30 bg-red-900/20 p-4">
            <p className="text-sm text-red-300">
              生成中にエラーが発生しました。もう一度お試しください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
