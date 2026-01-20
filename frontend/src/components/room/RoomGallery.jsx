/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RoomGallery - Galerie de photos swipeable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function RoomGallery({ photos = [], roomId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const trackRef = useRef(null);

  const photoUrls = photos.map(p => p.url || p);

  const goToSlide = useCallback((index) => {
    if (index < 0) index = 0;
    if (index >= photoUrls.length) index = photoUrls.length - 1;
    setCurrentIndex(index);
  }, [photoUrls.length]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Touch handlers
  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentXRef.current - startXRef.current;
    const threshold = window.innerWidth * 0.2;

    if (diff > threshold && currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else if (diff < -threshold && currentIndex < photoUrls.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  // Mouse handlers (desktop)
  const handleMouseDown = (e) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    currentXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentXRef.current - startXRef.current;
    const threshold = window.innerWidth * 0.15;

    if (diff > threshold && currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else if (diff < -threshold && currentIndex < photoUrls.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  if (!photoUrls.length) {
    return (
      <div className="w-full h-full bg-primary-200 flex items-center justify-center">
        <span className="font-body text-primary-500">Aucune photo</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex h-full transition-transform duration-400 ease-elegant"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {photoUrls.map((url, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full"
          >
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-sm font-body text-sm">
        {currentIndex + 1} / {photoUrls.length}
      </div>

      {/* Progress Bars */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-1">
        {photoUrls.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={clsx(
              'flex-1 h-1 rounded-full transition-all duration-300',
              index <= currentIndex ? 'bg-white' : 'bg-white/30'
            )}
          />
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      {photoUrls.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className={clsx(
              'absolute left-4 top-1/2 -translate-y-1/2 z-10',
              'w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full',
              'flex items-center justify-center',
              'opacity-0 hover:opacity-100 transition-opacity duration-300',
              'hover:scale-110 active:scale-95',
              'hidden lg:flex',
              currentIndex === 0 && 'invisible'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className={clsx(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10',
              'w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full',
              'flex items-center justify-center',
              'opacity-0 hover:opacity-100 transition-opacity duration-300',
              'hover:scale-110 active:scale-95',
              'hidden lg:flex',
              currentIndex === photoUrls.length - 1 && 'invisible'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
