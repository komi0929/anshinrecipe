"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

const QuickSaveContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: profileLoading } = useProfile();
  const [status, setStatus] = useState("saving"); // 'saving' | 'success' | 'error'
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || profileLoading) return;

    const saveRecipe = async () => {
      try {
        const url = searchParams.get("url");
        if (!url) {
          setStatus("error");
          setError("URLが指定されていません");
          return;
        }

        if (!user) {
          // Store attempt and redirect
          localStorage.setItem("pendingQuickSave", url);
          router.push("/login?redirect=/recipe/quick-save");
          return;
        }

        // Simulate save process (replace with actual logic)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err.message);
      }
    };

    saveRecipe();
  }, [searchParams, user, profileLoading, isMounted, router]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-sm text-center">
        {status === "saving" && (
          <>
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">レシピを保存中...</h2>
            <p className="text-sm text-slate-500">外部サイトから情報を取得しています</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">保存しました！</h2>
            <p className="text-sm text-slate-500 mb-6">マイレシピに追加されました</p>
            <button onClick={() => router.push("/")} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
              レシピ一覧へ
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">保存に失敗しました</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button onClick={() => router.push("/")} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">
              ホームへ戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default function QuickSavePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <QuickSaveContent />
    </Suspense>
  );
}