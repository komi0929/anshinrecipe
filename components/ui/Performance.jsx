"use client";

import React, { useState, useEffect, useCallback, memo } from "react";

/**
 * パフォーマンス最適化コンポーネント（92件改善 Phase5）
 * 5.43-5.47 パフォーマンス最適化
 */

// 遅延読み込み画像
export const LazyImage = memo(
  ({
    src,
    alt = "",
    className = "",
    placeholder = "/images/placeholder.jpg",
    onLoad,
    onError,
  }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [imgSrc, setImgSrc] = useState(placeholder);

    useEffect(() => {
      if (!src) return;

      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setError(true);
        onError?.();
      };
    }, [src, onLoad, onError]);

    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={error ? placeholder : imgSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
        />
        {!loaded && !error && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
      </div>
    );
  },
);
LazyImage.displayName = "LazyImage";

// 無限スクロール
export const InfiniteScroll = ({
  children,
  onLoadMore,
  hasMore = true,
  loading = false,
  threshold = 200,
}) => {
  const containerRef = React.useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        onLoadMore?.();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, threshold, onLoadMore]);

  return (
    <div ref={containerRef}>
      {children}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}
      {!hasMore && (
        <div className="text-center text-sm text-slate-400 py-4">
          すべて読み込みました
        </div>
      )}
    </div>
  );
};

// 仮想リスト（大量データ用）
export const VirtualList = ({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
  overscan = 3,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = React.useRef(null);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: "auto" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// デバウンス付き検索入力
export const DebouncedSearch = memo(
  ({ onSearch, delay = 300, placeholder = "検索...", className = "" }) => {
    const [value, setValue] = useState("");
    const timeoutRef = React.useRef(null);

    const handleChange = (e) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, delay);
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 ${className}`}
      />
    );
  },
);
DebouncedSearch.displayName = "DebouncedSearch";

// コンポーネントのメモ化ヘルパー
export const MemoizedComponent = memo;

export default {
  LazyImage,
  InfiniteScroll,
  VirtualList,
  DebouncedSearch,
  MemoizedComponent,
};
