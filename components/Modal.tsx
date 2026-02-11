
import React, { ReactNode } from 'react';
import { CloseIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex justify-center items-center backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-surface w-full max-w-4xl border-2 border-neon-cyan/50 shadow-[0_0_30px_rgba(0,243,255,0.2)] relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="corner-marker corner-tl"></div>
        <div className="corner-marker corner-tr"></div>
        <div className="corner-marker corner-bl"></div>
        <div className="corner-marker corner-br"></div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-neon-magenta transition-colors p-2"
        >
          <CloseIcon />
        </button>
        <div className="p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;