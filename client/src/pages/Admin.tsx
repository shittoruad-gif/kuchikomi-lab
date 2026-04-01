import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, BarChart3, Settings, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PLAN_NAMES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

export default function Admin() {
  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery();
  const { data: stats } = trpc.admin.stats.useQuery();
  const changePlanMutation = trpc.admin.changePlan.useMutation({
    onSuccess: () => {
      trpc.useUtils().admin.users.invalidate();
    },
  });

  const [selectedPlan, setSelectedPlan] = useState<Record<number, string>>({});

  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="管理画面" />

      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Crown className="w-8 h-8 text-purple-400" />
          管理画面
        </h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "LIGHTプラン", value: stats.light, color: "text-blue-400", prefix: "" },
              { label: "STANDARDプラン", value: stats.standard, color: "text-purple-400", prefix: "" },
              { label: "PREMIUMプラン", value: stats.premium, color: "text-pink-400", prefix: "" },
              { label: "月次売上（概算）", value: stats.totalRevenue.toLocaleString("ja-JP"), color: "text-green-400", prefix: "¥" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-6">
                <p className="text-white/50 text-sm">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.prefix}{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="font-medium">ユーザー一覧</h2>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-white/50">
                    <th className="text-left px-6 py-3">ID</th>
                    <th className="text-left px-6 py-3">名前</th>
                    <th className="text-left px-6 py-3">メール</th>
                    <th className="text-left px-6 py-3">ロール</th>
                    <th className="text-left px-6 py-3">登録日</th>
                    <th className="text-left px-6 py-3">プラン変更</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 text-sm">
                      <td className="px-6 py-3 text-white/60">{user.id}</td>
                      <td className="px-6 py-3">{user.name ?? "-"}</td>
                      <td className="px-6 py-3 text-white/70">{user.email ?? "-"}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${user.role === "admin" ? "bg-purple-500/20 text-purple-300" : "bg-white/10 text-white/50"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-white/60">
                        {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPlan[user.id] ?? ""}
                            onChange={(e) => setSelectedPlan({ ...selectedPlan, [user.id]: e.target.value })}
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                          >
                            <option value="" className="bg-slate-900">選択</option>
                            <option value="light" className="bg-slate-900">LIGHT</option>
                            <option value="standard" className="bg-slate-900">STANDARD</option>
                            <option value="premium" className="bg-slate-900">PREMIUM</option>
                          </select>
                          <button
                            onClick={() => {
                              const plan = selectedPlan[user.id];
                              if (plan) {
                                changePlanMutation.mutate({ userId: user.id, plan: plan as any });
                              }
                            }}
                            disabled={!selectedPlan[user.id] || changePlanMutation.isPending}
                            className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs disabled:opacity-50"
                          >
                            変更
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
