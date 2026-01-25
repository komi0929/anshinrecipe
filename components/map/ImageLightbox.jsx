"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

/**
 * 画像ライトボックスコンポーネント（92件改善 Phase3）
 * 3.13 レビュー画像ライトボックス実装
 */
export const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-xl max-w-[90vw] overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? "border-white scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * クリック可能な画像サムネイル（ライトボックス連携）
 */
export const ImageThumbnail = ({
  src,
  alt = "",
  images = [],
  index = 0,
  className = "",
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const allImages = images.length > 0 ? images : [src];

  return (
    <>
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={() => setShowLightbox(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn
            size={24}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
      {showLightbox && (
        <ImageLightbox
          images={allImages}
          initialIndex={index}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
};

export default ImageLightbox;
