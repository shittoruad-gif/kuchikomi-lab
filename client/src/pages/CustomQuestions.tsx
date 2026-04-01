import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Save, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import SEOHelmet from "@/components/SEOHelmet";

export default function CustomQuestions() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: questions, isLoading } = trpc.customQuestions.list.useQuery();
  const createMutation = trpc.customQuestions.create.useMutation({
    onSuccess: () => {
      utils.customQuestions.list.invalidate();
      setNewQuestion("");
      setShowAdd(false);
    },
  });
  const updateMutation = trpc.customQuestions.update.useMutation({
    onSuccess: () => {
      utils.customQuestions.list.invalidate();
      setEditingId(null);
    },
  });
  const deleteMutation = trpc.customQuestions.delete.useMutation({
    onSuccess: () => utils.customQuestions.list.invalidate(),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const handleCreate = () => {
    if (!newQuestion.trim()) return;
    createMutation.mutate({ questionText: newQuestion.trim() });
  };

  const handleUpdate = (id: number) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ id, questionText: editText.trim() });
  };

  const startEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <SEOHelmet title="カスタム質問管理" />

      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">カスタム質問管理</h1>
            <p className="text-white/50 mt-1">PREMIUMプラン限定 — 口コミ生成時の質問をカスタマイズ</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="gradient-btn px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="glass-card p-6 mb-6">
            <h3 className="font-medium mb-4">新しい質問を追加</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="質問文を入力..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="gradient-btn px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewQuestion(""); }}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Questions list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : !questions?.length ? (
          <div className="glass-card p-12 text-center">
            <p className="text-white/50 mb-4">カスタム質問がまだありません</p>
            <button onClick={() => setShowAdd(true)} className="gradient-btn px-6 py-2 rounded-lg inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              最初の質問を追加
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="glass-card p-4 flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-white/30 cursor-grab" />
                <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-medium text-purple-300">
                  {i + 1}
                </span>

                {editingId === q.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(q.id)}
                    />
                    <button onClick={() => handleUpdate(q.id)} className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-white/90">{q.questionText}</span>
                    <button onClick={() => startEdit(q.id, q.questionText)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: q.id })}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-white/30 text-sm mt-6 text-center">最大20問まで追加できます</p>
      </div>
    </div>
  );
}
