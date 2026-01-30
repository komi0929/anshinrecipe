"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function LineCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        if (errorParam) {
          setError("LINE認証がキャンセルされました");
          setLoading(false);
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        if (!code) {
          throw new Error("認証コードが見つかりません");
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        // Success - redirect to home
        router.push("/");
      } catch (err) {
        console.error("Auth error:", err);
        setError("認証に失敗しました: " + err.message);
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, isMounted]);

  if (!isMounted) return null;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4 text-center">{error}</div>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          ログインへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
      <div className="text-slate-600">認証中...</div>
    </div>
  );
}

export default function LineCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <LineCallbackContent />
    </Suspense>
  );
}