"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";

/**
 * トースト通知コンポーネント（92件改善 Phase5）
 * 5.16-5.20 UX改善: フィードバック通知
 */

// トースト状態管理
let toastId = 0;
const listeners = new Set();
let toasts = [];

const emit = () => listeners.forEach((listener) => listener(toasts));

export const toast = {
  show: (message, options = {}) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration || 3000,
      ...options,
    };
    toasts = [...toasts, newToast];
    emit();

    if (newToast.duration > 0) {
      setTimeout(() => toast.dismiss(id), newToast.duration);
    }
    return id;
  },
  success: (message, options) =>
    toast.show(message, { ...options, type: "success" }),
  error: (message, options) =>
    toast.show(message, { ...options, type: "error" }),
  warning: (message, options) =>
    toast.show(message, { ...options, type: "warning" }),
  info: (message, options) => toast.show(message, { ...options, type: "info" }),
  dismiss: (id) => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
  dismissAll: () => {
    toasts = [];
    emit();
  },
};

// トーストアイテム
const ToastItem = ({ toast: t, onDismiss }) => {
  const configs = {
    success: {
      icon: CheckCircle,
      bg: "bg-green-500",
      border: "border-green-400",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-500",
      border: "border-red-400",
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-amber-500",
      border: "border-amber-400",
    },
    info: {
      icon: Info,
      bg: "bg-blue-500",
      border: "border-blue-400",
    },
  };

  const config = configs[t.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${config.bg} text-white rounded-xl shadow-lg animate-slideIn`}
      role="alert"
    >
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// トーストコンテナ
export const ToastContainer = ({ position = "top-center" }) => {
  const [currentToasts, setCurrentToasts] = useState([]);

  useEffect(() => {
    const listener = (newToasts) => setCurrentToasts([...newToasts]);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const positionClasses = {
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-20 right-4",
  };

  if (currentToasts.length === 0) return null;

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] space-y-2 w-full max-w-sm px-4`}
    >
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={toast.dismiss} />
      ))}
    </div>
  );
};

// 確認ダイアログ
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "確認",
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  type = "warning", // 'warning' | 'danger' | 'info'
}) => {
  if (!open) return null;

  const typeClasses = {
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div
            className={`w-14 h-14 ${typeClasses[type]} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <AlertCircle size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-center text-slate-800 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 text-center">{message}</p>
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 ${typeClasses[type]} text-white rounded-xl font-bold`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default { toast, ToastContainer, ConfirmDialog };
