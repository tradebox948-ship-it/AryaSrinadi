import React, { useState, lazy, Suspense } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Edit2, Check, X, Camera, CheckCircle2, Heart } from 'lucide-react';
import { handleFirestoreError } from '../lib/firebaseErrors';

const ImageCropper = lazy(() => import('./ImageCropper').then(m => ({ default: m.ImageCropper })));

export function ProfileSection({ partnership, user }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ProfileCard index={1} data={partnership.mate1} partnershipId={partnership.id} />
      <ProfileCard index={2} data={partnership.mate2} partnershipId={partnership.id} />
    </div>
  );
}

function ProfileCard({ index, data, partnershipId }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.name || '');
  const [birthday, setBirthday] = useState(data.birthday || '');
  const [hobbies, setHobbies] = useState(data.hobbies || '');
  const [photoUrl, setPhotoUrl] = useState(data.photoUrl || '');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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

  const saveProfile = async () => {
    try {
      const update: any = {};
      update[`mate${index}`] = { name, birthday, hobbies, photoUrl };
      await updateDoc(doc(db, 'partnerships', partnershipId), update);
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, 'update', `partnerships/${partnershipId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="card-sophisticated p-6 md:p-10 relative group"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 md:mb-8">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-sm border border-accent-border shadow-2xl overflow-hidden bg-zinc-900 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} className="w-full h-full object-cover grayscale md:opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-12 h-12 md:w-16 md:h-16 text-zinc-800" />
            )}
          </div>
          {isEditing && (
            <label 
              className="absolute -bottom-3 -right-3 p-3 bg-gold text-[#0f0e0d] rounded-full shadow-lg hover:scale-110 transition-all z-10 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            </label>
          )}
        </div>

        {isEditing ? (
          <div className="w-full space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block">Nama Lengkap</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-zinc-900 focus:border-gold outline-none text-center font-serif text-lg text-gold"
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block">Tanggal Lahir</label>
              <input 
                type="date"
                value={birthday} 
                onChange={e => setBirthday(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-zinc-900 focus:border-gold outline-none text-center text-xs text-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block">Hobi</label>
              <input 
                value={hobbies} 
                onChange={e => setHobbies(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-zinc-900 focus:border-gold outline-none text-center text-xs text-zinc-400"
                placeholder="Gaming, Reading, etc."
              />
            </div>
            <div className="flex gap-4 justify-center pt-2">
              <button onClick={saveProfile} className="p-3 bg-gold/20 text-gold rounded-full border border-gold/30 hover:bg-gold hover:text-black transition-colors"><Check className="w-4 h-4" /></button>
              <button onClick={() => setIsEditing(false)} className="p-3 bg-zinc-900 text-zinc-500 rounded-full border border-zinc-800 hover:text-zinc-200 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl md:text-3xl font-serif text-gold italic">{data.name || 'Anonymous'}</h3>
              <CheckCircle2 className="w-3 h-3 text-gold/40" />
            </div>
            <div className="h-[1px] w-8 bg-gold/30 mb-4 mx-auto"></div>
            
            <div className="space-y-3 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-bold flex items-center gap-1">
                  Né Le (Born) <CheckCircle2 className="w-2 h-2 opacity-30" />
                </span>
                <span className="text-xs md:text-sm text-zinc-400 font-light italic">{data.birthday || 'Unknown'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-bold flex items-center gap-1">
                  Passions (Hobbies) <CheckCircle2 className="w-2 h-2 opacity-30" />
                </span>
                <span className="text-xs md:text-sm text-zinc-400 font-light italic line-clamp-1">{data.hobbies || 'Life and Love'}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(true)}
              className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-3 text-gold/40 hover:text-gold"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </>
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
    </motion.div>
  );
}
