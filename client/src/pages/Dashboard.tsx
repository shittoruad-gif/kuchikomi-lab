import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PLAN_NAMES, PLAN_PRICES } from "@shared/const";
import {
  AlertTriangle,
  CreditCard,
  Settings,
  Sparkles,
  FileText,
  Crown,
  ArrowRight,
  LogOut,
} from "lucide-react";
import SEOHelmet from "@/components/SEOHelmet";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: subscription, isLoading: subLoading } =
    trpc.subscription.current.useQuery();
  const { data: limits } = trpc.subscription.limits.useQuery();
  const { data: monthlyUsage } = trpc.subscription.monthlyUsage.useQuery();
  const { data: history } = trpc.review.history.useQuery();
  const portalMutation = trpc.subscription.createPortal.useMutation();

  const handleOpenPortal = async () => {
    const result = await portalMutation.mutateAsync();
    if (result?.url) {
      window.open(result.url, "_blank");
    }
  };

  const planKey = subscription?.plan as keyof typeof PLAN_NAMES | undefined;
  const planName = planKey ? PLAN_NAMES[planKey] : null;
  const planPrice = planKey ? PLAN_PRICES.monthly[planKey] : null;

  const recentHistory = history?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0520] via-[#1a0a30] to-[#0d0018] px-4 py-8">
      <SEOHelmet title="ダッシュボード" description="クチコミラボのダッシュボード" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="gradient-text text-3xl font-bold">ダッシュボード</h1>
            <p className="mt-1 text-sm text-purple-300/70">
              ようこそ、{user?.name ?? "ユーザー"}さん
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-900/20 px-4 py-2 text-sm text-purple-300 transition hover:bg-purple-900/40"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>

        {/* Payment Failed Alert */}
        {subscription?.status === "past_due" && (
          <div className="glass-card flex flex-col gap-3 border-red-500/40 bg-red-900/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-orange-400" />
              <div>
                <p className="font-semibold text-red-300">
                  お支払いに失敗しました
                </p>
                <p className="text-sm text-red-300/70">
                  サービスを継続するために、支払方法を更新してください。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenPortal}
                disabled={portalMutation.isPending}
                className="gradient-btn rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                支払方法を更新
              </button>
              <button
                onClick={handleOpenPortal}
                disabled={portalMutation.isPending}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/30"
              >
                再試行する
              </button>
            </div>
          </div>
        )}

        {/* No Plan Alert */}
        {!subLoading && !subscription && (
          <div className="glass-card flex flex-col gap-3 border-blue-500/30 bg-blue-900/15 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 shrink-0 text-blue-400" />
              <div>
                <p className="font-semibold text-blue-300">
                  プランが選択されていません
                </p>
                <p className="text-sm text-blue-300/70">
                  プランを選択して、すべての機能をお使いください。
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="gradient-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              プランを選択
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan Card */}
          {subscription && (
            <div className="glass-card space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">現在のプラン</h2>
              </div>
              <div>
                <p className="gradient-text text-2xl font-bold">{planName}</p>
                {planPrice != null && (
                  <p className="mt-1 text-sm text-purple-300/70">
                    &yen;{planPrice.toLocaleString()} / 月
                  </p>
                )}
                {subscription.currentPeriodEnd && (
                  <p className="mt-2 text-xs text-purple-400/60">
                    次回更新日:{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "ja-JP"
                    )}
                  </p>
                )}
              </div>
              {/* Monthly usage bar */}
              {monthlyUsage && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-purple-300/70">
                    <span>今月の生成回数</span>
                    <span className={monthlyUsage.remaining === 0 ? "font-semibold text-red-400" : "font-semibold text-white"}>
                      {monthlyUsage.used} / {monthlyUsage.limit} 回
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        monthlyUsage.used / monthlyUsage.limit >= 0.9
                          ? "bg-red-500"
                          : monthlyUsage.used / monthlyUsage.limit >= 0.7
                            ? "bg-yellow-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{ width: `${Math.min(100, (monthlyUsage.used / monthlyUsage.limit) * 100)}%` }}
                    />
                  </div>
                  {monthlyUsage.remaining === 0 && (
                    <p className="text-xs text-red-400">上限に達しました。プランをアップグレードしてください。</p>
                  )}
                  {monthlyUsage.remaining > 0 && monthlyUsage.remaining <= 5 && (
                    <p className="text-xs text-yellow-400">残り{monthlyUsage.remaining}回です。</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-3 py-2 text-sm text-purple-300 transition hover:bg-purple-900/30"
                >
                  <Settings className="h-4 w-4" />
                  プラン変更
                </Link>
                <Link
                  href="/payment/history"
                  className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-3 py-2 text-sm text-purple-300 transition hover:bg-purple-900/30"
                >
                  <FileText className="h-4 w-4" />
                  決済履歴
                </Link>
              </div>
            </div>
          )}

          {/* Plan Features Card */}
          {limits && (
            <div className="glass-card space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">
                  プラン機能・上限
                </h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between text-purple-200">
                  <span>質問数上限</span>
                  <span className="font-semibold text-white">
                    {limits.maxQuestionsCount ?? "無制限"}
                  </span>
                </li>
                {limits.canSelectPurpose !== undefined && (
                  <li className="flex items-center justify-between text-purple-200">
                    <span>目的選択</span>
                    <span
                      className={
                        limits.canSelectPurpose
                          ? "font-semibold text-green-400"
                          : "text-purple-500"
                      }
                    >
                      {limits.canSelectPurpose ? "利用可能" : "利用不可"}
                    </span>
                  </li>
                )}
                {limits.canSelectTone !== undefined && (
                  <li className="flex items-center justify-between text-purple-200">
                    <span>トーン選択</span>
                    <span
                      className={
                        limits.canSelectTone
                          ? "font-semibold text-green-400"
                          : "text-purple-500"
                      }
                    >
                      {limits.canSelectTone ? "利用可能" : "利用不可"}
                    </span>
                  </li>
                )}
                {limits.canCustomizeQuestions !== undefined && (
                  <li className="flex items-center justify-between text-purple-200">
                    <span>カスタム質問</span>
                    <span
                      className={
                        limits.canCustomizeQuestions
                          ? "font-semibold text-green-400"
                          : "text-purple-500"
                      }
                    >
                      {limits.canCustomizeQuestions ? "利用可能" : "利用不可"}
                    </span>
                  </li>
                )}
                {limits.canUseFreeText !== undefined && (
                  <li className="flex items-center justify-between text-purple-200">
                    <span>フリーテキスト入力</span>
                    <span
                      className={
                        limits.canUseFreeText
                          ? "font-semibold text-green-400"
                          : "text-purple-500"
                      }
                    >
                      {limits.canUseFreeText ? "利用可能" : "利用不可"}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card space-y-4 p-6">
          <h2 className="text-lg font-bold text-white">クイックアクション</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/generate"
              className="gradient-btn inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
            >
              <Sparkles className="h-5 w-5" />
              口コミを生成する
            </Link>
            {planKey === "premium" && (
              <Link
                href="/custom-questions"
                className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-900/20 px-5 py-3 font-medium text-purple-300 transition hover:bg-purple-900/40"
              >
                <Settings className="h-5 w-5" />
                カスタム質問管理
              </Link>
            )}
          </div>
        </div>

        {/* Recent Review History */}
        {recentHistory.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">最近の生成履歴</h2>
            <div className="space-y-3">
              {recentHistory.map((item: any) => (
                <div key={item.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-purple-500/20 px-3 py-0.5 text-xs font-medium text-purple-300">
                      {item.industry}
                    </span>
                    <span className="text-xs text-purple-400/60">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-purple-200/80">
                    {item.generatedReview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
