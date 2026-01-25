"use client";

import React from "react";

/**
 * レスポンシブユーティリティ（92件改善 Phase5）
 * 5.56-5.58 レスポンシブ対応
 */

// レスポンシブコンテナ
export const Container = ({
  children,
  maxWidth = "lg",
  padding = true,
  className = "",
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <div
      className={`mx-auto ${maxWidthClasses[maxWidth]} ${padding ? "px-4" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

// デバイス別表示制御
export const Show = ({ children, on }) => {
  const breakpoints = {
    mobile: "block sm:hidden",
    tablet: "hidden sm:block lg:hidden",
    desktop: "hidden lg:block",
    "mobile-tablet": "block lg:hidden",
    "tablet-desktop": "hidden sm:block",
  };

  return <div className={breakpoints[on] || ""}>{children}</div>;
};

// グリッドレイアウト
export const Grid = ({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 4,
  className = "",
}) => {
  const colClasses = [
    `grid-cols-${cols.default || 1}`,
    cols.sm ? `sm:grid-cols-${cols.sm}` : "",
    cols.md ? `md:grid-cols-${cols.md}` : "",
    cols.lg ? `lg:grid-cols-${cols.lg}` : "",
    cols.xl ? `xl:grid-cols-${cols.xl}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid gap-${gap} ${colClasses} ${className}`}>
      {children}
    </div>
  );
};

// フレックスボックス
export const Flex = ({
  children,
  direction = "row",
  justify = "start",
  align = "start",
  wrap = false,
  gap = 0,
  className = "",
}) => {
  const directionClasses = {
    row: "flex-row",
    col: "flex-col",
    "row-reverse": "flex-row-reverse",
    "col-reverse": "flex-col-reverse",
  };

  const justifyClasses = {
    start: "justify-start",
    end: "justify-end",
    center: "justify-center",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  const alignClasses = {
    start: "items-start",
    end: "items-end",
    center: "items-center",
    baseline: "items-baseline",
    stretch: "items-stretch",
  };

  return (
    <div
      className={`flex ${directionClasses[direction]} ${justifyClasses[justify]} ${alignClasses[align]} ${wrap ? "flex-wrap" : ""} gap-${gap} ${className}`}
    >
      {children}
    </div>
  );
};

// スペーサー
export const Spacer = ({ size = 4, axis = "vertical" }) => {
  const sizeClasses = {
    1: axis === "vertical" ? "h-1" : "w-1",
    2: axis === "vertical" ? "h-2" : "w-2",
    4: axis === "vertical" ? "h-4" : "w-4",
    6: axis === "vertical" ? "h-6" : "w-6",
    8: axis === "vertical" ? "h-8" : "w-8",
    12: axis === "vertical" ? "h-12" : "w-12",
    16: axis === "vertical" ? "h-16" : "w-16",
  };

  return <div className={sizeClasses[size]} />;
};

// ディバイダー
export const Divider = ({
  orientation = "horizontal",
  spacing = 4,
  className = "",
}) => {
  if (orientation === "vertical") {
    return <div className={`w-px bg-slate-200 mx-${spacing} ${className}`} />;
  }
  return <hr className={`border-slate-200 my-${spacing} ${className}`} />;
};

export default { Container, Show, Grid, Flex, Spacer, Divider };
