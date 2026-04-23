import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Upload, Minus, Plus, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

export function ImageCropper({ isOpen, onClose, onCrop, externalImage }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (externalImage) {
      setImage(externalImage);
    }
  }, [externalImage]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(image!, croppedAreaPixels);
      onCrop(croppedImage);
      setImage(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-[#0f0e0d] border border-accent-border rounded-xl md:rounded-sm overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-2 border-b border-white/5 flex justify-end items-center glass">
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-gold transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 min-h-[300px] relative bg-black/40">
              {image ? (
                <>
                  <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass px-3 py-1.5 rounded-full z-10 border border-gold/20 scale-90 md:scale-100">
                    <button 
                      onClick={() => setAspect(1)} 
                      className={`p-1.5 rounded-full transition-all ${aspect === 1 ? 'text-gold bg-gold/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setAspect(16 / 9)} 
                      className={`p-1.5 rounded-full transition-all ${aspect === 16 / 9 ? 'text-gold bg-gold/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <RectangleHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setAspect(3 / 4)} 
                      className={`p-1.5 rounded-full transition-all ${aspect === 3 / 4 ? 'text-gold bg-gold/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <RectangleVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-6 text-center">
                  <Upload className="w-10 h-10 mb-4 opacity-20" />
                  <p className="mb-4 text-[10px] font-light tracking-widest uppercase">Select an image</p>
                  <label className="btn-gold-outline cursor-pointer text-[9px] px-6 py-3">
                    Choose File
                    <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 space-y-4 bg-black/60 border-t border-white/5">
              <div className="flex items-center gap-4">
                <Minus className="w-3 h-3 text-zinc-700" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e: any) => setZoom(e.target.value)}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <Plus className="w-3 h-3 text-zinc-700" />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 text-zinc-600 uppercase tracking-widest text-[9px] hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={createCroppedImage}
                  disabled={!image}
                  className="flex-[2] py-3 bg-gold text-[#0f0e0d] rounded-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gold/90 transition-all disabled:opacity-20 shadow-xl flex items-center justify-center gap-2"
                >
                  <Check className="w-3 h-3" /> Save Photo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Image processing helper
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}
