"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, Loader2, Reply, Check } from "lucide-react";

/**
 * オーナー返信機能（92件改善 Phase5）
 * 5.6-5.10 オーナー機能
 */

export const OwnerReply = ({
  reviewId,
  restaurantId,
  existingReply,
  onReplyAdded,
}) => {
  const [content, setContent] = useState(existingReply?.content || "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);

    // review_commentsテーブルにオーナー返信を追加
    const { data, error } = await supabase
      .from("review_comments")
      .upsert({
        id: existingReply?.id,
        review_id: reviewId,
        content: content.trim(),
        is_owner_response: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setSuccess(true);
      onReplyAdded?.(data);
      setTimeout(() => setSuccess(false), 2000);
    }

    setSubmitting(false);
  };

  return (
    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Reply size={16} className="text-blue-600" />
        <span className="font-bold text-sm text-blue-800">
          {existingReply ? "オーナー返信を編集" : "オーナーとして返信"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="口コミへのお礼や補足情報を入力..."
          className="w-full px-4 py-3 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 min-h-[80px] resize-none bg-white"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-blue-600">
            💡 返信はユーザーに通知されます
          </span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-colors ${
              success
                ? "bg-green-500 text-white"
                : "bg-blue-500 text-white disabled:opacity-50"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> 送信中
              </>
            ) : success ? (
              <>
                <Check size={14} /> 送信完了
              </>
            ) : (
              <>
                <Send size={14} /> 返信する
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerReply;
