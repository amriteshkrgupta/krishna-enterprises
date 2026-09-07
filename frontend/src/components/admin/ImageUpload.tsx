'use client';

import { useCallback, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '@/lib/firebase';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ value = [], onChange, maxImages = 5 }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    // 1. Try Firebase Storage directly
    try {
      if (firebaseStorage) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(firebaseStorage, `products/${Date.now()}-${cleanName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      }
    } catch (fbErr: any) {
      console.warn('Firebase storage upload failed, attempting backend fallback', fbErr);
    }

    // 2. Fallback: try backend /api/upload multipart
    try {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('file', file);
      const res = await api.post<any>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.images && res.data.images[0]?.url) {
        return res.data.images[0].url;
      }
      if (res.data?.url) {
        return res.data.url;
      }
    } catch (apiErr: any) {
      console.error('Backend upload fallback failed:', apiErr);
    }

    toast.error(`Failed to upload ${file.name}`);
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (value.length >= maxImages) {
        toast.error(`Max ${maxImages} images allowed`);
        return;
      }
      setUploading(true);
      const remaining = maxImages - value.length;
      const toUpload  = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(toUpload.map(uploadFile));
      const valid = urls.filter(Boolean) as string[];
      if (valid.length > 0) {
        onChange([...value, ...valid]);
        toast.success(`${valid.length} image(s) uploaded successfully!`);
      }
      setUploading(false);
    },
    [value, onChange, maxImages],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (url: string) => onChange(value.filter((u) => u !== url));

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (value.length >= maxImages) {
      toast.error(`Max ${maxImages} images allowed`);
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('Please enter a valid image URL starting with http:// or https://');
      return;
    }
    onChange([...value, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image link added!');
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 px-4 transition-all ${
          dragging
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50/40'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        ) : (
          <UploadCloud className={`h-10 w-10 ${dragging ? 'text-green-600' : 'text-gray-400'}`} />
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700">
            {uploading ? 'Uploading image(s)...' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">or choose a file from your computer or phone</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="cursor-pointer rounded-xl bg-green-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-green-700 transition">
            Browse Files
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading || value.length >= maxImages}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1 rounded-xl bg-white border border-gray-300 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-2xs"
          >
            <LinkIcon className="h-3.5 w-3.5 text-gray-500" />
            <span>Paste Image URL</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400">PNG, JPG, WebP up to 5MB · Max {maxImages} images</p>
      </div>

      {/* Direct Image URL input box */}
      {showUrlInput && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          <input
            type="url"
            placeholder="Paste direct image link (e.g. https://images.unsplash.com/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="flex-1 px-2 py-1 text-xs text-gray-800 outline-none"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200 shadow-2xs"
            >
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-md transition-opacity hover:bg-red-700"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ImageIcon className="h-4 w-4" />
          No images uploaded yet
        </div>
      )}
    </div>
  );
}
