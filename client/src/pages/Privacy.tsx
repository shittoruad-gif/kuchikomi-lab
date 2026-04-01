import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import SEOHelmet from "@/components/SEOHelmet";

export default function Privacy() {
  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="プライバシーポリシー" />
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>

        <div className="glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
          <div className="space-y-6 text-white/80 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. 収集する情報</h2>
              <p>本サービスでは、以下の情報を収集します。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>ユーザー名、メールアドレス（OAuth認証時）</li>
                <li>口コミ生成時の入力データ（業種、回答内容等）</li>
                <li>決済に関する情報（Stripeを通じて処理）</li>
                <li>サービス利用に関するログデータ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. 情報の利用目的</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>本サービスの提供・改善</li>
                <li>ユーザーサポートの提供</li>
                <li>利用料金の請求</li>
                <li>サービスに関する重要な通知の送信</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. 情報の第三者提供</h2>
              <p>当社は、法令に基づく場合を除き、ユーザーの個人情報を第三者に提供することはありません。ただし、以下のサービスをサービス提供のために利用しています。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Stripe（決済処理）</li>
                <li>OpenAI（AI口コミ生成）</li>
                <li>認証プロバイダー（ログイン認証）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. データの保管</h2>
              <p>ユーザーデータは適切なセキュリティ対策を施したサーバーに保管されます。口コミ生成データは、サービス改善および履歴参照のために保管されます。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. ユーザーの権利</h2>
              <p>ユーザーは、自己の個人情報について開示・訂正・削除を求めることができます。お問い合わせは本サービスのサポートまでご連絡ください。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Cookieの使用</h2>
              <p>本サービスでは、ログイン状態の維持のためにCookieを使用しています。Cookieの使用を拒否した場合、一部の機能が利用できなくなる可能性があります。</p>
            </section>

            <p className="text-white/50 pt-4">最終更新日: 2024年1月1日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
