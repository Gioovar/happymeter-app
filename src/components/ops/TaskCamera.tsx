'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { RefreshCw, Check, MapPin, Square, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCameraProps {
    onCapture: (file: File, meta: { lat: number, lng: number, capturedAt: Date, type: 'PHOTO' | 'VIDEO', comments?: string }) => void;
    evidenceType: 'PHOTO' | 'VIDEO' | 'BOTH';
}

export default function TaskCamera({ onCapture, evidenceType }: TaskCameraProps) {
    // Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Capture State
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedVideo, setCapturedVideo] = useState<Blob | null>(null);
    const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
    const [galleryFile, setGalleryFile] = useState<File | null>(null);

    // Mode State
    const [mode, setMode] = useState<'PHOTO' | 'VIDEO'>(evidenceType === 'BOTH' ? 'PHOTO' : evidenceType);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    // Step-by-step flow for BOTH type
    const [currentStep, setCurrentStep] = useState<'PHOTO' | 'VIDEO' | 'COMMENTS' | 'READY'>('PHOTO');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [comments, setComments] = useState<string>('');


    // --- Helpers ---

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            stopStream();

            console.log("Requesting camera...");
            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment'
                    },
                    audio: true
                });
            } catch (err: any) {
                console.warn("Environment camera failed with audio, trying fallback", err);
                // Fallback: try without audio or user facing mode if needed, but sticking to logic:
                // try environment without audio
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
            }

            console.log("Camera acquired", mediaStream.id);
            streamRef.current = mediaStream;
            setStream(mediaStream);
        } catch (err: any) {
            console.error("Camera error:", err);
            setError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    }, [stopStream]);

    // --- Lifecycle Effects ---

    // 1. Initialize Camera on mount
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (mounted) await startCamera();
        };
        init();

        return () => {
            mounted = false;
            stopStream();
        };
    }, [startCamera, stopStream]);

    // 2. Initialize GPS independently
    useEffect(() => {
        if (!navigator.geolocation) {
            console.log("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.log("GPS no disponible:", err),
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, []);


    // --- Video Reference Management ---

    // Callback ref to handle video mounting/unmounting robustly
    const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && stream) {
            console.log("Video node mounted, attaching stream");
            node.srcObject = stream;
            node.setAttribute('playsinline', 'true'); // Important for iOS
            node.muted = true;

            // Try to play immediately
            node.play().catch(e => {
                console.error("Play error:", e);
            });
        }
    }, [stream]);


    // --- Actions ---

    const processImage = (source: HTMLVideoElement | HTMLImageElement, quality = 0.7, maxWidth = 1280): string | null => {
        if (!canvasRef.current) return null;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return null;

        // Calculate new dimensions (Max width 1280, maintain aspect ratio)
        let width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
        let height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        context.drawImage(source, 0, 0, width, height);

        // Watermark
        const dateStr = new Date().toLocaleString();
        context.font = 'bold 16px Arial';
        context.fillStyle = 'white';
        context.shadowColor = 'black';
        context.shadowBlur = 4;
        context.fillText(`${dateStr}`, 20, height - 40);

        const locText = location
            ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`
            : "Ubicación no disponible";
        context.fillText(locText, 20, height - 20);

        // Compress
        return canvas.toDataURL('image/jpeg', quality);
    };

    const takePhoto = () => {
        if (!videoRef.current) return;
        const optimizedDataUrl = processImage(videoRef.current);
        if (optimizedDataUrl) {
            setCapturedImage(optimizedDataUrl);
            setCapturedVideo(null);
        }
    };

    const startRecording = () => {
        if (!stream) return;

        try {
            // Optimize Video Bitrate (2.5 Mbps)
            const options: MediaRecorderOptions = {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };

            // Fallback if mimeType not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
                delete options.mimeType;
            }

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setCapturedVideo(blob);
                setCapturedVideoUrl(URL.createObjectURL(blob));
                setCapturedImage(null);
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (e) {
            console.error(e);
            toast.error("Error al iniciar grabación");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            // Video: Check size limit (e.g. 50MB) 
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error("El video es demasiado grande (Máx 50MB).");
                return;
            }
            setGalleryFile(file);
            setCapturedVideo(file); // Store as blob/file
            setCapturedVideoUrl(URL.createObjectURL(file));
            setCapturedImage(null);
            setMode('VIDEO'); // Switch mode to show preview correctly if needed
        } else {
            // Image: Optimize
            const img = new Image();
            img.onload = () => {
                const optimizedDataUrl = processImage(img);
                if (optimizedDataUrl) {
                    setCapturedImage(optimizedDataUrl);
                    setCapturedVideo(null);
                    setGalleryFile(null); // We will convert dataUrl to file on confirm
                }
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const confirmCapture = async () => {
        if (!capturedImage && !capturedVideo) return;

        // For BOTH type, handle step-by-step flow
        if (evidenceType === 'BOTH') {
            if (currentStep === 'PHOTO' && capturedImage) {
                // Step 1: Photo captured, save it and move to video
                const res = await fetch(capturedImage);
                const blob = await res.blob();
                const file = new File([blob], "evidence_photo.jpg", { type: "image/jpeg" });

                setPhotoFile(file);
                setCapturedImage(null);
                setCurrentStep('VIDEO');
                setMode('VIDEO');

                toast.success('✓ Foto capturada. Ahora graba el video');
                return;
            } else if (currentStep === 'VIDEO' && capturedVideo) {
                // Step 2: Video captured, save it and move to comments
                const fileName = galleryFile ? galleryFile.name : "evidence_video.webm";
                const fileType = galleryFile ? galleryFile.type : "video/webm";

                const file = capturedVideo instanceof File
                    ? capturedVideo
                    : new File([capturedVideo], fileName, { type: fileType });

                setVideoFile(file);
                setCapturedVideo(null);
                setCapturedVideoUrl(null);
                setGalleryFile(null);
                setCurrentStep('COMMENTS');

                toast.success('✓ Video capturado. Agrega comentarios si es necesario');
                return;
            }
            // COMMENTS step is handled by submitAll function
            return;
        }

        // Original logic for single evidence type (PHOTO or VIDEO only)
        let file: File;
        let type: 'PHOTO' | 'VIDEO' = 'PHOTO';

        if (capturedImage) {
            // Convert DataURL to File
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            file = new File([blob], "evidence_opt.jpg", { type: "image/jpeg" });
            type = 'PHOTO';
        } else if (capturedVideo) {
            // If it's from gallery (File) or camera (Blob), ensure it's a File
            const fileName = galleryFile ? galleryFile.name : "evidence_opt.webm";
            const fileType = galleryFile ? galleryFile.type : "video/webm";

            // If it's already a file (gallery), use it, otherwise create from blob
            if (capturedVideo instanceof File) {
                file = capturedVideo;
            } else {
                file = new File([capturedVideo], fileName, { type: fileType });
            }
            type = 'VIDEO';
        } else {
            return;
        }

        onCapture(file, {
            lat: location?.lat || 0,
            lng: location?.lng || 0,
            capturedAt: new Date(),
            type
        });
    };

    // New function to submit all evidence for BOTH type
    const submitAll = () => {
        if (!photoFile || !videoFile) {
            toast.error('Faltan evidencias por capturar');
            return;
        }

        const meta = {
            lat: location?.lat || 0,
            lng: location?.lng || 0,
            capturedAt: new Date(),
            comments: comments.trim() || undefined
        };

        // Submit photo first
        onCapture(photoFile, { ...meta, type: 'PHOTO' });

        // Submit video second
        setTimeout(() => {
            onCapture(videoFile, { ...meta, type: 'VIDEO' });
        }, 100);

        toast.success('Evidencias enviadas correctamente');
    };

    const retake = () => {
        setCapturedImage(null);
        setCapturedVideo(null);
        setCapturedVideoUrl(null);
        setGalleryFile(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="w-full aspect-[9/16] max-h-[70vh] bg-neutral-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-white/10">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-bold mb-2">Error de Cámara</h3>
                <p className="text-gray-400 text-sm mb-6">{error}</p>
                <button
                    onClick={() => startCamera()}
                    className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Comments screen for BOTH type
    if (evidenceType === 'BOTH' && currentStep === 'COMMENTS') {
        return (
            <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <div className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-200 text-sm font-bold mb-4">
                            <Check className="w-4 h-4" />
                            Evidencias Capturadas
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Paso 3 de 3</h3>
                        <p className="text-gray-400 text-sm">Agrega comentarios si es necesario</p>
                    </div>

                    {/* Preview thumbnails */}
                    <div className="flex gap-3 mb-6">
                        <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">📸 Foto</div>
                            <div className="text-xs text-green-400">✓ Capturada</div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">🎥 Video</div>
                            <div className="text-xs text-green-400">✓ Capturado</div>
                        </div>
                    </div>

                    {/* Comments textarea */}
                    <div className="flex-1 mb-6">
                        <label className="block text-white text-sm font-bold mb-2">
                            Comentarios (opcional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Ej: Falta material de limpieza, se requiere más tiempo, etc..."
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {comments.length}/500
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                // Reset to start over
                                setCurrentStep('PHOTO');
                                setMode('PHOTO');
                                setPhotoFile(null);
                                setVideoFile(null);
                                setComments('');
                                toast.info('Reiniciando captura');
                            }}
                            className="flex-1 px-6 py-3 bg-white/10 text-white rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
                        >
                            Reiniciar
                        </button>
                        <button
                            onClick={submitAll}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-bold text-sm hover:from-cyan-600 hover:to-blue-600 transition-colors shadow-lg"
                        >
                            Enviar Todo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewport: Live or Preview */}
            <div className="absolute inset-0 bg-black">
                {!capturedImage && !capturedVideo ? (
                    <video
                        ref={setVideoNode}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                ) : (
                    capturedImage ? (
                        <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <video
                            src={capturedVideoUrl!}
                            controls
                            className="w-full h-full object-contain bg-black"
                        />
                    )
                )}
            </div>

            {/* Overlays (Only when live camera is active) */}
            {!capturedImage && !capturedVideo && (
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-10 pointer-events-none">

                    {/* Top Bar */}
                    <div className="flex justify-center pointer-events-auto">
                        <div className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full text-xs border ${location ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'}`}>
                            <MapPin className="w-3 h-3" />
                            {location ? "GPS Activo" : "Sin GPS (Permitido)"}
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex flex-col items-center pointer-events-auto">

                        {/* Progress Indicator for BOTH type */}
                        {evidenceType === 'BOTH' && !isRecording && (
                            <div className="flex items-center gap-2 mb-6 backdrop-blur-md bg-white/10 rounded-full px-4 py-2">
                                <div className={`flex items-center gap-1.5 ${currentStep === 'PHOTO' ? 'text-white' : 'text-green-400'}`}>
                                    {currentStep === 'PHOTO' ? (
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    ) : (
                                        <Check className="w-3 h-3" />
                                    )}
                                    <span className="text-xs font-bold">Foto</span>
                                </div>
                                <div className="w-8 h-0.5 bg-white/30" />
                                <div className={`flex items-center gap-1.5 ${currentStep === 'VIDEO' ? 'text-white' : currentStep === 'COMMENTS' ? 'text-green-400' : 'text-white/40'}`}>
                                    {currentStep === 'VIDEO' ? (
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    ) : currentStep === 'COMMENTS' ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    )}
                                    <span className="text-xs font-bold">Video</span>
                                </div>
                                <div className="w-8 h-0.5 bg-white/30" />
                                <div className={`flex items-center gap-1.5 ${currentStep === 'COMMENTS' ? 'text-white' : 'text-white/40'}`}>
                                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    <span className="text-xs font-bold">Enviar</span>
                                </div>
                            </div>
                        )}

                        {/* Capture Button */}
                        <div className="relative mb-6">
                            {mode === 'PHOTO' ? (
                                <button
                                    onClick={takePhoto}
                                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 hover:bg-white/10"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full" />
                                </button>
                            ) : (
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500' : 'border-white'}`}
                                >
                                    {isRecording ? (
                                        <div className="w-10 h-10 bg-red-500 rounded-sm" />
                                    ) : (
                                        <div className="w-16 h-16 bg-red-500 rounded-full outline outline-2 outline-white/20 outline-offset-2" />
                                    )}
                                </button>
                            )}

                            {/* Gallery Button (Bottom Right of capture) */}
                            {!isRecording && mode === 'PHOTO' && (
                                <div className="absolute left-[120%] top-1/2 -translate-y-1/2">
                                    <label className="flex flex-col items-center gap-1 cursor-pointer text-white/80 hover:text-white transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                                            <Square className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleGalleryUpload}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Timer */}
                        {isRecording && (
                            <div className="absolute top-[-50px] flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white font-mono font-bold font-lg">{formatTime(recordingTime)}</span>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Actions (Review Mode) */}
            {(capturedImage || capturedVideo) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-8 z-50">
                    <p className="text-white font-bold text-xl drop-shadow-lg">
                        ¿Usar esta evidencia?
                    </p>
                    <div className="flex gap-8">
                        <button
                            onClick={retake}
                            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 shadow-lg"
                        >
                            <RefreshCw className="w-8 h-8" />
                        </button>
                        <button
                            onClick={confirmCapture}
                            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
                        >
                            <Check className="w-10 h-10" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
