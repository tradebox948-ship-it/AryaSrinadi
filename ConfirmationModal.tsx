import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batalkan',
  variant = 'primary'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#141210] border border-accent-border rounded-sm p-8 shadow-3xl text-center"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 ${
              variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-gold/10 text-gold'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl text-gold italic mb-2">{title}</h3>
            <p className="text-zinc-500 text-xs font-light leading-relaxed mb-8 uppercase tracking-widest leading-loose">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-zinc-600 uppercase tracking-widest text-[9px] hover:text-zinc-400 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-[1.5] py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-[9px] transition-all shadow-xl flex items-center justify-center gap-2 ${
                  variant === 'danger' 
                    ? 'bg-red-500/80 text-white hover:bg-red-500' 
                    : 'bg-gold text-[#0f0e0d] hover:bg-gold/90'
                }`}
              >
                <Check className="w-3.5 h-3.5" /> {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
