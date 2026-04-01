import { Link } from "wouter";
import { ArrowLeft, Download, FileText, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PLAN_NAMES } from "@shared/const";
import SEOHelmet from "@/components/SEOHelmet";

export default function PaymentHistory() {
  const { data: payments, isLoading } = trpc.payment.history.useQuery();
  const downloadMutation = trpc.payment.downloadReceipt.useMutation();

  const handleDownloadReceipt = async (paymentId: number) => {
    const result = await downloadMutation.mutateAsync({ paymentId });
    const byteCharacters = atob(result.pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="決済履歴" />

      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-purple-400" />
          決済履歴
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : !payments?.length ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">決済履歴がありません</h3>
            <p className="text-white/50 mb-6">プランに加入すると、ここに決済履歴が表示されます</p>
            <Link href="/pricing" className="gradient-btn px-6 py-2 rounded-lg inline-block">
              プランを選ぶ
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-medium text-white/60">日付</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-white/60">プラン</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-white/60">金額</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-white/60">ステータス</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-white/60">領収書</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-sm">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("ja-JP") : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {PLAN_NAMES[payment.plan as keyof typeof PLAN_NAMES]}
                    </td>
                    <td className="px-6 py-4 text-sm">¥{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "succeeded"
                            ? "bg-green-500/20 text-green-300"
                            : payment.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {payment.status === "succeeded" ? "完了" : payment.status === "pending" ? "処理中" : "失敗"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === "succeeded" && (
                        <button
                          onClick={() => handleDownloadReceipt(payment.id)}
                          disabled={downloadMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
