"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Store,
  BadgeCheck,
} from "lucide-react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  // Check auth and fetch invitation
  useEffect(() => {
    const init = async () => {
      if (!token) {
        setError("招待トークンがありません");
        setLoading(false);
        return;
      }

      try {
        // Check auth
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch invitation
        const response = await fetch(`/api/invitations?token=${token}`);
        const data = await response.json();

        if (!data.success) {
          if (data.expired) {
            setError(
              "この招待リンクは有効期限が切れています。再度リクエストをお送りください。",
            );
          } else if (data.alreadyUsed) {
            setError("この招待リンクは既に使用されています。");
          } else {
            setError(data.error || "無効な招待リンクです");
          }
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        console.error("Init error:", err);
        setError("エラーが発生しました。もう一度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // Handle accept
  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/owner/accept?token=${token}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to owner dashboard after delay
        setTimeout(() => {
          router.push(`/owner/${data.restaurantId}`);
        }, 3000);
      } else {
        setError(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error("Accept error:", err);
      setError("エラーが発生しました");
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="text-orange-500 animate-spin mx-auto mb-4"
          />
          <p className="text-slate-500 font-bold">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            🎉 オーナー登録完了！
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            おめでとうございます！
            <br />
            これで店舗情報を自由に編集できます。
          </p>
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center gap-3 justify-center">
            <BadgeCheck size={24} className="text-blue-500" />
            <span className="font-bold text-blue-600">
              公認バッジが付与されました
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            管理画面へ自動的に移動します...
          </p>
          <Loader2 size={24} className="text-orange-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Main accept flow
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            オーナー登録のご招待
          </h1>
          <p className="text-slate-500 text-sm">
            あんしんマップでお店の情報を管理しませんか？
          </p>
        </div>

        {/* Restaurant Info */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-6">
          <p className="text-xs text-slate-500 mb-2">対象店舗</p>
          <p className="font-bold text-xl text-slate-800">
            {invitation?.restaurantName}
          </p>
          {invitation?.restaurant?.address && (
            <p className="text-sm text-slate-500 mt-1">
              {invitation.restaurant.address}
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="mb-8">
          <p className="font-bold text-sm text-slate-800 mb-3">
            オーナー登録のメリット
          </p>
          <div className="space-y-3">
            {[
              "公認バッチが付与され、信頼性がアップ",
              "メニュー・アレルギー情報を自由に編集",
              "マップ上で優先表示される",
              "すべて無料でご利用可能",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">
                  ✓
                </div>
                <span className="text-sm text-slate-600">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Notice */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">
              オーナー登録にはログインが必要です。
              <br />
              「登録する」ボタンをクリックするとログイン画面に移動します。
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              登録中...
            </>
          ) : (
            <>
              <BadgeCheck size={20} />
              オーナー登録する（無料）
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-[10px] text-slate-400 text-center mt-6">
          登録することで、サービス利用規約に同意したことになります。
        </p>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2
          size={48}
          className="text-orange-500 animate-spin mx-auto mb-4"
        />
        <p className="text-slate-500 font-bold">読み込み中...</p>
      </div>
    </div>
  );
}

// Default export wrapped in Suspense for useSearchParams
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
