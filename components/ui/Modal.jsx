"use client";

import React from "react";
import { X } from "lucide-react";

/**
 * 共通モーダルコンポーネント（92件改善 Phase5）
 * 5.29-5.31 UX改善: モーダル・オーバーレイ
 */

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md", // 'sm' | 'md' | 'lg' | 'full'
  showClose = true,
  closeOnOverlay = true,
}) => {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-full mx-4",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-3xl w-full ${sizeClasses[size]} shadow-2xl animate-scaleIn overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            {title && (
              <h2 className="font-bold text-lg text-slate-800">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ボトムシート
export const BottomSheet = ({
  open,
  onClose,
  title,
  children,
  height = "auto", // 'auto' | 'half' | 'full'
}) => {
  if (!open) return null;

  const heightClasses = {
    auto: "max-h-[80vh]",
    half: "h-[50vh]",
    full: "h-[90vh]",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl ${heightClasses[height]} animate-slideUp overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-800 text-center">
              {title}
            </h2>
          </div>
        )}

        {/* Body */}
        <div
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100% - 60px)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// ドロワー（サイドメニュー）
export const Drawer = ({
  open,
  onClose,
  children,
  position = "left", // 'left' | 'right'
}) => {
  if (!open) return null;

  const positionClasses = {
    left: "left-0 animate-slideInLeft",
    right: "right-0 animate-slideInRight",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`absolute top-0 ${positionClasses[position]} bottom-0 w-80 max-w-[80vw] bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default { Modal, BottomSheet, Drawer };
