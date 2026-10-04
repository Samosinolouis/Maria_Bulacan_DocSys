'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  FileText,
  Eye,
  X,
  Plus,
  AlertCircle,
  FileCheck,
  Maximize2,
} from 'lucide-react';
import { Attachment } from '@/lib/types';

interface DocumentScannerProps {
  onScanComplete: (pages: string[], attachments: Attachment[]) => void;
  initialPages?: string[];
  initialAttachments?: Attachment[];
  currentUserFullName: string;
}

export default function DocumentScanner({
  onScanComplete,
  initialPages = [],
  initialAttachments = [],
  currentUserFullName,
}: DocumentScannerProps) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [scannedPages, setScannedPages] = useState<string[]>(initialPages);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync back to parent whenever state changes
  useEffect(() => {
    onScanComplete(scannedPages, attachments);
  }, [scannedPages, attachments]);

  // Clean up camera stream on unmount or mode switch
  useEffect(() => {
    return () => {
      stopCamera();
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
    } catch (err: any) {
      console.warn('[DocSys Scanner] Camera initialization error:', err);
      setCameraError(
        err.message || 'Unable to access video camera. Please use Direct File Feeder upload.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const switchMode = (newMode: 'upload' | 'camera') => {
    if (newMode === 'upload') {
      stopCamera();
    } else if (newMode === 'camera') {
      startCamera();
    }
    setMode(newMode);
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

    // Draw the high-resolution frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to authentic compressed JPEG Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setScannedPages((prev) => [...prev, dataUrl]);

    // Also record as digital attachment
    const newAtt: Attachment = {
      id: `att-scan-${Date.now()}-${scannedPages.length + 1}`,
      fileName: `SCANNED_PAGE_${scannedPages.length + 1}.jpg`,
      fileSize: `${Math.round(dataUrl.length * 0.75 / 1024)} KB`,
      fileType: 'image/jpeg',
      uploadedBy: currentUserFullName,
      uploadedAt: new Date().toISOString(),
      fileDataUrl: dataUrl,
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const fileSizeStr =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fileName: file.name,
          fileSize: fileSizeStr,
          fileType: file.type || 'application/octet-stream',
          uploadedBy: currentUserFullName,
          uploadedAt: new Date().toISOString(),
          fileDataUrl: result,
        };

        setAttachments((prev) => [...prev, newAtt]);

        // If it's an image, also push to scannedPages for inline page flip preview
        if (file.type.startsWith('image/')) {
          setScannedPages((prev) => [...prev, result]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const removePage = (index: number) => {
    setScannedPages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

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
            Upload Scanned Official Dossier & Supporting Annexes
          </h4>
          <p className="text-[11px] text-[#64748B] mb-3 max-w-md mx-auto">
            Drag and drop authentic municipal documents, signed letters, travel orders, or camera photos. Supports PDF, JPG, PNG, and DOCX.
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
                  <span>Capture Page {scannedPages.length + 1}</span>
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
      {scannedPages.length > 0 && (
        <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck size={14} className="text-[#15803D]" />
              Captured Document Pages ({scannedPages.length})
            </span>
            <span className="text-[10px] text-[#64748B]">
              Ready for archival & executive docketing
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scannedPages.map((pageUrl, idx) => (
              <div
                key={idx}
                className="relative group border border-[#CBD5E1] rounded bg-white overflow-hidden aspect-[3/4] flex flex-col"
              >
                <img
                  src={pageUrl}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 bg-[#081E36]/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  P.{idx + 1}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(pageUrl)}
                    className="p-1.5 bg-white text-[#081E36] rounded-full hover:bg-[#F1F5F9] cursor-pointer"
                    title="View Full Size"
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePage(idx)}
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

      {/* Real Uploaded Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide">
            Digital Annexes & Physical File Records ({attachments.length})
          </div>
          <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="p-2.5 flex items-center justify-between hover:bg-[#F8FAFC]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-[#081E36] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#0F172A] truncate">
                      {att.fileName}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {att.fileSize} - {att.fileType} - Uploaded by {att.uploadedBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {att.fileDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(att.fileDataUrl || null)}
                      className="px-2 py-1 text-[11px] font-bold text-[#081E36] hover:bg-[#E2E8F0] rounded cursor-pointer"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
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
