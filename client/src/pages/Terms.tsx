import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import SEOHelmet from "@/components/SEOHelmet";

export default function Terms() {
  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="利用規約" />
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>

        <div className="glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-8">利用規約</h1>
          <div className="space-y-6 text-white/80 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第1条（適用）</h2>
              <p>本規約は、クチコミラボ（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第2条（サービス内容）</h2>
              <p>本サービスは、AIを活用した口コミ文の生成支援サービスです。生成された口コミ文の利用については、ユーザー自身の責任において行うものとします。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第3条（利用料金）</h2>
              <p>本サービスの利用にあたっては、選択したプランに応じた月額料金が発生します。料金はStripeを通じてクレジットカードにより決済されます。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第4条（禁止事項）</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>虚偽の口コミを投稿する行為</li>
                <li>他者の権利を侵害する行為</li>
                <li>法令に違反する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正アクセスまたはそれに類する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第5条（免責事項）</h2>
              <p>本サービスにより生成された口コミ文の内容について、当社は一切の責任を負いません。口コミの投稿及びその結果については、ユーザーの自己責任とします。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第6条（解約）</h2>
              <p>ユーザーはいつでもサブスクリプションを解約することができます。解約した場合、現在の請求期間の終了まではサービスを利用できます。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">第7条（規約の変更）</h2>
              <p>当社は、必要と判断した場合、ユーザーへの事前通知なく本規約を変更することがあります。変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。</p>
            </section>

            <p className="text-white/50 pt-4">最終更新日: 2024年1月1日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
