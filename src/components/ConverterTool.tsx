'use client'

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadIcon, CheckCircleIcon } from './ui/Icons';
import { Button } from './ui/Button';
import { SectionWrapper } from './ui/SectionWrapper';
import { formatFileSize } from '../utils/helpers';
// Using server-side conversion via /api/convert (fluent-ffmpeg)

interface ProcessedFile {
  name: string;
  originalSize: number;
  newSize: number;
  downloadUrl: string;
}

export const ConverterTool = React.forwardRef<HTMLElement>((props, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  

  const handleFileProcessing = useCallback(async (selectedFile: File) => {
    if (typeof window === 'undefined') return;

    if (!selectedFile) return;
    
    setFile(selectedFile);
    setProcessedFile(null);
    setError("");
    setIsProcessing(true);
    setProgress(0);

    try {
      const fileName = selectedFile.name.toLowerCase();
      const heicMime = selectedFile.type === 'image/heic' || selectedFile.type === 'image/heif' || selectedFile.type === 'image/heif-sequence';
      const isHEIC = heicMime || fileName.endsWith('.heic') || fileName.endsWith('.heif');
      const isVideo = selectedFile.type.startsWith("video/") || fileName.endsWith('.mov') || fileName.endsWith('.mp4');
      const isImage = selectedFile.type.startsWith("image/") || isHEIC;
      
      let processedBlob: Blob ;
      let newName: string;
      let ext: string;

      if (isImage) {
        let imageFile = selectedFile;

        // Convert HEIC/HEIF to JPEG first
        if (isHEIC) {
          setProgress(10);
          let convertedBlob: Blob | null = null;
          try {
            const heic2any = (await import('heic2any')).default;
            convertedBlob = await heic2any({
              blob: selectedFile,
              toType: 'image/jpeg',
              quality: 0.9,
            }) as Blob;
          } catch {
            // Fallback to server-side conversion via /api/convert-heic
            try {
              const fd = new FormData();
              fd.append('file', selectedFile);
              const resp = await fetch('/api/convert-heic', { method: 'POST', body: fd });
              if (!resp.ok) {
                const ct = resp.headers.get('content-type') || '';
                let msg = `Server responded ${resp.status}`;
                if (ct.includes('application/json')) {
                  try {
                    const obj = await resp.json();
                    const combined = [obj?.error, obj?.details].filter(Boolean).join(': ');
                    if (combined) msg = combined;
                  } catch {}
                } else {
                  try {
                    const txt = await resp.text();
                    if (txt) msg = txt;
                  } catch {}
                }
                throw new Error(msg);
              }
              convertedBlob = await resp.blob();
            } catch (serverErr: unknown) {
              const msg = serverErr instanceof Error ? serverErr.message : String(serverErr || '');
              throw new Error(msg || 'فشل تحويل HEIC');
            }
          }
          if (!convertedBlob) {
            throw new Error('فشل تحويل HEIC.');
          }
          imageFile = new File([convertedBlob], selectedFile.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg'
          });
          setProgress(30);
        }
        
        // Process image: convert to JPEG and compress
        const img = new Image();
        const imgUrl = URL.createObjectURL(imageFile);
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(imgUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(imgUrl);
            reject(new Error('تعذر تحميل الصورة للمعالجة. قد يكون الملف غير مدعوم أو تالفًا.'));
          };
          img.src = imgUrl;
        });

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('تعذر الحصول على سياق الرسم ثنائي الأبعاد.');
        }
        
        // Maintain aspect ratio while limiting max dimensions
        const maxDimension = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        processedBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('فشل ترميز الصورة. قد لا يدعم المتصفح ترميز JPEG لهذه الصورة.'));
          }, 'image/jpeg', 0.85);
        });
        
        setProgress(100);
        ext = 'jpg';
        newName = selectedFile.name.replace(/\.[^/.]+$/, "") + `_pixora-ready.${ext}`;
      } else if (isVideo) {
        // Upload to server for conversion using fluent-ffmpeg
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('filename', selectedFile.name);

        const { blob, filename } = await new Promise<{ blob: Blob; filename: string | null }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/convert');
          xhr.responseType = 'blob';
          xhr.timeout = 15 * 60 * 1000; // 15 minutes for large videos
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 80); // upload up to 80%
              setProgress(Math.min(80, Math.max(0, pct)));
            }
          };
          xhr.onerror = () => reject(new Error('حدث خطأ في الشبكة أثناء الرفع'));
          xhr.onabort = () => reject(new Error('تم إلغاء الرفع'));
          xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع'));
          xhr.onloadstart = () => setProgress((p) => Math.max(p, 5));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const cd = xhr.getResponseHeader('Content-Disposition');
              let fname: string | null = null;
              if (cd) {
                const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
                fname = decodeURIComponent((match?.[1] || match?.[2] || '').trim());
                if (!fname) fname = null;
              }
              resolve({ blob: xhr.response, filename: fname });
            } else {
              // Try to read server error message (JSON or text)
              const ct = xhr.getResponseHeader('Content-Type') || '';
              const respBlob = xhr.response;
              if (respBlob && typeof FileReader !== 'undefined') {
                const reader = new FileReader();
                reader.onload = () => {
                  const body = String(reader.result || '').slice(0, 4000);
                  let msg = body;
                  try {
                    if (ct.includes('application/json')) {
                      const obj = JSON.parse(body);
                      const combined = [obj?.error, obj?.details].filter(Boolean).join(': ');
                      msg = combined || body;
                    }
                  } catch {}
                  reject(new Error(`استجابة الخادم ${xhr.status}: ${msg}`));
                };
                reader.onerror = () => reject(new Error(`استجابة الخادم ${xhr.status}`));
                reader.readAsText(respBlob);
              } else {
                reject(new Error(`استجابة الخادم ${xhr.status}`));
              }
            }
          };
          xhr.send(formData);
        });

        processedBlob = blob;
        ext = 'mp4';
        newName = filename || selectedFile.name.replace(/\.[^/.]+$/, "") + `_pixora-ready.${ext}`;
        setProgress(100);
      } else {
        throw new Error('نوع الملف غير مدعوم');
      }

      const downloadUrl = URL.createObjectURL(processedBlob);

      setProcessedFile({
        name: newName,
        originalSize: selectedFile.size,
        newSize: processedBlob.size,
        downloadUrl: downloadUrl,
      });
    } catch (err: unknown) {
      console.error('Processing error:', err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : '';
      setError(message || 'فشل في معالجة الملف. يرجى التأكد من أن الملف صورة أو فيديو مدعوم ثم المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      
      // Validate file size (max 200MB)
      if (selectedFile.size > 200 * 1024 * 1024) {
        setError("يجب أن يكون حجم الملف أقل من 200MB");
        return;
      }

      // Validate file type - check MIME type or file extension
      const validTypes = ['image/', 'video/'];
      const validExtensions = ['.heic', '.heif', '.mov', '.mp4', '.m4v', '.webm', '.mkv', '.avi', '.3gp', '.mpeg', '.mpg', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const fileName = selectedFile.name.toLowerCase();
      const hasValidType = validTypes.some(type => selectedFile.type.startsWith(type));
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidType && !hasValidExtension) {
        setError("يرجى اختيار ملف صورة أو فيديو صالح");
        return;
      }

      handleFileProcessing(selectedFile);
    }
  }, [handleFileProcessing]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleReset = () => {
    // Clean up object URL to prevent memory leaks
    if (processedFile?.downloadUrl) {
      URL.revokeObjectURL(processedFile.downloadUrl);
    }
    
    setFile(null);
    setProcessedFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <SectionWrapper 
      id="converter" 
      ref={ref} 
      background="gray" 
      padding="xl"
      className="relative"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              أداة تحويل الملفات
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ارفع صورك ومقاطع الفيديو لتحويلها إلى صيغ متوافقة مع PIXORA
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!processedFile && !isProcessing ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`
                    relative flex flex-col items-center justify-center 
                    p-12 md:p-16 lg:p-20 border-2 border-dashed rounded-2xl 
                    cursor-pointer transition-all duration-300 group
                    ${isDragging 
                      ? "border-blue-500 bg-blue-50 scale-105" 
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-105"
                    }
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    accept="image/*,video/*,.heic,.heif,.hevc,.mov,image/heic,image/heif"
                  />
                  
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UploadIcon size={64} className="text-gray-400 group-hover:text-blue-500" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    اسحب وأفلت ملفاتك هنا
                  </h3>
                  
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    يدعم الصور ومقاطع الفيديو بما في ذلك HEIC وMOV وMP4 وJPG وPNG وغيرها
                  </p>
                  
                  <Button variant="primary" size="lg" className="mb-4">
                    اختر الملفات
                  </Button>
                  
                  <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-500">
                    <span>• الحد الأقصى: 200MB</span>
                    <span>• تحويل مجاني</span>
                    <span>• آمن وخصوصي</span>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    🔒 تتم معالجة الملفات بأمان ويتم حذفها تلقائيًا بعد التحويل
                  </p>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-blue-200 rounded-full mx-auto animate-spin">
                    <div className="w-20 h-20 border-t-4 border-blue-600 rounded-full animate-spin" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                  جارٍ معالجة ملفك...
                </h3>
                
                <p className="text-lg text-gray-600 mb-6">
                  تحويل وتحسين ليتوافق مع إطار PIXORA
                </p>

                <div className="bg-gray-100 rounded-full h-2 w-64 mx-auto overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-sm text-gray-600">{progress}%</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="mb-8">
                  <CheckCircleIcon 
                    size={80} 
                    className="text-green-500 mx-auto mb-4" 
                  />
                  <h3 className="text-3xl font-bold text-green-600 mb-2">
                    تم التحويل بنجاح!
                  </h3>
                  <p className="text-lg text-gray-600">
                    ملفك أصبح جاهزًا الآن لإطار PIXORA
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <motion.div 
                    className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <h4 className="font-bold text-gray-800 mb-2 text-lg">الملف الأصلي</h4>
                    <p className="text-gray-600 mb-2 truncate text-sm">
                      {file?.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFileSize(processedFile!.originalSize)}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="bg-green-50 p-6 rounded-2xl border border-green-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <h4 className="font-bold text-green-800 mb-2 text-lg">الملف المحوّل</h4>
                    <p className="text-green-700 mb-2 truncate text-sm">
                      {processedFile!.name}
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatFileSize(processedFile!.newSize)}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {Math.round((1 - processedFile!.newSize / processedFile!.originalSize) * 100)}% أصغر
                      </span>
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={processedFile!.downloadUrl}
                    download={processedFile!.name}
                    className="relative inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg w-full sm:w-auto text-center"
                  >
                    تنزيل الملف المحوّل
                  </a>
                  
                  <Button
                    onClick={handleReset}
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    حوّل ملفًا آخر
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </SectionWrapper>
  );
});

ConverterTool.displayName = "ConverterTool";