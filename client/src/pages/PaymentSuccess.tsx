import { Link } from "wouter";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PLAN_NAMES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

export default function PaymentSuccess() {
  const { data: subscription } = trpc.subscription.current.useQuery();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SEOHelmet title="決済完了" />

      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">決済が完了しました！</h1>
        <p className="text-white/60 mb-8">クチコミラボをご利用いただきありがとうございます</p>

        {subscription && (
          <div className="glass-card p-6 mb-8 text-left">
            <h3 className="font-medium mb-4 text-center">ご契約内容</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">プラン</span>
                <span className="font-medium">
                  {PLAN_NAMES[subscription.plan as keyof typeof PLAN_NAMES]}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-white/60">次回更新日</span>
                  <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString("ja-JP")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/generate"
            className="gradient-btn w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            口コミを生成する
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-3 rounded-lg border border-white/20 hover:bg-white/10 flex items-center justify-center gap-2 text-white/80"
          >
            ダッシュボードへ
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
