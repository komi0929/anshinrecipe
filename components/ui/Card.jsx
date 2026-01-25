"use client";

import React from "react";
import { User, Camera } from "lucide-react";

/**
 * 共通カード・アバターコンポーネント（92件改善 Phase5）
 * 5.51-5.55 UIコンポーネント追加
 */

// カードコンポーネント
export const Card = ({
  children,
  variant = "default", // 'default' | 'elevated' | 'outlined' | 'gradient'
  padding = "md",
  className = "",
  onClick,
  ...props
}) => {
  const variantClasses = {
    default: "bg-white border border-slate-100",
    elevated: "bg-white shadow-lg",
    outlined: "bg-transparent border-2 border-slate-200",
    gradient:
      "bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// カードヘッダー
export const CardHeader = ({ title, subtitle, action, icon: Icon }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-orange-600" />
        </div>
      )}
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// アバターコンポーネント
export const Avatar = ({
  src,
  alt = "",
  name,
  size = "md",
  status,
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const statusClasses = {
    online: "bg-green-500",
    offline: "bg-slate-300",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : name ? (
          <span className="font-bold text-orange-600">{initials}</span>
        ) : (
          <User className="text-orange-400" />
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusClasses[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

// アバターグループ
export const AvatarGroup = ({ avatars = [], max = 4, size = "sm" }) => {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

// アバターアップローダー
export const AvatarUploader = ({ src, onUpload, size = "xl" }) => {
  const inputRef = React.useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload?.(file);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar src={src} size={size} />
      <button
        onClick={handleClick}
        className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
      >
        <Camera size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default { Card, CardHeader, Avatar, AvatarGroup, AvatarUploader };
