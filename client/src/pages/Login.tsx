import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogIn } from "lucide-react";
import SEOHelmet from "@/components/SEOHelmet";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0f0520] via-[#1a0a30] to-[#0d0018]">
      <SEOHelmet title="ログイン | クチコミラボ" description="クチコミラボにログイン" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="gradient-text text-3xl font-bold cursor-pointer">
              クチコミラボ
            </h1>
          </Link>
          <p className="text-white/60 mt-2">アカウントにログイン</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="6文字以上"
                className="w-full rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full gradient-btn px-6 py-3.5 rounded-lg text-white font-semibold text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ログイン
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              アカウントをお持ちでないですか？{" "}
              <Link
                href="/register"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
