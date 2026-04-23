import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X, Send, CheckCircle2, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { handleFirestoreError } from '../lib/firebaseErrors';
import { ConfirmationModal } from './ConfirmationModal';

export function InviteSystem({ user, partnership, isOpen, onClose }: any) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
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
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'invitations'),
      where('senderUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, 'list', 'invitations'));

    return unsubscribe;
  }, [user, isOpen]);

  const cancelInvite = async (invite: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Batalkan Undangan?',
      message: `Apakah Anda yakin ingin membatalkan undangan untuk ${invite.email}? Pasangan Anda tidak akan bisa masuk.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          // Remove from invitations
          await deleteDoc(doc(db, 'invitations', invite.id));
          // Remove from whitelist if applicable (only if invitedBy matches)
          const whitelistDoc = await getDoc(doc(db, 'whitelist', invite.email.toLowerCase()));
          if (whitelistDoc.exists() && whitelistDoc.data().invitedBy === user.uid) {
            await deleteDoc(doc(db, 'whitelist', invite.email.toLowerCase()));
          }
        } catch (e) {
          handleFirestoreError(e, 'delete', `invitations/${invite.id}`);
        }
      }
    });
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    
    try {
      // Add to whitelist
      await setDoc(doc(db, 'whitelist', email.toLowerCase()), {
        addedAt: new Date().toISOString(),
        invitedBy: user.uid,
        email: email.toLowerCase()
      });

      // Create an invitation document so the user can see it
      const invId = Math.random().toString(36).substring(7);
      const invRef = doc(db, 'invitations', invId);
      await setDoc(invRef, {
        email: email.toLowerCase(),
        partnershipId: partnership?.id || null,
        senderUid: user.uid,
        senderName: user.displayName,
        timestamp: new Date().toISOString()
      });

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setEmail('');
      }, 2000);
    } catch (e) {
      handleFirestoreError(e, 'create', 'invitations');
      setStatus('idle');
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-[#0a0908] border-b border-accent-border overflow-hidden"
        >
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 border border-gold/10 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gold opacity-50" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-gold italic leading-tight">Undangan AryaSrinadi</h3>
                  <p className="text-zinc-600 text-[8px] uppercase tracking-widest font-light mt-0.5">Kelola akses sanctuary</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-700 hover:text-gold transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-6 text-gold"
              >
                <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-serif italic text-lg">Undangan Dikirim</p>
              </motion.div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <form onSubmit={sendInvite} className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold ml-1">Email Pasangan</label>
                    <div className="relative group/input">
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="partner@eternity.com"
                        className="w-full px-5 py-3 bg-black/40 border border-zinc-900 rounded-sm outline-none focus:border-gold/30 transition-all text-zinc-200 text-sm font-light pr-10"
                      />
                      {email && (
                        <button 
                          type="button"
                          onClick={() => setEmail('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-700 hover:text-gold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="w-full py-3.5 bg-gold text-[#0f0e0d] rounded-sm font-bold uppercase tracking-[0.2em] text-[9px] hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/5"
                  >
                    {status === 'loading' ? 'Granting...' : <><Send className="w-3 h-3" /> Kirim Undangan</>}
                  </button>
                </form>

                <div className="flex-1 space-y-4">
                  <h4 className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-bold">Undangan Tertunda</h4>
                  {pendingInvites.length > 0 ? (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      {pendingInvites.map(invite => (
                        <div key={invite.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-sm group hover:border-gold/20 transition-all">
                          <div className="flex items-center gap-3">
                            <Mail className="w-2.5 h-2.5 text-gold/30" />
                            <span className="text-[11px] text-zinc-500 font-light italic truncate max-w-[150px]">{invite.email}</span>
                          </div>
                          <button 
                            onClick={() => cancelInvite(invite)}
                            className="p-1.5 text-zinc-700 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-zinc-800 italic uppercase tracking-widest pt-1">Kosong</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <ConfirmationModal
      isOpen={confirmConfig.isOpen}
      onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      onConfirm={confirmConfig.onConfirm}
      title={confirmConfig.title}
      message={confirmConfig.message}
      variant={confirmConfig.variant}
    />
    </>
  );
}
