"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { validateVisitScan, logCustomerVisit, redeemReward } from "@/actions/loyalty"
import { validateReservationScan, confirmReservationCheckin } from "@/actions/reservations"
import { Loader2, ScanLine, Tag, UtensilsCrossed, X, DollarSign, Camera, RefreshCcw, UploadCloud, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import jsQR from "jsqr"
import { Capacitor } from "@capacitor/core"
import { BarcodeScanner } from "@capacitor-community/barcode-scanner"

interface StaffScannerProps {
    staffId: string
    branchId?: string | null
}

export function StaffScanner({ staffId, branchId }: StaffScannerProps) {
    const router = useRouter()
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [scannerError, setScannerError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
    const [isNativeScanner, setIsNativeScanner] = useState(false)

    // Use consistent ref for the scanner instance
    const scannerRef = useRef<Html5Qrcode | null>(null)

    // Unified Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [scanType, setScanType] = useState<"POINTS" | "VISITS">("VISITS")
    const [availableModes, setAvailableModes] = useState<("POINTS" | "VISITS")[]>([])

    const [pendingVisitToken, setPendingVisitToken] = useState<string | null>(null)
    const [customerName, setCustomerName] = useState("")
    const [programName, setProgramName] = useState("") // New state for Business Name
    const [spendAmount, setSpendAmount] = useState("")

    // Redemption Evidence State
    const [showRedemptionModal, setShowRedemptionModal] = useState(false)
    const [pendingRedemptionCode, setPendingRedemptionCode] = useState<string | null>(null)
    const [evidenceBase64, setEvidenceBase64] = useState<string | null>(null)

    // Reservation State
    const [showReservationModal, setShowReservationModal] = useState(false)
    const [pendingReservation, setPendingReservation] = useState<any>(null)

    useEffect(() => {
        const initNativeScanner = async () => {
            try {
                // Wait briefly so UI can settle before requesting camera
                await new Promise(res => setTimeout(res, 200))

                const status = await BarcodeScanner.checkPermission({ force: true })
                if (status.granted) {
                    setIsNativeScanner(true)

                    document.documentElement.classList.add("qr-scanner-active")
                    document.body.classList.add("qr-scanner-active")

                    await BarcodeScanner.hideBackground()
                    // Prepare before starting to prevent black screen on first launch
                    await BarcodeScanner.prepare()

                    const result = await BarcodeScanner.startScan()

                    if (result.hasContent && result.content) {
                        handleScan(result.content)
                        // Stop after scan to process
                        BarcodeScanner.stopScan()
                        document.documentElement.classList.remove("qr-scanner-active")
                        document.body.classList.remove("qr-scanner-active")
                    }
                } else {
                    setScannerError("Permisos de cámara denegados")
                }
            } catch (err) {
                console.error("Native Scanner error", err)
                setScannerError("Error al iniciar cámara nativa")
            }
        }

        if (Capacitor.isNativePlatform()) {
            initNativeScanner()
            return () => {
                BarcodeScanner.stopScan()
                document.documentElement.classList.remove("qr-scanner-active")
                document.body.classList.remove("qr-scanner-active")
            }
        } else {
            // Web HTML5 Scanner fallback
            const scanner = new Html5Qrcode("reader")
            scannerRef.current = scanner
            startScanning(scanner, facingMode)

            return () => {
                if (scanner.isScanning) {
                    scanner.stop().then(() => scanner.clear()).catch(err => console.error("Failed to stop scanner", err))
                } else {
                    scanner.clear()
                }
            }
        }
    }, [facingMode])

    const startScanning = (scanner: Html5Qrcode, mode: "user" | "environment") => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        }

        scanner.start(
            { facingMode: mode },
            config,
            (decodedText) => {
                handleScan(decodedText)
            },
            (errorMessage) => {
                // ignore frames without QR
            }
        ).catch(err => {
            console.error("Error starting scanner:", err)
            setScannerError("No se pudo iniciar la cámara. Verifica los permisos.")
        })
    }

    const toggleCamera = async () => {
        const scanner = scannerRef.current
        if (!scanner) return

        try {
            if (scanner.isScanning) {
                await scanner.stop()
            }
            const newMode = facingMode === "environment" ? "user" : "environment"
            setFacingMode(newMode)
            startScanning(scanner, newMode)
        } catch (err) {
            console.error("Failed to toggle camera:", err)
            toast.error("Error al cambiar de cámara")
        }
    }

    const handleScan = async (data: string) => {
        // Prevent concurrent handling if multiple frames trigger before pause
        if (isProcessing) return
        setIsProcessing(true)

        // PAUSE SCANNER PHYSICALLY (Freeze frame)
        if (scannerRef.current?.isScanning) {
            try {
                scannerRef.current.pause(true)
            } catch (e) {
                console.log("Pause not supported or failed", e)
            }
        }

        let type = "UNKNOWN"
        let payload = data

        // Normalize payload logic
        let hintType: "POINTS" | "VISITS" | null = null

        if (data.includes("/reservations/checkin/") || data.startsWith("RESERVATION:")) {
            type = "RESERVATION"
            if (data.startsWith("RESERVATION:")) {
                payload = data.substring(12)
            } else {
                payload = data.split("/reservations/checkin/")[1]?.split("?")[0] || data
            }
        } else if (data.includes("http") || data.includes("happymeters.com")) {
            try {
                const urlObj = new URL(data)

                // Specific Check for Loyalty Scan Path
                if (urlObj.pathname.includes("/scan/")) {
                    payload = urlObj.pathname.split("/scan/")[1]?.split("?")[0] || ""
                    type = "VISIT"
                } else {
                    // General fallback: last part of path
                    const parts = urlObj.pathname.split('/').filter(p => p.length > 0)
                    payload = parts[parts.length - 1] || ""
                    type = "VISIT"
                }

                // Extract hint
                const typeParam = urlObj.searchParams.get('type')
                if (typeParam === 'POINTS') hintType = 'POINTS'
                if (typeParam === 'VISITS') hintType = 'VISITS'

            } catch (e) {
                if (data.includes("/scan/")) {
                    payload = data.split("/scan/")[1]?.split("?")[0] || data
                    type = "VISIT"
                }
            }
        } else if (data.startsWith("V:")) {
            type = "VISIT"
            payload = data.substring(2)
        } else if (data.startsWith("R:")) {
            type = "REDEEM"
            payload = data.substring(2)
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
            // Raw UUIDs are likely reservations in this context
            type = "RESERVATION"
            payload = data
        }


        console.log(`Scan handling: Raw=${data}, Type=${type}, Payload=${payload}`)

        if (type === 'VISIT') {
            toast.loading("Verificando cliente...")

            // VALIDATE FIRST
            const validation: any = await validateVisitScan(payload) // Cast to any to access new fields safely if TS doesn't catch up yet

            if (validation.success) {
                toast.dismiss()

                // Store scan details
                setPendingVisitToken(payload)
                setCustomerName(validation.customerName || "Cliente")
                setProgramName(validation.businessName || "")

                // Determine Available Modes
                const modes: ("POINTS" | "VISITS")[] = []
                if (validation.hasPoints) modes.push("POINTS")
                if (validation.hasVisits) modes.push("VISITS")

                setAvailableModes(modes)

                // Default selection strategy
                if (modes.length > 0) {
                    // Respect encoded hint if available AND supported
                    if (hintType && modes.includes(hintType)) {
                        setScanType(hintType)
                    } else {
                        // Default to VISITS (Lower friction default)
                        setScanType("VISITS")
                    }
                } else {
                    // Fallback
                    setScanType("VISITS")
                }

                // Show Confirmation Modal
                setShowConfirmModal(true)

            } else {
                toast.dismiss()
                toast.error(`Cliente no encontrado`, {
                    description: `Código: ${payload.substring(0, 15)}...`,
                    duration: 3000
                })
                // Resume after delay to allow reading error
                resumeScanner(2000)
            }

        } else if (type === 'REDEEM') {
            // STOP! Ask for evidence first
            setPendingRedemptionCode(payload)
            setEvidenceBase64(null)
            setShowRedemptionModal(true)
            setIsProcessing(false) // Wait for user interaction
        } else if (type === 'RESERVATION') {
            toast.loading("Buscando reservación...")
            const res = await validateReservationScan(payload, branchId || staffId)
            toast.dismiss()

            if (res.success) {
                setPendingReservation(res)
                setShowReservationModal(true)
            } else {
                toast.error(res.error || "No se encontró la reservación")
                resumeScanner(2000)
            }
            setIsProcessing(false)
        } else {
            // Unknown type
            toast.error("Formato QR no reconocido")
            resumeScanner(2000)
        }
    }

    const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen debe pesar menos de 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setEvidenceBase64(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleConfirmRedemption = async () => {
        if (!pendingRedemptionCode) return

        // Removed mandatory evidence check as per potential flexibility, 
        // but user requested it. Let's make it mandatory for "Evidence Flow".
        if (!evidenceBase64) {
            toast.error("Debes adjuntar una foto de evidencia")
            return
        }

        toast.loading("Procesando premio...")
        const res = await redeemReward(staffId, pendingRedemptionCode, evidenceBase64)

        if (res.success) {
            toast.dismiss()
            toast.success(`PREMIO ENTREGADO: ${res.rewardName}`, {
                description: `Cliente: ${res.customerName}`,
                duration: 5000,
                icon: <Tag className="w-5 h-5 text-purple-500" />
            })
            setShowRedemptionModal(false)
            setPendingRedemptionCode(null)
            setEvidenceBase64(null)
            resumeScanner(3000)
        } else {
            toast.dismiss()
            toast.error(res.error || "Código inválido o ya usado")
            // Keep modal open on error? Or close?
            // If invalid code, maybe close.
            if (res.error?.includes("inválido")) {
                setShowRedemptionModal(false)
                resumeScanner(2000)
            }
        }
    }

    const resumeScanner = (delayMs: number = 0) => {
        setTimeout(() => {
            setIsProcessing(false)
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume()
                } catch (e) {
                    // If resume fails, it might not be paused or state issue.
                    // Just ensure processing flag is off.
                    console.log("Resume callback warning", e)
                }
            }
        }, delayMs)
    }

    const handleConfirmCheckin = async () => {
        if (!pendingReservation) return
        toast.loading("Confirmando llegada...")
        const res = await confirmReservationCheckin(pendingReservation.reservationId)
        toast.dismiss()

        if (res.success) {
            toast.success("¡Llegada confirmada!", {
                description: `Cliente: ${pendingReservation.customerName}`,
                duration: 5000
            })
            setShowReservationModal(false)
            setPendingReservation(null)
            resumeScanner(3000)
        } else {
            toast.error(res.error || "Error al confirmar")
        }
    }

    const submitVisit = async (token: string, amount: number = 0) => {
        toast.loading("Registrando visita...")
        const res = await logCustomerVisit(staffId, token, undefined, amount > 0 ? { spendAmount: amount } : undefined)

        toast.dismiss()
        if (res.success) {
            toast.success(`Visita registrada!\n${res.tierName ? `MEMBER ${res.tierName}` : ""}`, {
                description: amount > 0 ? `Puntos ganados: ${res.pointsEarned}` : `Total de visitas: ${res.newVisits}`,
                duration: 4000,
                icon: <UtensilsCrossed className="w-5 h-5 text-green-500" />
            })
            // Reset modal
            setShowConfirmModal(false)
            setPendingVisitToken(null)
            setSpendAmount("")
            resumeScanner(3000)
        } else {
            toast.error(res.error || "Error al registrar")
            resumeScanner(2000)
        }
    }

    const handleConfirmVisit = () => {
        if (!pendingVisitToken) return

        if (scanType === 'POINTS') {
            const amount = parseFloat(spendAmount) || 0
            if (amount <= 0) {
                toast.error("Ingresa un monto válido")
                return
            }
            submitVisit(pendingVisitToken, amount)
        } else {
            // Visits based - simple confirmation
            submitVisit(pendingVisitToken, 0)
        }
    }

    return (
        <div className={`w-full max-w-md mx-auto relative ${isNativeScanner ? "h-screen flex items-center justify-center p-0 m-0" : ""}`}>
            <style jsx global>{`
                #reader__scan_region {
                    background: white !important;
                }
                #reader__dashboard_section_csr span,
                #reader__dashboard_section_swaplink {
                    color: #1e293b !important; /* slate-800 */
                    font-weight: 500 !important;
                }
                #reader__dashboard_section_csr button {
                    color: #4f46e5 !important; /* indigo-600 */
                    border-color: #4f46e5 !important;
                    background: white !important;
                }
                #reader select {
                    color: #1e293b !important;
                    background: white !important;
                    border: 1px solid #e2e8f0 !important;
                }
                /* NATIVE SCANNER GLOBAL TRANSPARENCY */
                html.qr-scanner-active,
                body.qr-scanner-active,
                body.qr-scanner-active #__next, 
                body.qr-scanner-active main,
                body.qr-scanner-active [data-reactroot],
                body.qr-scanner-active .scanner-overlay-container {
                    background: transparent !important;
                }
                body.qr-scanner-active .hide-on-scan {
                    display: none !important;
                }
            `}</style>

            {/* NATIVE SCANNER OVERLAY */}
            {isNativeScanner ? (
                <div className="scanner-overlay-container fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-transparent pointer-events-none">
                    {/* Visual Target Box */}
                    <div className="w-[70vw] h-[70vw] max-w-[300px] max-h-[300px] border-4 border-indigo-500 rounded-3xl mb-8 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1"></div>
                    </div>
                    <p className="text-white text-lg font-bold drop-shadow-md bg-black/50 px-6 py-2 rounded-full backdrop-blur-md">Apunte al código QR</p>

                    <button
                        onClick={() => {
                            BarcodeScanner.stopScan();
                            document.documentElement.classList.remove("qr-scanner-active");
                            document.body.classList.remove("qr-scanner-active");
                            setIsNativeScanner(false);
                            router.refresh()
                        }}
                        className="pointer-events-auto mt-12 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
                    >
                        <X className="w-5 h-5" /> Cancelar
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 hide-on-scan">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                                <ScanLine className="w-5 h-5 text-indigo-600" /> Escáner Operativo
                            </h2>
                            <p className="text-sm text-slate-500">Visitas, puntos, premios o reservaciones</p>
                        </div>

                        <div className="relative">
                            <div id="reader" className="w-full overflow-hidden rounded-lg min-h-[300px] bg-black"></div>

                            {/* Toggle Camera Button */}
                            <button
                                onClick={toggleCamera}
                                className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all shadow-lg active:scale-95 z-10"
                            >
                                <RefreshCcw className="w-6 h-6" />
                            </button>

                            {/* iOS iPad WebRTC Fallback */}
                            <div className="absolute top-4 left-4 z-10">
                                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600/90 backdrop-blur-md text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-900/40 cursor-pointer hover:bg-indigo-500 active:scale-95 transition-all">
                                    <Camera className="w-4 h-4" />
                                    <span>Captura Manual (iOS)</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            toast.loading("Buscando código...");
                                            try {
                                                // We use jsQR to bypass Html5Qrcode.scanFile() scaling/rotation bugs on iPad
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const img = new window.Image();
                                                    img.onload = () => {
                                                        const canvas = document.createElement("canvas");
                                                        const ctx = canvas.getContext("2d");

                                                        // Downscale large iOS photos locally to avoid memory crash & speed up
                                                        // Increased to 2500 for better QR detection
                                                        const MAX_WIDTH = 2500;
                                                        let width = img.width;
                                                        let height = img.height;

                                                        if (width > MAX_WIDTH) {
                                                            height = Math.round((height * MAX_WIDTH) / width);
                                                            width = MAX_WIDTH;
                                                        }

                                                        canvas.width = width;
                                                        canvas.height = height;
                                                        if (ctx) {
                                                            ctx.drawImage(img, 0, 0, width, height);
                                                            const imageData = ctx.getImageData(0, 0, width, height);
                                                            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                                                inversionAttempts: "attemptBoth",
                                                            });

                                                            toast.dismiss();
                                                            if (code && code.data) {
                                                                handleScan(code.data);
                                                            } else {
                                                                toast.error("No se detectó ningún código QR en la foto");
                                                            }
                                                        }
                                                    };
                                                    img.src = event.target?.result as string;
                                                };
                                                reader.readAsDataURL(file);
                                            } catch (err) {
                                                toast.dismiss();
                                                toast.error("Error al procesar la imagen: " + String(err));
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {scannerError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                {scannerError}
                                <p className="mt-2 text-xs opacity-80">
                                    Si estás en iPad/iPhone, usa la <b>Captura Manual</b> de arriba.
                                </p>
                            </div>
                        )}

                        {isProcessing && !showConfirmModal && (
                            <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                            </div>
                        )}
                    </div>

                    {/* CONFIRMATION / AMOUNT MODAL */}
                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            {scanType === 'POINTS' ? 'Registrar Consumo' : 'Registrar Visita'}
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            <span className="font-bold">{customerName}</span>
                                            {programName && <span className="block text-indigo-600 font-bold text-xs mt-1 bg-indigo-50 px-2 py-1 rounded-md inline-block w-fit">{programName}</span>}
                                        </p>
                                    </div>
                                    <button onClick={() => { setShowConfirmModal(false); setPendingVisitToken(null); setIsProcessing(false); resumeScanner(500); }} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* MODE SWITCHER */}
                                {availableModes.length > 1 && (
                                    <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                                        <button
                                            onClick={() => setScanType("VISITS")}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${scanType === "VISITS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            Visita
                                        </button>
                                        <button
                                            onClick={() => setScanType("POINTS")}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${scanType === "POINTS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            Puntos
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4 mb-6">
                                    {scanType === 'POINTS' ? (
                                        <>
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Monto del Ticket</label>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-6 h-6 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        value={spendAmount}
                                                        onChange={(e) => setSpendAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        autoFocus
                                                        className="bg-transparent text-3xl font-bold text-slate-900 w-full outline-none placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>
                                            <button className="w-full py-3 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-200 transition-colors">
                                                <Camera className="w-4 h-4" />
                                                <span className="font-medium">Adjuntar Foto del Ticket</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
                                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <UtensilsCrossed className="w-8 h-8" />
                                            </div>
                                            <p className="text-indigo-900 font-medium">
                                                ¿Confirmar visita para <strong>{customerName}</strong>?
                                            </p>
                                            <p className="text-indigo-600/70 text-xs mt-1">Se sumará 1 visita a su cuenta.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowConfirmModal(false); setPendingVisitToken(null); setIsProcessing(false); resumeScanner(500); }}
                                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmVisit}
                                        disabled={scanType === 'POINTS' && !spendAmount}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                                    >
                                        {scanType === 'POINTS' ? 'Confirmar Monto' : 'Registrar Visita'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REDEMPTION EVIDENCE MODAL */}
                    {showRedemptionModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Entregar Premio
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Evidencia de entrega requerida
                                        </p>
                                    </div>
                                    <button onClick={() => { setShowRedemptionModal(false); setPendingRedemptionCode(null); setIsProcessing(false); resumeScanner(500); }} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6 mb-6">
                                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
                                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Tag className="w-8 h-8" />
                                        </div>
                                        <p className="text-purple-900 font-medium">
                                            Escaneaste un Cupón
                                        </p>
                                        <p className="text-purple-600/70 text-xs mt-1">Sube una foto entregando el producto.</p>
                                    </div>

                                    {/* PHOTO UPLOAD */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group cursor-pointer w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 hover:border-purple-500 transition-colors">
                                            {evidenceBase64 ? (
                                                <Image src={evidenceBase64} alt="Evidence" fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                    <Camera className="w-10 h-10 mb-2 opacity-50" />
                                                    <span className="text-xs uppercase font-bold">Tomar Foto</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleEvidenceFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowRedemptionModal(false); setPendingRedemptionCode(null); setIsProcessing(false); resumeScanner(500); }}
                                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmRedemption}
                                        disabled={!evidenceBase64}
                                        className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                                    >
                                        Confirmar Entrega
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* RESERVATION CHECK-IN MODAL */}
                    {showReservationModal && pendingReservation && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Reservación
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Confirmar llegada del cliente
                                        </p>
                                    </div>
                                    <button onClick={() => { setShowReservationModal(false); setPendingReservation(null); resumeScanner(500); }} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <UtensilsCrossed className="w-8 h-8" />
                                        </div>
                                        <p className="text-indigo-900 font-bold text-lg">
                                            {pendingReservation.customerName}
                                        </p>
                                        <div className="mt-2 text-sm text-indigo-600 space-y-1">
                                            <p>Mesa: <span className="font-bold">{pendingReservation.tableLabel}</span></p>
                                            <p>Personas: <span className="font-bold">{pendingReservation.partySize}</span></p>
                                            <p>Hora: <span className="font-bold">{new Date(pendingReservation.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowReservationModal(false); setPendingReservation(null); resumeScanner(500); }}
                                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={handleConfirmCheckin}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Confirmar Llegada
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
