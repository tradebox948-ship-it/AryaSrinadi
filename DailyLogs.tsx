import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Trash2, Calendar, Send, X, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError } from '../lib/firebaseErrors';
import { ConfirmationModal } from './ConfirmationModal';
import { format } from 'date-fns';

export function DailyLogs({ partnership, user }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const q = query(
      collection(db, 'partnerships', partnership.id, 'logs'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, 'list', `partnerships/${partnership.id}/logs`);
    });
    return unsubscribe;
  }, [partnership.id]);

  const addLog = async () => {
    if (!content) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Simpan Catatan?',
      message: 'Apakah Anda ingin menyimpan cerita hari ini ke dalam jurnal abadi?',
      onConfirm: async () => {
        try {
          await addDoc(collection(db, 'partnerships', partnership.id, 'logs'), {
            content,
            date: logDate,
            timestamp: serverTimestamp(),
            createdBy: user.uid
          });
          // Update partnership to trigger notification
          await updateDoc(doc(db, 'partnerships', partnership.id), {
            lastUpdate: new Date().toISOString(),
            lastUpdateType: 'log',
            lastUpdateBy: user.displayName || user.email
          });
          setContent('');
          setIsAdding(false);
        } catch (e) {
          handleFirestoreError(e, 'create', `partnerships/${partnership.id}/logs`);
        }
      }
    });
  };

  const deleteLog = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Cerita?',
      message: 'Cerita ini akan dihapus dari sejarah perjalanan Anda. Lanjutkan?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'partnerships', partnership.id, 'logs', id));
        } catch (e) {
          handleFirestoreError(e, 'delete', `partnerships/${partnership.id}/logs/${id}`);
        }
      }
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-gold italic mb-2">Catatan Harian</h2>
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Journaling our journey, word by word</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-gold-outline w-full md:w-auto flex items-center justify-center gap-2"
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Cancel' : 'Tulis Cerita'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="card-sophisticated p-6 md:p-10"
          >
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <Calendar className="w-4 h-4 text-gold" />
              <input 
                type="date" 
                value={logDate} 
                onChange={e => setLogDate(e.target.value)}
                className="bg-black/40 border border-zinc-800 px-3 md:px-4 py-2 rounded-sm text-[10px] md:text-xs text-zinc-400 outline-none focus:border-gold transition-colors"
              />
            </div>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full h-48 md:h-60 p-6 md:p-8 bg-black/40 border border-zinc-800 rounded-sm outline-none focus:border-gold text-zinc-300 resize-none mb-6 md:mb-8 font-light italic leading-relaxed md:leading-loose text-base md:text-lg"
              placeholder="What happened today? Capture it in words..."
            />
            <button 
              onClick={addLog}
              className="w-full py-4 md:py-5 bg-gold text-[#0f0e0d] rounded-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gold/90 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <Send className="w-4 h-4" /> Save Entry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8 md:space-y-12">
        {logs.map((log) => (
          <motion.div 
            key={log.id} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="relative group pl-8 md:pl-12 border-l border-zinc-800"
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 w-2 md:w-3 h-2 md:h-3 bg-zinc-950 border border-gold rounded-full transition-transform"></div>
            
            <div className="flex justify-between items-start md:items-center mb-4 md:mb-6">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-gold font-bold opacity-60 flex items-center gap-1">
                  L'entrée (The entry) <CheckCircle2 className="w-2 h-2" />
                </span>
                <span className="text-serif italic text-lg md:text-2xl text-zinc-300 mt-1">{format(new Date(log.date), 'MMMM do, yyyy')}</span>
              </div>
              <button 
                onClick={() => deleteLog(log.id)}
                className="p-2 text-zinc-800 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-zinc-400 font-light leading-[1.8] md:leading-[2] text-sm md:text-lg italic whitespace-pre-wrap">"{log.content}"</p>
          </motion.div>
        ))}
        
        {logs.length === 0 && !isAdding && (
          <div className="py-20 md:py-32 flex flex-col items-center justify-center text-zinc-800">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 opacity-20" />
            <p className="font-serif italic text-lg md:text-2xl text-center px-8">Your history is blank.<br/>Pick up the pen and write your legacy.</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
      />
    </div>
  );
}
