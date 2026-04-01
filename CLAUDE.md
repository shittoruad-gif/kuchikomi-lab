# クチコミラボ - AI口コミ生成SaaS

## ビジネスモデル
**SaaS運営モデル**: 運営者（開発者）がサーバーを自前で運営し、エンドユーザーに月額サブスクリプションを販売する形態。
- 運営者が `.env` にAPIキー（OpenAI・Stripe・DB）を設定してサーバーを運営
- エンドユーザーはOAuth認証でアカウント作成し、Stripeで月額プランを購入
- OpenAI API費用は運営者負担（コスト管理が重要）
- Stripe売上は運営者のStripeアカウントに蓄積

## 技術スタック
- フロントエンド: React 19 + TypeScript + Tailwind CSS 4 + Wouter
- バックエンド: Express 4 + tRPC 11
- データベース: MySQL (Drizzle ORM)
- 認証: OAuth + JWT セッションCookie
- 決済: Stripe (サブスクリプション)
- AI: OpenAI API (GPT-4o-mini)

## 開発コマンド
- `pnpm dev` - 開発サーバー起動 (port 3000)
- `pnpm build` - 本番ビルド
- `pnpm start` - 本番サーバー起動
- `pnpm check` - TypeScript型チェック
- `pnpm db:push` - DBマイグレーション実行

## セットアップ手順（運営者向け）
1. `cp .env.example .env` で環境変数ファイルを作成
2. `.env` に各APIキー・DB接続情報を設定（運営者自身のキーを使用）
3. `pnpm install` で依存関係インストール
4. `pnpm db:push` でDBテーブル作成
5. `pnpm dev` で開発サーバー起動（本番は `pnpm build && pnpm start`）

## ディレクトリ構成
- `client/src/pages/` - 全11ページ (Home, Pricing, Trial, Dashboard, Generate, CustomQuestions, PaymentSuccess, PaymentHistory, Admin, Terms, Privacy)
- `server/_core/` - Express/tRPC/認証の基盤コード
- `server/routers.ts` - tRPC APIルーター (auth, subscription, review, customQuestions, payment, admin)
- `server/products.ts` - Stripe プラン定義・機能制限
- `server/webhooks.ts` - Stripe Webhookハンドラー
- `server/receipt.ts` - PDF領収書生成
- `drizzle/schema.ts` - DBスキーマ (5テーブル)
- `shared/const.ts` - 共有定数 (プラン名, 価格, 業種リスト)

## Stripe設定
1. Stripeダッシュボードで3つのサブスクリプション商品を作成 (LIGHT ¥980/月, STANDARD ¥1,980/月, PREMIUM ¥4,980/月)
2. 各商品のPrice IDを .env に設定
3. Webhook URLを `https://your-domain.com/api/stripe/webhook` に設定
4. Webhookイベント: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated, customer.subscription.deleted

## 管理者設定
- DBの `users` テーブルで `role = 'admin'` に設定したユーザーが `/admin` にアクセス可能
- 管理画面: プラン別ユーザー数・月次売上（概算）確認、ユーザーのプラン手動変更

## 注意事項
- Stripe Webhookは `express.raw()` が `express.json()` より先に登録される必要あり（server/_core/index.tsで対応済み）
- DB/Stripe/OpenAI接続は遅延初期化のため、環境変数未設定でもサーバーは起動する
- 認証はOAuth対応。OAuthサーバーURLを設定すればGoogle/GitHub等で認証可能
- OpenAIコスト管理: GPT-4o-mini使用、1回生成あたり約0.001〜0.003ドル程度
