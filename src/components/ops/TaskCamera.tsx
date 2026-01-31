'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, MapPin, AlertTriangle, Video, Square, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCameraProps {
    onCapture: (file: File, meta: { lat: number, lng: number, capturedAt: Date, type: 'PHOTO' | 'VIDEO' }) => void;
    evidenceType: 'PHOTO' | 'VIDEO' | 'BOTH';
}

export default function TaskCamera({ onCapture, evidenceType }: TaskCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedVideo, setCapturedVideo] = useState<Blob | null>(null);
    const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);

    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mode: If BOTH, user can switch. Else fixed.
    const [mode, setMode] = useState<'PHOTO' | 'VIDEO'>(evidenceType === 'BOTH' ? 'PHOTO' : evidenceType);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Initialize Camera
    useEffect(() => {
        startCamera();
        return () => {
            stopStream();
        };
    }, []);

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Rear camera preferred
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true // Needed for video
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.muted = true; // Mute preview to avoid feedback
            }

            // Get Location concurrently
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => toast.error("Se requiere ubicación para validar la tarea.")
            );

        } catch (err: any) {
            console.error("Camera error:", err);
            setError("No se pudo acceder a la cámara o micrófono. Verifica los permisos.");
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !location) {
            if (!location) toast.error("Esperando señal GPS...");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Watermark
            const dateStr = new Date().toLocaleString();
            context.font = '20px Arial';
            context.fillStyle = 'white';
            context.shadowColor = 'black';
            context.shadowBlur = 4;
            context.fillText(`${dateStr}`, 20, canvas.height - 50);
            context.fillText(`Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`, 20, canvas.height - 20);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(dataUrl);
            setCapturedVideo(null);
        }
    };

    const startRecording = () => {
        if (!stream || !location) {
            if (!location) toast.error("Esperando señal GPS...");
            return;
        }

        const options = { mimeType: 'video/webm;codecs=vp8,opus' };
        // Fallback for Safari/iOS uses mp4 usually or different mime

        try {
            const recorder = new MediaRecorder(stream); // Let browser choose default if specific fails
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

    const confirmCapture = async () => {
        if ((!capturedImage && !capturedVideo) || !location) return;

        let file: File;
        let type: 'PHOTO' | 'VIDEO' = 'PHOTO';

        if (capturedImage) {
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            file = new File([blob], "evidence.jpg", { type: "image/jpeg" });
            type = 'PHOTO';
        } else if (capturedVideo) {
            file = new File([capturedVideo], "evidence.webm", { type: "video/webm" });
            type = 'VIDEO';
        } else {
            return;
        }

        onCapture(file, {
            lat: location.lat,
            lng: location.lng,
            capturedAt: new Date(),
            type
        });
    };

    const retake = () => {
        setCapturedImage(null);
        setCapturedVideo(null);
        setCapturedVideoUrl(null);
    };

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-center text-red-200">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p>{error}</p>
                <button onClick={startCamera} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white text-sm">
                    Reintentar
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewport */}
            {!capturedImage && !capturedVideo ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted // Muted for preview
                        className="w-full h-full object-cover"
                    />

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center z-20">
                        {/* GPS Badge */}
                        <div className="mb-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-white/80 border border-white/10">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {location ? "Ubicación Validada" : "Buscando GPS..."}
                        </div>

                        {/* Mode Switcher (If BOTH) */}
                        {evidenceType === 'BOTH' && !isRecording && (
                            <div className="flex bg-white/10 rounded-full p-1 mb-6 backdrop-blur-md">
                                <button
                                    onClick={() => setMode('PHOTO')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'PHOTO' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    FOTO
                                </button>
                                <button
                                    onClick={() => setMode('VIDEO')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'VIDEO' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    VIDEO
                                </button>
                            </div>
                        )}

                        {/* Shutter Button */}
                        <div className="relative">
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
                        </div>

                        {/* Recording Timer */}
                        {isRecording && (
                            <div className="absolute top-[-40px] flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white font-mono font-bold">{formatTime(recordingTime)}</span>
                            </div>
                        )}

                    </div>
                </>
            ) : (
                <>
                    {/* Review Mode */}
                    {capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                        <video
                            src={capturedVideoUrl!}
                            controls
                            className="w-full h-full object-contain bg-black"
                        />
                    )}

                    {/* Actions */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-6 z-30">
                        <div className="flex gap-6">
                            <button
                                onClick={retake}
                                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
                            >
                                <RefreshCw className="w-7 h-7" />
                            </button>
                            <button
                                onClick={confirmCapture}
                                className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
                            >
                                <Check className="w-9 h-9" />
                            </button>
                        </div>
                        <p className="text-white font-bold text-lg drop-shadow-md">
                            Confirmar {capturedImage ? 'Foto' : 'Video'}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
