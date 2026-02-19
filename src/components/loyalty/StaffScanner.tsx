"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { validateVisitScan, logCustomerVisit, redeemReward } from "@/actions/loyalty"
import { validateReservationScan, confirmReservationCheckin } from "@/actions/reservations"
import { Loader2, ScanLine, Tag, UtensilsCrossed, X, DollarSign, Camera, RefreshCcw, UploadCloud, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface StaffScannerProps {
    staffId: string
}

export function StaffScanner({ staffId }: StaffScannerProps) {
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [scannerError, setScannerError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

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
        // Initialize scanner instance once
        const scanner = new Html5Qrcode("reader")
        scannerRef.current = scanner

        // Start scanning immediately
        startScanning(scanner, facingMode)

        // Cleanup on unmount
        return () => {
            if (scanner.isScanning) {
                scanner.stop().then(() => {
                    scanner.clear()
                }).catch(err => console.error("Failed to stop scanner", err))
            } else {
                scanner.clear()
            }
        }
    }, [])

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

        // Try to parse as URL first
        if (data.includes("http") || data.includes("happymeters.com")) {
            try {
                const urlObj = new URL(data)
                // Path: /admin/scan/TOKEN
                const parts = urlObj.pathname.split('/')
                // Filter empty parts
                const cleanParts = parts.filter(p => p.length > 0)

                // extract token (last part)
                const tokenCandidate = cleanParts[cleanParts.length - 1]
                if (tokenCandidate && tokenCandidate !== 'scan') {
                    payload = tokenCandidate
                    type = 'VISIT'
                }

                // Extract hint
                const typeParam = urlObj.searchParams.get('type')
                if (typeParam === 'POINTS') hintType = 'POINTS'
                if (typeParam === 'VISITS') hintType = 'VISITS'

            } catch (e) {
                // Fallback to simple split if URL parsing fails (e.g. partial URL)
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
        } else if (data.includes("/reservations/checkin/")) {
            type = "RESERVATION"
            payload = data.split("/reservations/checkin/")[1]?.split("?")[0] || data
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
            const res = await validateReservationScan(payload)
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
        <div className="w-full max-w-md mx-auto relative">
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
            `}</style>
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4">
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
                </div>

                {scannerError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {scannerError}
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
        </div>
    )
}
