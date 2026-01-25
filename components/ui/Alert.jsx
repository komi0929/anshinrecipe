"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

/**
 * アラートコンポーネント（92件改善 Phase5）
 * 5.88-5.90 アラート・通知改善
 */

export const Alert = ({
  variant = "info", // 'info' | 'success' | 'warning' | 'error'
  title,
  children,
  closable = false,
  onClose,
  className = "",
}) => {
  const variantConfig = {
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconColor: "text-blue-500",
      titleColor: "text-blue-800",
      textColor: "text-blue-700",
    },
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      iconColor: "text-green-500",
      titleColor: "text-green-800",
      textColor: "text-green-700",
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-500",
      titleColor: "text-amber-800",
      textColor: "text-amber-700",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-500",
      titleColor: "text-red-800",
      textColor: "text-red-700",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          className={`${config.iconColor} flex-shrink-0 mt-0.5`}
        />
        <div className="flex-1">
          {title && (
            <h4 className={`font-bold ${config.titleColor} mb-1`}>{title}</h4>
          )}
          <div className={`text-sm ${config.textColor}`}>{children}</div>
        </div>
        {closable && (
          <button
            onClick={onClose}
            className={`${config.iconColor} hover:opacity-70 flex-shrink-0`}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// バナーアラート（画面上部固定用）
export const BannerAlert = ({
  variant = "info",
  children,
  action,
  actionLabel,
  onClose,
}) => {
  const variantConfig = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div className={`${variantConfig[variant]} text-white px-4 py-3`}>
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{children}</p>
        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={action}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30"
            >
              {actionLabel}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// インラインヒント
export const Hint = ({ children, variant = "default" }) => {
  const variantClasses = {
    default: "text-slate-500",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <p className={`text-xs ${variantClasses[variant]} flex items-start gap-1`}>
      <Info size={12} className="mt-0.5 flex-shrink-0" />
      {children}
    </p>
  );
};

export default { Alert, BannerAlert, Hint };
