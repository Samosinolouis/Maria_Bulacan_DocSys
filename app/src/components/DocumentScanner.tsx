'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  Eye,
  X,
  Plus,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface DocumentScannerProps {
  /** Emits the captured and uploaded files so a caller can upload them. */
  onCapture: (files: File[]) => void;
}

interface ScannedItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  /** Data URL preview for image captures; null for non-image uploads. */
  previewUrl: string | null;
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /:(.*?);/.exec(meta);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mime });
}

export default function DocumentScanner({ onCapture }: DocumentScannerProps) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync the captured files back to the parent whenever the set changes.
  useEffect(() => {
    onCapture(items.map((item) => item.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Clean up camera stream on unmount (mutating the refs directly here keeps
  // the effect self-contained for the react-hooks/immutability rule).
  useEffect(() => {
    const stream = streamRef;
    const video = videoRef;
    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
        stream.current = null;
      }
      if (video.current) {
        video.current.srcObject = null;
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported on this workstation browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('[DocSys Scanner] Camera initialization error:', err);
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Unable to access video camera. Please use Direct File Feeder upload.'
      );
      setIsCameraActive(false);
    }
  };

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }

  const switchMode = (newMode: 'upload' | 'camera') => {
    if (newMode === 'upload') {
      stopCamera();
    } else if (newMode === 'camera') {
      startCamera();
    }
    setMode(newMode);
  };

  const addItem = (item: ScannedItem) => {
    setItems((prev) => [...prev, item]);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the high-resolution frame and encode it as a compressed JPEG.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const fileName = `SCANNED_PAGE_${items.length + 1}.jpg`;
    const file = dataUrlToFile(dataUrl, fileName);

    addItem({
      id: `scan-${Date.now()}-${items.length + 1}`,
      file,
      name: fileName,
      size: formatFileSize(file.size),
      type: 'image/jpeg',
      previewUrl: dataUrl,
    });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const id = `file-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
      const base = {
        id,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          addItem({ ...base, previewUrl: (event.target?.result as string) ?? null });
        };
        reader.readAsDataURL(file);
      } else {
        addItem({ ...base, previewUrl: null });
      }
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const imageItems = items.filter((item) => item.previewUrl !== null);

  return (
    <div className="space-y-4">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#CBD5E1] pb-2">
        <button
          type="button"
          onClick={() => switchMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
            mode === 'upload'
              ? 'bg-[#081E36] text-white shadow-sm'
              : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
          }`}
        >
          <Upload size={14} />
          <span>Physical Feeder / File Upload</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode('camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
            mode === 'camera'
              ? 'bg-[#081E36] text-white shadow-sm'
              : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
          }`}
        >
          <Camera size={14} />
          <span>Live Document Camera Scanner</span>
        </button>
      </div>

      {/* Mode 1: Real File Upload & Feeder */}
      {mode === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#15803D] bg-[#F0FDF4]'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#081E36]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            accept=".pdf,image/png,image/jpeg,image/webp,.doc,.docx"
            className="hidden"
          />

          <Upload size={32} className="mx-auto text-[#081E36] mb-2" />
          <h4 className="font-bold text-xs text-[#081E36]">
            Upload Scanned Official Dossier &amp; Supporting Annexes
          </h4>
          <p className="text-[11px] text-[#64748B] mb-3 max-w-md mx-auto">
            Drag and drop authentic municipal documents, signed letters, travel orders, or camera
            photos. Supports PDF, JPG, PNG, and DOCX.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-fluid px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Select Local Files from Workstation</span>
          </button>
        </div>
      )}

      {/* Mode 2: Real Camera / Webcam Scanner */}
      {mode === 'camera' && (
        <div className="space-y-3">
          {cameraError ? (
            <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center space-y-2">
              <AlertCircle size={28} className="mx-auto text-[#475569]" />
              <div className="text-xs font-bold text-[#081E36]">Camera Hardware Notice</div>
              <p className="text-[11px] text-[#64748B]">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="btn-fluid px-3 py-1.5 bg-[#081E36] text-white rounded text-xs font-bold cursor-pointer"
              >
                Retry Camera Access
              </button>
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden border border-[#CBD5E1] aspect-[4/3] max-h-[380px] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain"
              />

              {/* Viewfinder Target Guides */}
              <div className="absolute inset-8 border border-white/40 pointer-events-none rounded flex flex-col justify-between p-2">
                <div className="flex justify-between text-[10px] font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded self-start">
                  A4 DOCUMENT SCANNER ALIGNMENT
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white/60">
                  <span>TOP LEFT</span>
                  <span>TOP RIGHT</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white/60">
                  <span>BOTTOM LEFT</span>
                  <span>BOTTOM RIGHT</span>
                </div>
              </div>

              {/* Bottom Capture Controls */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 bg-black/60 py-2 px-4">
                <button
                  type="button"
                  onClick={captureFrame}
                  disabled={!isCameraActive}
                  className="btn-fluid flex items-center gap-2 px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-full font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Camera size={16} />
                  <span>Capture Page {imageItems.length + 1}</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  title="Refresh Camera Feed"
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full cursor-pointer"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Captured Pages Gallery (Multi-Page Support) */}
      {imageItems.length > 0 && (
        <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck size={14} className="text-[#15803D]" />
              Captured Document Pages ({imageItems.length})
            </span>
            <span className="text-[10px] text-[#64748B]">
              Ready for archival &amp; executive docketing
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {imageItems.map((item, idx) => (
              <div
                key={item.id}
                className="relative group border border-[#CBD5E1] rounded bg-white overflow-hidden aspect-[3/4] flex flex-col"
              >
                <img
                  src={item.previewUrl ?? ''}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 bg-[#081E36]/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  P.{idx + 1}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(item.previewUrl)}
                    className="p-1.5 bg-white text-[#081E36] rounded-full hover:bg-[#F1F5F9] cursor-pointer"
                    title="View Full Size"
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 bg-white text-[#334155] rounded-full hover:bg-[#F1F5F9] cursor-pointer"
                    title="Remove Page"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captured / Uploaded Attachments List */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide">
            Digital Annexes &amp; Physical File Records ({items.length})
          </div>
          <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 flex items-center justify-between hover:bg-[#F8FAFC]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-[#081E36] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#0F172A] truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {item.size} - {item.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.previewUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(item.previewUrl)}
                      className="px-2 py-1 text-[11px] font-bold text-[#081E36] hover:bg-[#E2E8F0] rounded cursor-pointer"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                    title="Remove File"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-Screen Preview Lightbox Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 bg-black/85 z-70 flex items-center justify-center p-4 animate-fluid-fade"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#081E36] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
              <span>Document Previewer</span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 overflow-auto flex-1 flex items-center justify-center bg-[#F1F5F9]">
              {previewModalUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewModalUrl}
                  title="PDF Preview"
                  className="w-[800px] h-[600px] border-0"
                />
              ) : (
                <img
                  src={previewModalUrl}
                  alt="Scanned Document Preview"
                  className="max-h-[80vh] w-auto object-contain rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
