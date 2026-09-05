'use client';

import { useCallback, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ value = [], onChange, maxImages = 5 }: ImageUploadProps) {
  const [dragging,    setDragging]    = useState(false);
  const [uploading,   setUploading]   = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post<{ success: boolean; url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } catch {
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
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
      onChange([...value, ...valid]);
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

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all ${
          dragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        <UploadCloud className={`h-10 w-10 ${dragging ? 'text-primary-500' : 'text-gray-400'}`} />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {uploading ? 'Uploading…' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">or</p>
        </div>
        <label className="cursor-pointer rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary-300 hover:text-primary-700">
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
        <p className="text-xs text-gray-400">PNG, JPG, WebP up to 5MB · Max {maxImages} images</p>
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
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
