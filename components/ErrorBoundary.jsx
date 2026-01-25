"use client";

import React, { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * エラーバウンダリコンポーネント（92件改善 Phase5）
 * 5.81-5.82 エラーハンドリング改善
 */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // エラーログ送信（必要に応じて実装）
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // 外部エラートラッキングサービスへ送信する場合
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが指定されている場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            {this.props.message ||
              "予期しないエラーが発生しました。ページを更新するか、ホームに戻ってください。"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
            >
              <RefreshCw size={16} />
              再試行
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
            >
              <Home size={16} />
              ホームへ
            </Link>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-xs text-slate-400 cursor-pointer">
                デバッグ情報
              </summary>
              <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC版エラーバウンダリ
export const withErrorBoundary = (Component, options = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Suspense + ErrorBoundary統合
export const AsyncBoundary = ({ children, loading, error, onReset }) => {
  return (
    <ErrorBoundary fallback={error} onReset={onReset}>
      <React.Suspense fallback={loading || <DefaultLoading />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

const DefaultLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

export default ErrorBoundary;
