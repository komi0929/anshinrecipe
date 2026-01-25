"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Star,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

/**
 * レビュー編集・削除コンポーネント（92件改善 Phase3）
 * 3.15 レビュー編集機能実装
 * 3.16 レビュー削除機能実装
 */

export const ReviewItem = ({ review, onUpdate, onDelete }) => {
  const { user } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(review.content || "");
  const [editRating, setEditRating] = useState(review.rating || 5);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === review.user_id;

  const handleSave = async () => {
    if (!editContent.trim()) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("reviews")
      .update({
        content: editContent.trim(),
        rating: editRating,
        updated_at: new Date().toISOString(),
      })
      .eq("id", review.id)
      .select()
      .single();

    if (!error && data) {
      onUpdate?.(data);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", review.id);

    if (!error) {
      onDelete?.(review.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            {review.profiles?.avatar_url ? (
              <img
                src={review.profiles.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-400 text-xs font-bold">
                {(review.profiles?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 text-sm">
                {review.is_anonymous
                  ? "匿名ユーザー"
                  : review.profiles?.username || "ゲストユーザー"}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(
                  review.visit_date || review.created_at,
                ).toLocaleDateString()}
              </span>
              {review.updated_at && review.updated_at !== review.created_at && (
                <span className="text-[10px] text-slate-400">(編集済み)</span>
              )}
            </div>
            {/* Rating */}
            {isEditing ? (
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setEditRating(i)}>
                    <Star
                      size={16}
                      fill={i <= editRating ? "#FBBF24" : "none"}
                      className={
                        i <= editRating ? "text-amber-400" : "text-slate-200"
                      }
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < review.rating ? "#FBBF24" : "none"}
                    className={
                      i < review.rating ? "text-amber-400" : "text-slate-200"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit/Delete Actions */}
        {isOwner && !isEditing && (
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="編集"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="削除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 min-h-[100px] resize-none"
            placeholder="口コミを入力..."
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(review.content);
                setEditRating(review.rating);
              }}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm flex items-center gap-1"
            >
              <X size={14} /> キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editContent.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {review.content}
          </p>
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-24 h-24 object-cover rounded-lg border border-slate-100 flex-shrink-0"
              alt="Review"
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">削除の確認</h3>
                <p className="text-sm text-slate-500">
                  この操作は取り消せません
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              この口コミを削除してもよろしいですか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
