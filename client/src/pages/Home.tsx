import { Link } from "wouter";
import {
  Sparkles,
  Layers,
  MousePointerClick,
  Copy,
  Check,
  Star,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { INDUSTRIES, PLAN_NAMES, PLAN_PRICES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-sm text-white/70 mb-8">
          <Star className="w-4 h-4 text-yellow-400" />
          AI搭載のGoogleクチコミ生成ツール
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Google口コミを
          <br />
          <span className="gradient-text">簡単</span>に生成
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          質問に答えるだけで、AIが自然で説得力のあるGoogleクチコミ文を自動生成。
          集客力アップをサポートします。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/trial"
            className="gradient-btn px-8 py-3.5 rounded-lg text-white font-semibold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
          >
            今すぐ無料で試す
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3.5 rounded-lg font-semibold text-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            料金を見る
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI生成",
    description: "最先端AIが自然な口コミ文を自動生成",
  },
  {
    icon: Layers,
    title: "プラン対応",
    description: "3つのプランであらゆるニーズに対応",
  },
  {
    icon: MousePointerClick,
    title: "簡単操作",
    description: "質問に答えるだけで口コミが完成",
  },
] as const;

function Features() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          選ばれる<span className="gradient-text">3つの理由</span>
        </h2>
        <p className="text-white/60 text-center mb-16 max-w-xl mx-auto">
          クチコミラボが多くの店舗オーナーに支持される理由
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="glass-card card-3d rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trial Demo                                                         */
/* ------------------------------------------------------------------ */

const DEMO_QUESTIONS = [
  "お店の雰囲気はどうでしたか？",
  "スタッフの対応はいかがでしたか？",
  "特に印象に残ったことはありますか？",
];

function TrialDemo() {
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.review.generateTrial.useMutation();

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      industry,
      answers: DEMO_QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] ?? "" })),
    });
  };

  const handleCopy = async () => {
    if (!generateMutation.data) return;
    await navigator.clipboard.writeText(generateMutation.data.review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = answers.every((a) => a.trim().length > 0);

  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          まずは<span className="gradient-text">無料で体験</span>
        </h2>
        <p className="text-white/60 text-center mb-12 max-w-xl mx-auto">
          3つの質問に答えるだけで、AIがクチコミを生成します
        </p>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          {/* Industry selector */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              業種を選択
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/20 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="bg-slate-900">
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Questions */}
          {DEMO_QUESTIONS.map((question, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {question}
              </label>
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => handleAnswerChange(i, e.target.value)}
                placeholder="回答を入力してください…"
                className="w-full rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              />
            </div>
          ))}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generateMutation.isPending}
            className="w-full gradient-btn px-6 py-3.5 rounded-lg text-white font-semibold text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {generateMutation.isPending ? "生成中…" : "口コミを生成"}
          </button>

          {/* Error */}
          {generateMutation.isError && (
            <p className="text-red-400 text-sm text-center">
              エラーが発生しました。もう一度お試しください。
            </p>
          )}

          {/* Result */}
          {generateMutation.data && (
            <div className="glass-card rounded-xl p-6 relative">
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {generateMutation.data.review}
              </p>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                aria-label="コピー"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Preview                                                    */
/* ------------------------------------------------------------------ */

const PLANS: { key: "light" | "standard" | "premium"; highlight?: boolean }[] =
  [
    { key: "light" },
    { key: "standard", highlight: true },
    { key: "premium" },
  ];

function PricingPreview() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          <span className="gradient-text">料金プラン</span>
        </h2>
        <p className="text-white/60 text-center mb-16 max-w-xl mx-auto">
          あなたのビジネスに合ったプランをお選びください
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map(({ key, highlight }) => (
            <div
              key={key}
              className={`glass-card card-3d rounded-2xl p-8 text-center relative ${
                highlight ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-semibold text-white">
                  人気
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-2">
                {PLAN_NAMES[key]}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ¥{PLAN_PRICES.monthly[key].toLocaleString()}
                </span>
                <span className="text-white/50 text-sm">/月</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            プラン詳細を見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-white/40 text-sm">
          &copy; {new Date().getFullYear()} クチコミラボ. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/terms"
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <SEOHelmet
        title="クチコミラボ | AI搭載Google口コミ生成ツール"
        description="質問に答えるだけで、AIが自然なGoogleクチコミ文を自動生成。集客力アップをサポートするクチコミラボ。"
      />
      <Hero />
      <Features />
      <TrialDemo />
      <PricingPreview />
      <Footer />
    </>
  );
}
