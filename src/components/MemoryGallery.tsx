import React, { useState, useEffect, lazy, Suspense } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Camera, MapPin, Calendar, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError } from '../lib/firebaseErrors';
import { ConfirmationModal } from './ConfirmationModal';

const ImageCropper = lazy(() => import('./ImageCropper').then(m => ({ default: m.ImageCropper })));

export function MemoryGallery({ partnership, user }: any) {
  const [memories, setMemories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'partnerships', partnership.id, 'memories'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, 'list', `partnerships/${partnership.id}/memories`);
    });
    return unsubscribe;
  }, [partnership.id]);

  const addMemory = async () => {
    if (!photoUrl) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Simpan Kenangan?',
      message: 'Apakah Anda yakin ingin membagikan kenangan indah ini di galeri?',
      onConfirm: async () => {
        try {
          await addDoc(collection(db, 'partnerships', partnership.id, 'memories'), {
            photoUrl,
            description,
            timestamp: serverTimestamp(),
            createdBy: user.uid
          });
          // Update partnership to trigger notification
          await updateDoc(doc(db, 'partnerships', partnership.id), {
            lastUpdate: new Date().toISOString(),
            lastUpdateType: 'memory',
            lastUpdateBy: user.displayName || user.email
          });
          setPhotoUrl('');
          setDescription('');
          setIsAdding(false);
        } catch (e) {
          handleFirestoreError(e, 'create', `partnerships/${partnership.id}/memories`);
        }
      }
    });
  };

  const deleteMemory = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Kenangan?',
      message: 'Momen ini akan terhapus selamanya dari galeri Anda. Lanjutkan?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'partnerships', partnership.id, 'memories', id));
        } catch (e) {
          handleFirestoreError(e, 'delete', `partnerships/${partnership.id}/memories/${id}`);
        }
      }
    });
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-gold italic mb-2">Kenangan Abadi</h2>
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Freezing precious chapters in time</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-gold-outline flex items-center gap-2 w-full md:w-auto justify-center"
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Close' : 'Add Memory'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            className="card-sophisticated p-6 md:p-10 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div>
                <label className="aspect-square bg-zinc-900/50 rounded-sm flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative border border-accent-border hover:border-gold transition-colors block">
                  {photoUrl ? (
                    <img src={photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-zinc-800 mb-2 group-hover:text-gold transition-colors" />
                      <span className="text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-widest text-center px-4">Buka Galeri Foto</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                </label>
              </div>
              <div className="flex flex-col justify-between py-0 md:py-2">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">L'histoire (The story)</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-32 md:h-40 p-4 md:p-6 bg-black/40 rounded-sm border border-zinc-800 outline-none focus:border-gold text-zinc-300 resize-none font-light text-xs md:text-sm italic leading-relaxed md:leading-loose"
                    placeholder="Describe this special moment..."
                  />
                </div>
                <button 
                  onClick={addMemory}
                  disabled={!photoUrl}
                  className="w-full py-4 md:py-5 bg-gold text-black rounded-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gold/90 disabled:opacity-20 transition-all mt-6 shadow-xl shadow-gold/5"
                >
                  Save Reflection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {memories.map((memory) => (
          <motion.div 
            layout
            key={memory.id} 
            className="card-sophisticated overflow-hidden group"
          >
            <div className="aspect-[3/4] relative overflow-hidden">
              <img 
                src={memory.photoUrl} 
                className="w-full h-full object-cover grayscale opacity-70 md:opacity-70 md:grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 p-4 flex items-end justify-end md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500">
                <button 
                  onClick={() => deleteMemory(memory.id)}
                  className="p-3 bg-red-400/20 md:bg-red-400/10 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl backdrop-blur-md border border-red-400/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-2">
                <CheckCircle2 className="w-3 h-3 text-gold/40 mt-1" />
                <div className="flex items-center gap-2 text-zinc-600 text-[8px] md:text-[9px] uppercase tracking-widest font-bold">
                  <div className="w-4 h-px bg-gold/50"></div>
                  {memory.timestamp?.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <p className="text-zinc-300 text-xs md:text-sm font-light leading-relaxed italic line-clamp-3 md:truncate md:group-hover:whitespace-normal">"{memory.description}"</p>
            </div>
          </motion.div>
        ))}
        
        {memories.length === 0 && !isAdding && (
          <div className="col-span-full py-20 md:py-32 flex flex-col items-center justify-center text-zinc-800">
            <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 opacity-20" />
            <p className="font-serif italic text-xl md:text-2xl text-center px-6">The gallery is waiting for its first masterpiece.</p>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <ImageCropper 
          isOpen={isCropperOpen} 
          onClose={() => { setIsCropperOpen(false); setSelectedFile(null); }} 
          externalImage={selectedFile}
          onCrop={(url: string) => { setPhotoUrl(url); setIsCropperOpen(false); setSelectedFile(null); }} 
        />
      </Suspense>

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
