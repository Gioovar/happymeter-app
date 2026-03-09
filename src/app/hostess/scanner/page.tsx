"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X, CheckCircle2, UserCircle, Users, Clock } from "lucide-react";
import { scanReservationQR, updateReservationHostess } from "@/actions/hostess";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";

export default function ScannerPage() {
    const { user } = useUser();
    const [isScanning, setIsScanning] = useState(true);
    const [scannedRes, setScannedRes] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editGuests, setEditGuests] = useState<number>(0);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // We need the branchId. In a real scenario we might fetch this from context or an API.
    // For now, scanReservationQR will check if the user's branch matches the reservation's branch.
    // We can pass the user.id as the branchId (since ownerId = branchId for typical setups),
    // but Hostess might be a TeamMember. We should probably fetch the branchId from their team membership.
    // We'll let the server action handle it by passing userId or fetching it cleanly.
    // To keep it simple, we pass the user's ID and let the server securely resolve the branch.

    useEffect(() => {
        let scanner: Html5Qrcode;

        const startScanner = async () => {
            try {
                scanner = new Html5Qrcode("reader");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    async (decodedText) => {
                        // Pause scanning while processing
                        if (isProcessing) return;
                        setIsProcessing(true);
                        scanner.pause();

                        // Expected QR Data: just the reservation ID or a JSON with it
                        let resId = decodedText;
                        try {
                            const parsed = JSON.parse(decodedText);
                            if (parsed.id) resId = parsed.id;
                        } catch (e) {
                            // Not JSON, assume plain text ID
                        }

                        const branchId = user?.id || ""; // In production, resolve the actual branch ID for the hostess
                        const result = await scanReservationQR(resId, branchId);

                        if (result.success && result.data) {
                            setScannedRes(result.data);
                            setEditGuests(result.data.actualGuests || result.data.partySize);
                            setIsScanning(false);
                            scanner.stop();
                        } else {
                            toast.error(result.error);
                            setTimeout(() => {
                                scanner.resume();
                                setIsProcessing(false);
                            }, 2000);
                        }
                    },
                    (errorMessage) => {
                        // Ignore normal read errors
                    }
                );
            } catch (err) {
                console.error("Failed to start scanner:", err);
                toast.error("No se pudo iniciar la cámara.");
            }
        };

        if (isScanning) {
            startScanner();
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [isScanning, user?.id, isProcessing]);

    const handleConfirmArrival = async () => {
        if (!scannedRes) return;
        setIsProcessing(true);

        try {
            const result = await updateReservationHostess({
                reservationId: scannedRes.id,
                status: "CHECKED_IN",
                actualGuests: editGuests,
                adminId: user?.id || "unknown",
            });

            if (result.success) {
                toast.success("¡Llegada confirmada exitosamente!");
                setScannedRes(null);
                setIsProcessing(false);
                setIsScanning(true); // Restart scanner
            } else {
                toast.error(result.error);
                setIsProcessing(false);
            }
        } catch (error) {
            toast.error("Ocurrió un error.");
            setIsProcessing(false);
        }
    };

    const cancelScan = () => {
        setScannedRes(null);
        setIsProcessing(false);
        setIsScanning(true);
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="pt-12 pb-6 px-6 relative z-10 bg-gradient-to-b from-sky-900/20 to-black backdrop-blur-md">
                <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                    Escáner <span className="font-bold text-sky-500">QR</span>
                </h1>
                <p className="text-white/60 text-sm">Escanea el código del cliente para Check-in</p>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-6">

                {isScanning && (
                    <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden border-2 border-sky-500/50 shadow-[0_0_40px_rgba(14,165,233,0.2)]">
                        <div id="reader" className="w-full h-full object-cover"></div>

                        {/* Scanner Overlay UI */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-sky-400 border-dashed opacity-50 rounded-xl" />
                        </div>
                    </div>
                )}

                {!isScanning && scannedRes && (
                    <div className="w-full max-w-md bg-[#111111] border border-sky-500/30 rounded-3xl p-6 animate-in zoom-in-95 mt-[-10vh]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <button onClick={cancelScan} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-semibold text-white mb-1">{scannedRes.customerName}</h2>
                        <p className="text-white/50 text-sm mb-6 pb-6 border-b border-white/10">
                            Validado en la sucursal actual
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <span className="text-white/60 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Hora:
                                </span>
                                <span className="text-white font-medium">{format(new Date(scannedRes.date), "HH:mm")}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Users className="w-4 h-4 text-sky-400" />
                                    <span>Asistentes Reales:</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditGuests(Math.max(1, editGuests - 1))}
                                        className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                                    >
                                        -
                                    </button>
                                    <span className="text-2xl font-bold text-sky-400 w-8 text-center">{editGuests}</span>
                                    <button
                                        onClick={() => setEditGuests(editGuests + 1)}
                                        className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {scannedRes.promoter && (
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 flex items-center gap-2">
                                        <UserCircle className="w-4 h-4" /> RP Asignado:
                                    </span>
                                    <span className="text-white font-medium">{scannedRes.promoter.name}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleConfirmArrival}
                            disabled={isProcessing}
                            className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all active:scale-95"
                        >
                            Confirmar Llegada
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
