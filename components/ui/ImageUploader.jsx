"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Image as ImageIcon, Upload } from "lucide-react";

/**
 * 画像アップロードコンポーネント（92件改善 Phase5）
 * 5.78-5.80 フォーム改善
 */

export const ImageUploader = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = "image/*",
  variant = "grid", // 'grid' | 'single' | 'compact'
}) => {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // URL形式の既存画像用
    const existingPreviews = value.filter((v) => typeof v === "string");
    // File形式の新規画像用
    const newFiles = value.filter((v) => v instanceof File);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setPreviews([...existingPreviews, ...newPreviews]);

    return () => {
      newPreviews.forEach(URL.revokeObjectURL);
    };
  }, [value]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // ファイル数チェック
    if (value.length + files.length > maxFiles) {
      setError(`最大${maxFiles}枚まで`);
      return;
    }

    // サイズチェック
    const oversized = files.find((f) => f.size > maxSize);
    if (oversized) {
      setError(`ファイルサイズは${maxSize / 1024 / 1024}MBまで`);
      return;
    }

    onChange?.([...value, ...files]);
    e.target.value = "";
  };

  const handleRemove = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange?.(newValue);
  };

  if (variant === "single") {
    const preview = previews[0];
    return (
      <div className="space-y-2">
        <div
          onClick={handleClick}
          className={`relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors ${
            preview
              ? "border-transparent"
              : "border-slate-300 hover:border-orange-300 bg-slate-50"
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(0);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <Upload size={32} className="mb-2" />
              <span className="text-sm">画像を選択</span>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {previews.map((preview, i) => (
          <div
            key={i}
            className="relative w-12 h-12 rounded-lg overflow-hidden"
          >
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemove(i)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <button
            onClick={handleClick}
            className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-500"
          >
            <Plus size={20} />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  // grid variant
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {previews.map((preview, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden"
          >
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <button
            onClick={handleClick}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
          >
            <ImageIcon size={24} className="mb-1" />
            <span className="text-xs">
              {value.length}/{maxFiles}
            </span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
