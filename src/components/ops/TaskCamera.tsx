'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCameraProps {
    onCapture: (file: File, meta: { lat: number, lng: number, capturedAt: Date }) => void;
    evidenceType: 'PHOTO' | 'VIDEO';
}

export default function TaskCamera({ onCapture, evidenceType }: TaskCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Initialize Camera
    useEffect(() => {
        startCamera();
        return () => {
            // Cleanup tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Rear camera preferred
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setIsStreaming(true);
            }

            // Get Location concurrently
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => toast.error("Se requiere ubicación para validar la tarea.")
            );

        } catch (err: any) {
            console.error("Camera error:", err);
            setError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        if (!location) {
            toast.error("Esperando señal GPS...");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Draw Timestamp & Location Overlay (Watermark)
            const dateStr = new Date().toLocaleString();
            context.font = '20px Arial';
            context.fillStyle = 'white';
            context.shadowColor = 'black';
            context.shadowBlur = 4;
            context.fillText(`${dateStr}`, 20, canvas.height - 50);
            context.fillText(`Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`, 20, canvas.height - 20);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(dataUrl);
        }
    };

    const confirmCapture = async () => {
        if (!capturedImage || !location) return;

        // Convert Base64 to File
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });

        onCapture(file, {
            lat: location.lat,
            lng: location.lng,
            capturedAt: new Date() // Real time capture
        });
    };

    const retake = () => {
        setCapturedImage(null);
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
            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* Camera Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                        {/* GPS Stick */}
                        <div className="mb-6 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-white/80 border border-white/10">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {location ? "Ubicación Validada" : "Buscando GPS..."}
                        </div>

                        <button
                            onClick={takePhoto}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center mb-4 transition-transform active:scale-95 hover:bg-white/10"
                        >
                            <div className="w-16 h-16 bg-white rounded-full" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />

                    {/* Confirmation Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                        <div className="flex gap-4">
                            <button
                                onClick={retake}
                                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <RefreshCw className="w-6 h-6" />
                            </button>
                            <button
                                onClick={confirmCapture}
                                className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
                            >
                                <Check className="w-8 h-8" />
                            </button>
                        </div>
                        <p className="text-white font-medium drop-shadow-md">¿Enviar evidencia?</p>
                    </div>
                </>
            )}
        </div>
    );
}
