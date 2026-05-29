import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info'
}: ConfirmationModalProps) {
  // ==========================================
  // ESTILOS DINÂMICOS
  // ==========================================
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 shadow-red-600/20';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20';
      default:
        return 'sidebar-grad shadow-orange-600/20';
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Fundo Escurecido (Overlay) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Caixa do Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-[32px] max-w-sm w-full relative z-10 text-center shadow-2xl"
          >
            {/* Ícone de Alerta */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              variant === 'danger' ? 'bg-red-500/10 text-red-500' : 
              variant === 'warning' ? 'bg-orange-500/10 text-orange-500' : 
              'bg-orange-500/10 text-orange-500'
            }`}>
              <AlertCircle size={32} />
            </div>
            
            {/* Título e Mensagem */}
            <h3 className="text-2xl font-bold mb-4 font-display">{title}</h3>
            <p className="text-[var(--text-muted)] mb-8 font-medium leading-relaxed">{message}</p>
            
            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="py-3.5 rounded-2xl border border-[var(--border)] font-bold hover:bg-white/5 transition-all text-sm"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`py-3.5 rounded-2xl text-white font-bold transition-all shadow-lg text-sm ${getVariantStyles()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
