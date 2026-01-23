"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Send, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

/**
 * Invite Owner Button Component
 * Opens a modal to send invitation email to restaurant owner
 */
export function InviteOwnerButton({
  restaurantId,
  restaurantName,
  variant = "default",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { success: bool, message: string }

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      setResult({
        success: false,
        message: "有効なメールアドレスを入力してください",
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          targetEmail: email,
          inviterUserId: user?.id || null,
          inviterType: "user",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message:
            "招待メールを送信しました！オーナー様の登録をお待ちください。",
        });
        setEmail("");
      } else {
        setResult({
          success: false,
          message: data.error || "送信に失敗しました。もう一度お試しください。",
        });
      }
    } catch (error) {
      console.error("Invite error:", error);
      setResult({
        success: false,
        message: "エラーが発生しました。もう一度お試しください。",
      });
    } finally {
      setSending(false);
    }
  };

  const buttonVariants = {
    default:
      "px-4 py-2 bg-blue-500 text-white rounded-full font-bold text-xs shadow-lg hover:bg-blue-600",
    outline:
      "px-4 py-2 bg-transparent border border-blue-500 text-blue-500 rounded-full font-bold text-xs hover:bg-blue-50",
    text: "text-xs text-blue-500 underline hover:text-blue-600",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonVariants[variant] || buttonVariants.default}
      >
        <span className="flex items-center gap-2">
          <Mail size={14} />
          オーナーへリクエスト
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                オーナーへリクエスト
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Restaurant Info */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1">対象店舗</p>
              <p className="font-bold text-slate-800">{restaurantName}</p>
            </div>

            {/* Success State */}
            {result?.success && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-green-600 font-bold mb-2">送信完了！</p>
                <p className="text-sm text-slate-500">{result.message}</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setResult(null);
                  }}
                  className="mt-6 px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  閉じる
                </button>
              </div>
            )}

            {/* Form State */}
            {!result?.success && (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  店舗のメールアドレスを入力してください。
                  オーナー様に情報充実のリクエストをお送りします。
                </p>

                {/* Error Message */}
                {result?.success === false && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-600">{result.message}</p>
                  </div>
                )}

                {/* Email Input */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    店舗のメールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@restaurant.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={sending}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    ※ 店舗の公式サイトやGoogle
                    Mapsに記載されているメールアドレスをご使用ください
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setResult(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    disabled={sending}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !email}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        送信中...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        送信
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default InviteOwnerButton;
