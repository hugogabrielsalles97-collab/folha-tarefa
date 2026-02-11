
import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

interface PhotoViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ images, currentIndex, onClose, onNavigate }) => {
  const totalImages = images.length;

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + totalImages) % totalImages;
    onNavigate(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % totalImages;
    onNavigate(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (totalImages > 1) {
        if (e.key === 'ArrowLeft') goToPrevious();
        if (e.key === 'ArrowRight') goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, totalImages, onClose]);


  if (!images || totalImages === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center backdrop-blur-lg p-4 animate-in fade-in"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/50 hover:text-neon-magenta transition-colors z-[110] p-2"
        aria-label="Fechar visualizador de imagem"
      >
        <CloseIcon />
      </button>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Previous Button */}
        {totalImages > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 p-4 bg-black/20 rounded-full text-white/50 hover:text-white hover:bg-black/50 transition-all z-[110]"
            aria-label="Imagem anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center p-8 sm:p-16">
          <img
            src={images[currentIndex]}
            alt={`Registro da tarefa ${currentIndex + 1} de ${totalImages}`}
            className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black"
          />
        </div>

        {/* Next Button */}
        {totalImages > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 p-4 bg-black/20 rounded-full text-white/50 hover:text-white hover:bg-black/50 transition-all z-[110]"
            aria-label="Próxima imagem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

       {/* Counter */}
       {totalImages > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-mono py-1 px-3 rounded-full">
           {currentIndex + 1} / {totalImages}
         </div>
       )}
    </div>
  );
};

export default PhotoViewer;
