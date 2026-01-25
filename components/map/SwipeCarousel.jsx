"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

/**
 * タッチスワイプ対応カルーセル（92件改善 Phase3）
 * 3.10 画像カルーセルスワイプ実装
 */

export const SwipeCarousel = ({
  images = [],
  className = "",
  showThumbnails = false,
  enableLightbox = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goTo = (index) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  const goNext = () => goTo(currentIndex + 1);
  const goPrev = () => goTo(currentIndex - 1);

  if (images.length === 0) {
    return (
      <div
        className={`bg-slate-100 flex items-center justify-center ${className}`}
      >
        <span className="text-slate-400 text-sm">画像なし</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image Container */}
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((img, i) => (
              <div key={i} className="w-full h-full flex-shrink-0 relative">
                <img
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover"
                  onClick={() => enableLightbox && setShowLightbox(true)}
                />
                {enableLightbox && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center">
                    <ZoomIn
                      size={32}
                      className="text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === currentIndex
                  ? "border-orange-500 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <img
            src={images[currentIndex]}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SwipeCarousel;
