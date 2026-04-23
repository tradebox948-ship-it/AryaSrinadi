import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, ImageIcon, Book, X } from 'lucide-react';

export function NotificationToast({ partnership, user }: any) {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const currentUserName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
    if (partnership?.lastUpdate && partnership.lastUpdateBy !== currentUserName) {
      const msg = partnership.lastUpdateType === 'memory' 
        ? `${partnership.lastUpdateBy} shared a new memory!` 
        : `${partnership.lastUpdateBy} wrote a new journal entry!`;
      
      setNotification({
        message: msg,
        type: partnership.lastUpdateType
      });
      setShow(true);

      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [partnership?.lastUpdate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, x: 100, y: 0 }} 
          animate={{ opacity: 1, x: 0, y: 0 }} 
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-8 right-8 z-[100] w-full max-w-sm"
        >
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-stone-100 flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${notification.type === 'memory' ? 'bg-rose-50 text-rose-500' : 'bg-stone-100 text-stone-600'}`}>
              {notification.type === 'memory' ? <ImageIcon className="w-5 h-5" /> : <Book className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-stone-800 text-sm">New Update</h4>
              <p className="text-stone-500 text-xs mt-1">{notification.message}</p>
            </div>
            <button onClick={() => setShow(false)} className="text-stone-300 hover:text-stone-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
