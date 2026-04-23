import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import { db } from './lib/firebase';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError } from './lib/firebaseErrors';
import { Heart, Image as ImageIcon, Book, User, LogOut, Mail, Check, AlertCircle, Plus, Trash2, Camera, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InviteSystem } from './components/InviteSystem';
import { NotificationToast } from './components/NotificationToast';
import { ConfirmationModal } from './components/ConfirmationModal';

const ProfileSection = lazy(() => import('./components/ProfileSection').then(m => ({ default: m.ProfileSection })));
const MemoryGallery = lazy(() => import('./components/MemoryGallery').then(m => ({ default: m.MemoryGallery })));
const DailyLogs = lazy(() => import('./components/DailyLogs').then(m => ({ default: m.DailyLogs })));

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<any>(null);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [partnership, setPartnership] = useState<any>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
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
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for success message from popup (OAuth completion)
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow current origin
      if (origin !== window.location.origin) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setUser(session.user);
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Check whitelist with real-time sync
      const whitelistRef = doc(db, 'whitelist', user.email?.toLowerCase() || '');
      const unsubscribeWhitelist = onSnapshot(whitelistRef, async (docSnap) => {
        if (docSnap.exists()) {
          setIsWhitelisted(true);
        } else {
          // Fallback for owner
          if (user.email === 'tradebox948@gmail.com') {
            await setDoc(doc(db, 'whitelist', user.email.toLowerCase()), {
              addedAt: new Date().toISOString(),
              email: user.email.toLowerCase()
            });
            setIsWhitelisted(true);
          } else {
            setIsWhitelisted(false);
          }
        }
      }, (e) => {
        handleFirestoreError(e, 'get', `whitelist/${user.email}`);
        setIsWhitelisted(false);
      });

      // Fetch user data for partnership link
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.partnershipId) {
            // Subscribe to partnership
            const unsubscribePart = onSnapshot(doc(db, 'partnerships', userData.partnershipId), (pSnap) => {
              if (pSnap.exists()) {
                setPartnership({ id: pSnap.id, ...pSnap.data() });
              }
            });
            return () => unsubscribePart();
          }
        } else {
          // Initialize user if doesn't exist
          setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            partnershipId: null
          });
        }
      });
      return () => {
        unsubscribeWhitelist();
        unsubscribeUser();
      };
    }
  }, [user]);

  if (loading || (user && isWhitelisted === null)) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950"><motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}><Heart className="text-gold w-12 h-12 fill-current" /></motion.div></div>;

  if (authError) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
    <AlertCircle className="w-16 h-16 text-red-500/50 mb-4" />
    <h2 className="text-2xl font-serif text-gold mb-2 italic">Authentication Error</h2>
    <p className="text-zinc-500 max-w-sm text-sm font-light">{authError.message}</p>
    <button onClick={() => window.location.reload()} className="mt-8 text-gold uppercase tracking-widest text-[9px] hover:underline">Retry</button>
  </div>;

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12 text-center">
          <Heart className="w-12 h-12 text-gold mx-auto mb-4 fill-current opacity-20" />
          <h1 className="text-4xl font-serif text-gold italic">AryaSrinadi</h1>
        </motion.div>
        
        {authView === 'signin' ? (
          <SignIn onSignUpClick={() => setAuthView('signup')} />
        ) : (
          <SignUp onSignInClick={() => setAuthView('signin')} />
        )}
      </div>
    );
  }

  if (isWhitelisted === false) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
    <AlertCircle className="w-16 h-16 text-amber-500/50 mb-4" />
    <h2 className="text-2xl font-serif text-gold mb-2 italic">Entrée Interdite</h2>
    <p className="text-zinc-500 max-w-sm text-sm font-light">This sanctuary is private. Please request an invitation from your partner to enter.</p>
    <button onClick={() => supabase.auth.signOut()} className="mt-8 text-gold uppercase tracking-widest text-[9px] hover:underline">Sign Out</button>
  </div>;

  const bgStyle = partnership?.backgroundUrl ? { backgroundImage: `url(${partnership.backgroundUrl})` } : {};

  return (
    <div className="relative min-h-screen font-sans selection:bg-gold/20 overflow-x-hidden">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 -z-10 opacity-10 filter grayscale contrast-125"
        style={bgStyle}
      />
      <div className="fixed inset-0 bg-zinc-950 -z-20" />
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-black -z-10" />

      {/* Main Container */}
      <nav className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-accent-border glass sticky top-0 z-50">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 md:gap-4">
          <span className="serif italic text-2xl md:text-3xl text-gold">AryaSrinadi</span>
          <div className="h-4 w-px bg-zinc-800 mx-1 md:mx-2 hidden xs:block"></div>
          <span className="text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-40 font-medium hidden xs:block">Portfolio</span>
        </motion.div>

        <div className="flex items-center gap-3 md:gap-8">
          <button 
            onClick={() => setIsInviteOpen(!isInviteOpen)} 
            className={`flex items-center gap-2 px-6 py-2 border rounded-sm tracking-widest uppercase text-[9px] transition-all ${
              isInviteOpen ? 'bg-gold text-black border-gold' : 'border-gold/50 text-gold hover:bg-gold/10'
            }`}
          >
            <UserPlus className="w-3 h-3" /> Invite One
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-zinc-600 hover:text-gold transition-colors">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </nav>

      <InviteSystem 
        user={user} 
        partnership={partnership} 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
      />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 pb-32 min-h-[calc(100vh-80px)]">
        {!partnership && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-sophisticated p-8 md:p-16 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif mb-4 md:text-3xl text-gold italic">Commencez Votre Voyage</h2>
            <p className="text-zinc-500 mb-8 md:mb-10 text-xs md:text-sm font-light leading-relaxed">You are not part of a partnership yet. Initialize your shared sanctuary and invite your other half.</p>
            <button 
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Mulai Perjalanan?',
                  message: 'Apakah Anda sudah siap untuk menginisialisasi tempat suci digital Anda bersama pasangan?',
                  onConfirm: async () => {
                    try {
                      const newRef = doc(db, 'partnerships', Math.random().toString(36).substring(7));
                      await setDoc(newRef, {
                        members: [user.uid],
                        mate1: { name: user.displayName, birthday: '', hobbies: 'Life & Love', photoUrl: user.photoURL },
                        mate2: { name: 'My Partner', birthday: '', hobbies: 'Life & Love', photoUrl: '' },
                        createdAt: new Date().toISOString()
                      });
                      await setDoc(doc(db, 'users', user.uid), { partnershipId: newRef.id }, { merge: true });
                    } catch (e) {
                      handleFirestoreError(e, 'create', 'partnerships');
                    }
                  }
                });
              }}
              className="btn-gold-outline w-full md:w-auto px-12 py-4"
            >
              Initialize Sanctuary
            </button>
          </motion.div>
        )}

        {partnership && (
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Heart className="w-8 h-8 text-gold animate-pulse" /></div>}>
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" partnership={partnership} user={user} />}
              {activeTab === 'memories' && <MemoryGallery key="memories" partnership={partnership} user={user} />}
              {activeTab === 'logs' && <DailyLogs key="logs" partnership={partnership} user={user} />}
            </AnimatePresence>
          </Suspense>
        )}
      </main>

      {/* Navigation */}
      {partnership && (
        <nav className="fixed bottom-6 md:bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-around md:justify-center glass px-2 md:px-10 py-4 md:py-5 rounded-xl md:rounded-sm shadow-2xl gap-2 md:gap-16 z-50">
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-5 h-5" />} label="Profile" />
          <NavButton active={activeTab === 'memories'} onClick={() => setActiveTab('memories')} icon={<ImageIcon className="w-5 h-5" />} label="Memories" />
          <NavButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Book className="w-5 h-5" />} label="Journal" />
        </nav>
      )}

      <NotificationToast partnership={partnership} user={user} />

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
      />

      <footer className="h-12 px-8 flex items-center justify-between border-t border-accent-border glass text-[9px] uppercase tracking-[0.3em] opacity-30 mt-auto">
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all ${active ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}>
      <motion.div animate={{ scale: active ? 1.2 : 1 }} whileTap={{ scale: 0.9 }}>
        {icon}
      </motion.div>
      <span className="text-[9px] font-medium uppercase tracking-[0.2em]">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-3 h-[1px] bg-gold mt-1" />}
    </button>
  );
}
