"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";
import {
  Send,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Reply,
} from "lucide-react";

/**
 * コメント機能コンポーネント（92件改善 Phase3）
 * 3.2 コメント機能実装
 * review_comments テーブルを使用
 */
export const CommentSection = ({ reviewId, isOwner = false }) => {
  const { user, profile } = useProfile();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [reviewId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("review_comments")
      .select(
        `
                *,
                profiles:user_id ( id, username, avatar_url )
            `,
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (data) setComments(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("review_comments")
      .insert({
        review_id: reviewId,
        user_id: user.id,
        content: newComment.trim(),
        parent_comment_id: replyTo,
        is_owner_response: isOwner,
      })
      .select(
        `
                *,
                profiles:user_id ( id, username, avatar_url )
            `,
      )
      .single();

    if (data) {
      setComments([...comments, data]);
      setNewComment("");
      setReplyTo(null);
    }
    setSubmitting(false);
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from("review_comments")
      .update({
        content: editContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (!error) {
      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, content: editContent.trim() } : c,
        ),
      );
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm("このコメントを削除しますか？")) return;

    const { error } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment List */}
      {comments.length === 0 ? (
        <div className="text-center py-4 text-slate-400 text-sm">
          まだコメントはありません
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl ${
                comment.is_owner_response
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-slate-50"
              } ${comment.parent_comment_id ? "ml-6" : ""}`}
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  {comment.profiles?.avatar_url ? (
                    <img
                      src={comment.profiles.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {(comment.profiles?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-700">
                      {comment.profiles?.username || "ゲスト"}
                    </span>
                    {comment.is_owner_response && (
                      <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        オーナー
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {editingId === comment.id ? (
                    <div className="flex gap-2">
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleEdit(comment.id)}
                        className="text-blue-500 text-sm font-bold"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-slate-400 text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">{comment.content}</p>
                  )}
                </div>

                {user?.id === comment.user_id && !editingId && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? "返信を入力..." : "コメントを入力..."}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-1"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-3 bg-slate-50 rounded-xl text-sm text-slate-500">
          <a href="/login" className="text-orange-500 font-bold">
            ログイン
          </a>
          してコメントする
        </div>
      )}
    </div>
  );
};

export default CommentSection;
