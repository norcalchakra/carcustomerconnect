import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Add modal-open class to trigger defensive CSS
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
      // Remove modal-open class
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className={`comic-panel comic-panel-primary bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto ${
            size === 'sm' ? 'max-w-md' :
            size === 'md' ? 'max-w-lg' :
            size === 'lg' ? 'max-w-2xl' :
            'max-w-4xl'
          }`}
        >
          {/* Header with Speech Bubble */}
          <div className="relative p-4">
            <div className="speech-bubble speech-bubble-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-0">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center font-bold text-lg"
              style={{ zIndex: 100, pointerEvents: 'auto' }}
            >
              ×
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="px-6 pb-6" style={{ overflow: 'visible' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
