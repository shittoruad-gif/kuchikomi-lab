import { useState } from "react";
import { Link } from "wouter";
import { Check, X, Crown, Star, Zap, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { PLAN_NAMES, PLAN_PRICES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

type PlanKey = "light" | "standard" | "premium";
type BillingCycle = "monthly" | "yearly";

const PLAN_LIMITS = {
  light: {
    monthlyGenerationsLimit: 30,
    maxQuestionsCount: 5,
    canCustomizeQuestions: false,
    canSelectPurpose: false,
    canSelectTone: false,
    canUseFreeText: false,
    maxGenerationPatterns: 1,
  },
  standard: {
    monthlyGenerationsLimit: 100,
    maxQuestionsCount: 10,
    canCustomizeQuestions: false,
    canSelectPurpose: true,
    canSelectTone: true,
    canUseFreeText: false,
    maxGenerationPatterns: 3,
  },
  premium: {
    monthlyGenerationsLimit: 300,
    maxQuestionsCount: 20,
    canCustomizeQuestions: true,
    canSelectPurpose: true,
    canSelectTone: true,
    canUseFreeText: true,
    maxGenerationPatterns: 5,
  },
} as const;

const PLAN_ICONS: Record<PlanKey, React.ReactNode> = {
  light: <Zap className="w-6 h-6" />,
  standard: <Star className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
};

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  light: [
    "月30回まで生成",
    "質問テンプレート5問",
    "業種別口コミ生成",
    "メールサポート",
  ],
  standard: [
    "月100回まで生成",
    "質問テンプレート10問",
    "目的別口コミ生成（初回/リピート/接客）",
    "トーン（口調）選択",
    "優先メールサポート",
  ],
  premium: [
    "月300回まで生成",
    "質問テンプレート20問",
    "目的・トーン自由選択",
    "カスタム質問完全自由設定",
    "自由記述・高度最適化",
    "SEO最適化クチコミ",
    "専任チャットサポート",
  ],
};

const REVIEW_SAMPLES: Record<PlanKey, { label: string; text: string }> = {
  light: {
    label: "LIGHTプラン生成例",
    text: "先日初めて来店しました。スタッフの方がとても親切で、施術も丁寧でした。店内も清潔感があり、リラックスできました。また利用したいです。",
  },
  standard: {
    label: "STANDARDプラン生成例",
    text: "友人の紹介で伺いました。カウンセリングでしっかり悩みを聞いてくださり、自分に合った施術を提案していただきました。施術中もこまめに声をかけてくださり安心感がありました。仕上がりも期待以上で、翌日も効果を実感できました。定期的に通いたいと思えるお店です。",
  },
  premium: {
    label: "PREMIUMプラン生成例",
    text: "【駅近で通いやすい】口コミで評判の良さを知り、肩こり改善のために予約しました。初回カウンセリングでは姿勢分析まで丁寧に行っていただき、根本原因を特定。施術は痛みもなく、独自の手技で深層の筋肉にアプローチしてくださいました。施術後は肩が嘘のように軽くなり、頭痛まで改善。スタッフ全員がプロフェッショナルで、アフターケアのストレッチ指導も的確です。完全個室でプライバシーも安心。この価格でこのクオリティは本当にお値打ちです。",
  },
};

const FAQ_ITEMS = [
  {
    q: "プランはいつでも変更できますか？",
    a: "はい、いつでもプラン変更が可能です。アップグレードの場合は即時反映され、差額分のみお支払いいただきます。ダウングレードの場合は次回更新日から適用されます。",
  },
  {
    q: "年額プランの途中解約はできますか？",
    a: "年額プランの途中解約は可能です。残りの期間に応じた返金を行います。詳しくはサポートまでお問い合わせください。",
  },
  {
    q: "無料トライアルはありますか？",
    a: "はい、全プランに7日間の無料トライアルをご用意しています。クレジットカード登録なしでお試しいただけます。",
  },
  {
    q: "生成したクチコミはどのように使えますか？",
    a: "生成されたクチコミテンプレートは、お客様への案内用としてご利用いただけます。QRコードやリンクを通じて、お客様がスムーズにクチコミを投稿できるようサポートします。",
  },
  {
    q: "支払い方法は何がありますか？",
    a: "クレジットカード（Visa, Mastercard, American Express, JCB）に対応しています。Stripeによる安全な決済処理を行っています。",
  },
  {
    q: "領収書は発行できますか？",
    a: "はい、ダッシュボードの「お支払い履歴」から領収書をダウンロードできます。インボイス制度にも対応しています。",
  },
];

const COMPARISON_ROWS: {
  label: string;
  key: string;
  type: "number" | "boolean";
}[] = [
  { label: "月間生成回数", key: "monthlyGenerationsLimit", type: "number" },
  { label: "最大質問数", key: "maxQuestionsCount", type: "number" },
  { label: "目的選択", key: "canSelectPurpose", type: "boolean" },
  { label: "トーン選択", key: "canSelectTone", type: "boolean" },
  { label: "カスタム質問", key: "canCustomizeQuestions", type: "boolean" },
  { label: "自由記述", key: "canUseFreeText", type: "boolean" },
  { label: "生成パターン数", key: "maxGenerationPatterns", type: "number" },
];

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

function BillingToggle({
  billing,
  onChange,
}: {
  billing: BillingCycle;
  onChange: (b: BillingCycle) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-medium transition-colors ${
          billing === "monthly" ? "text-white" : "text-purple-300/60"
        }`}
      >
        月額
      </span>
      <button
        type="button"
        onClick={() =>
          onChange(billing === "monthly" ? "yearly" : "monthly")
        }
        className="relative w-16 h-8 rounded-full bg-purple-900/60 border border-purple-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        aria-label="料金プラン切り替え"
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-lg transition-transform duration-300 ${
            billing === "yearly" ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          billing === "yearly" ? "text-white" : "text-purple-300/60"
        }`}
      >
        年額
      </span>
      {billing === "yearly" && (
        <span className="ml-1 inline-flex items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-0.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/25 animate-pulse">
          2ヶ月分お得
        </span>
      )}
    </div>
  );
}

function PlanCard({
  planKey,
  billing,
  isPopular,
}: {
  planKey: PlanKey;
  billing: BillingCycle;
  isPopular?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const createCheckout = trpc.subscription.createCheckout.useMutation();

  const price = PLAN_PRICES[billing][planKey];
  const features = PLAN_FEATURES[planKey];
  const icon = PLAN_ICONS[planKey];

  const handleSubscribe = async () => {
    if (!isAuthenticated) return;
    const result = await createCheckout.mutateAsync({
      plan: planKey,
    });
    if (result.url) {
      window.open(result.url, "_blank");
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-[1px] transition-all duration-500 hover:-translate-y-2 ${
        isPopular
          ? "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500"
          : "bg-purple-500/20"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-1 text-xs font-bold text-white shadow-xl shadow-fuchsia-500/30">
            <Star className="w-3 h-3 fill-current" /> 人気
          </span>
        </div>
      )}
      <div
        className={`relative h-full rounded-2xl bg-[#0d0a1a]/80 backdrop-blur-xl p-8 flex flex-col ${
          isPopular ? "border-0" : "border border-purple-500/10"
        }`}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
            isPopular
              ? "bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-transparent"
              : "bg-gradient-to-br from-purple-500/5 to-transparent"
          }`}
        />

        {/* Plan Icon & Name */}
        <div className="relative flex items-center gap-3 mb-6">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${
              isPopular
                ? "bg-gradient-to-br from-fuchsia-500/30 to-purple-500/30 text-fuchsia-300"
                : "bg-purple-500/10 text-purple-400"
            }`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {PLAN_NAMES[planKey]}
            </h3>
          </div>
        </div>

        {/* Price */}
        <div className="relative mb-8">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl font-extrabold tracking-tight ${
                isPopular
                  ? "bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {formatPrice(price)}
            </span>
            <span className="text-purple-300/60 text-sm">
              /{billing === "monthly" ? "月" : "年"}
            </span>
          </div>
          {billing === "yearly" && (
            <p className="mt-1 text-xs text-purple-400/80">
              月あたり {formatPrice(Math.round(price / 12))}
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="relative flex-1 space-y-3 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isPopular ? "text-fuchsia-400" : "text-purple-400"
                }`}
              />
              <span className="text-sm text-purple-100/80">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={createCheckout.isPending}
            className={`relative w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isPopular
                ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02]"
                : "bg-purple-500/10 text-purple-200 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {createCheckout.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                申し込む
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <Link
            href="/"
            className={`relative w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isPopular
                ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02]"
                : "bg-purple-500/10 text-purple-200 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40"
            }`}
          >
            ログインして申し込む
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ComparisonTable() {
  const plans: PlanKey[] = ["light", "standard", "premium"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-4 px-4 text-sm font-medium text-purple-300/60 border-b border-purple-500/10">
              機能
            </th>
            {plans.map((plan) => (
              <th
                key={plan}
                className={`py-4 px-4 text-center text-sm font-bold border-b border-purple-500/10 ${
                  plan === "standard" ? "text-fuchsia-300" : "text-white"
                }`}
              >
                {PLAN_NAMES[plan]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr
              key={row.key}
              className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors"
            >
              <td className="py-4 px-4 text-sm text-purple-200/80">
                {row.label}
              </td>
              {plans.map((plan) => {
                const value =
                  PLAN_LIMITS[plan][
                    row.key as keyof (typeof PLAN_LIMITS)[typeof plan]
                  ];
                return (
                  <td key={plan} className="py-4 px-4 text-center">
                    {row.type === "boolean" ? (
                      value ? (
                        <Check className="w-5 h-5 text-fuchsia-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-purple-500/30 mx-auto" />
                      )
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          plan === "standard"
                            ? "text-fuchsia-300"
                            : "text-white"
                        }`}
                      >
                        {String(value)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewSampleCard({
  planKey,
}: {
  planKey: PlanKey;
}) {
  const sample = REVIEW_SAMPLES[planKey];
  const icon = PLAN_ICONS[planKey];

  return (
    <div className="group relative rounded-2xl border border-purple-500/10 bg-[#0d0a1a]/60 backdrop-blur-xl p-6 transition-all duration-300 hover:border-purple-500/20 hover:bg-[#0d0a1a]/80">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400">
          {icon}
        </div>
        <span className="text-sm font-bold text-purple-200">
          {sample.label}
        </span>
      </div>
      <p className="text-sm text-purple-100/70 leading-relaxed">
        {sample.text}
      </p>
      <div className="mt-4 flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
          />
        ))}
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-purple-500/10 bg-[#0d0a1a]/60 backdrop-blur-xl overflow-hidden transition-colors hover:border-purple-500/20"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-purple-100">
                {item.q}
              </span>
              <span
                className={`ml-4 flex-shrink-0 text-purple-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-4 text-sm text-purple-200/70 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────── */

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <>
      <SEOHelmet
        title="料金プラン | クチコミラボ"
        description="クチコミラボの料金プラン。LIGHT・STANDARD・PREMIUMの3プランから、あなたのビジネスに最適なプランをお選びください。"
      />

      <div className="min-h-screen bg-[#08060e] text-white overflow-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="pt-8 pb-4 px-4">
            <nav className="max-w-6xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="text-xl font-extrabold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent"
              >
                クチコミラボ
              </Link>
              <Link
                href="/"
                className="text-sm text-purple-300/60 hover:text-purple-200 transition-colors"
              >
                ← トップへ戻る
              </Link>
            </nav>
          </header>

          {/* Hero */}
          <section className="pt-16 pb-12 px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-fuchsia-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                料金プラン
              </span>
            </h1>
            <p className="max-w-xl mx-auto text-purple-200/60 text-base md:text-lg mb-10">
              ビジネスの規模に合わせて最適なプランをお選びください。
              <br className="hidden sm:block" />
              すべてのプランで7日間の無料トライアル付き。
            </p>

            {/* Billing Toggle */}
            <BillingToggle billing={billing} onChange={setBilling} />
          </section>

          {/* Plan Cards */}
          <section className="px-4 pb-24">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <PlanCard planKey="light" billing={billing} />
              <PlanCard planKey="standard" billing={billing} isPopular />
              <PlanCard planKey="premium" billing={billing} />
            </div>
          </section>

          {/* Feature Comparison Table */}
          <section className="px-4 pb-24">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
                <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                  機能比較
                </span>
              </h2>
              <p className="text-center text-purple-300/50 text-sm mb-10">
                各プランの詳細な機能をご確認ください
              </p>
              <div className="rounded-2xl border border-purple-500/10 bg-[#0d0a1a]/60 backdrop-blur-xl p-2 md:p-6">
                <ComparisonTable />
              </div>
            </div>
          </section>

          {/* Review Sample Cards */}
          <section className="px-4 pb-24">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
                <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                  生成クチコミ例
                </span>
              </h2>
              <p className="text-center text-purple-300/50 text-sm mb-10">
                プランごとの生成クオリティの違いをご覧ください
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReviewSampleCard planKey="light" />
                <ReviewSampleCard planKey="standard" />
                <ReviewSampleCard planKey="premium" />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-4 pb-24">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
                <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                  よくある質問
                </span>
              </h2>
              <p className="text-center text-purple-300/50 text-sm mb-10">
                料金・プランに関する疑問にお答えします
              </p>
              <FAQAccordion />
            </div>
          </section>

          {/* Footer CTA */}
          <section className="px-4 pb-24">
            <div className="max-w-3xl mx-auto text-center">
              <div className="rounded-2xl border border-purple-500/10 bg-[#0d0a1a]/60 backdrop-blur-xl p-10">
                <h3 className="text-xl font-bold text-white mb-3">
                  まずは無料でお試しください
                </h3>
                <p className="text-purple-200/60 text-sm mb-6">
                  7日間の無料トライアルで、クチコミラボの効果を実感してください。
                </p>
                <Link
                  href="/trial"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  無料トライアルを始める
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
