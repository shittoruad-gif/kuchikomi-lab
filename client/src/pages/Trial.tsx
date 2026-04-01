import { useState } from "react";
import { Link } from "wouter";
import { Sparkles, Copy, Check, ArrowLeft, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { INDUSTRIES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

const TRIAL_QUESTIONS = [
  "どのようなサービスを利用しましたか？",
  "スタッフの対応はいかがでしたか？",
  "また利用したいと思いますか？",
];

export default function Trial() {
  const [industry, setIndustry] = useState("");
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.review.generateTrial.useMutation();

  const handleGenerate = () => {
    if (!industry) return;
    generateMutation.mutate({
      industry,
      answers: TRIAL_QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] || "" })),
    });
  };

  const handleCopy = () => {
    if (generateMutation.data?.review) {
      navigator.clipboard.writeText(generateMutation.data.review);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="無料体験" description="Google口コミAI生成を無料で体験" />

      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 mb-4">
            <Sparkles className="w-4 h-4" />
            無料体験
          </div>
          <h1 className="text-3xl font-bold mb-3">AI口コミ生成を体験</h1>
          <p className="text-white/60">業種を選んで質問に答えるだけで、自然な口コミが生成されます</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">業種を選択</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-900">選択してください</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="bg-slate-900">{ind}</option>
              ))}
            </select>
          </div>

          {/* Questions */}
          {TRIAL_QUESTIONS.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-white/80 mb-2">{q}</label>
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder="回答を入力..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          <button
            onClick={handleGenerate}
            disabled={!industry || generateMutation.isPending}
            className="w-full gradient-btn py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generateMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                口コミを生成
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {generateMutation.data?.review && (
          <div className="glass-card p-8 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                生成された口コミ
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <p className="text-white/90 leading-relaxed">{generateMutation.data.review}</p>
          </div>
        )}

        {/* Upgrade CTA */}
        <div className="text-center mt-10">
          <p className="text-white/50 mb-4">もっと高品質な口コミを生成したい方は</p>
          <Link href="/pricing" className="gradient-btn px-8 py-3 rounded-lg inline-flex items-center gap-2 font-medium">
            有料プランを見る
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
